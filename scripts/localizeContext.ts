import { asBoolean, asMaybe, asObject, asOptional, asString } from 'cleaners'

import {
  asContextStore,
  asLengthHint,
  asStringMap,
  chunk,
  CONTEXT_PATH,
  type ContextEntry,
  type ContextStore,
  ENGLISH_PATH,
  extractJsonObject,
  intArg,
  type LengthHint,
  mapPool,
  parseArgs,
  readJsonFile,
  readJsonFileOr,
  sha256,
  writeJsonFile
} from './localize/common'
import { choiceOf, JevClient, noulOf } from './localize/jev'
import { formatClaudeUsage, TokenLedger } from './localize/ledger'
import { askClaude, describeBackend, errorMessage } from './localize/llm'
import {
  distinctSites,
  findUsageSites,
  usageFilesOf,
  type UsageSite
} from './localize/usage'

/** What the model writes for one key. */
const asModelContext = asObject({
  description: asString,
  uiLocation: asString,
  placeholders: asOptional(asObject(asString), () => ({})),
  reuseReason: asOptional(asString),
  lengthHint: asOptional(asLengthHint),
  sameMeaning: asOptional(asBoolean)
})
type ModelContext = ReturnType<typeof asModelContext>

interface PendingKey {
  key: string
  english: string
  sites: UsageSite[]
  /** One site per file and component, which the model and Jev see. */
  distinct: UsageSite[]
  usageFiles: string[]
  sourceHash: string
}

interface JevContext {
  lengthHint: LengthHint
  /** Sites from pairs Jev scored as different meanings. */
  reuseSites: string[]
}

interface DescribeOptions {
  askLengthHint: boolean
  askReuse: boolean
}

/**
 * Which model decides lengthHint and reuseWarning.
 * A field moves to Jev only when the `--compare` pilot shows at least
 * 90 percent agreement with Claude. lengthHint agreed 85 percent on the
 * first 100 keys and stays on Claude; reuse agreed 95 percent.
 * Jev screens every key for reuse and Claude confirms the flagged ones:
 * on the full run Claude cleared 30 of the 32 keys Jev flagged.
 * Without TYPESAFE_API_KEY Claude decides both.
 */
const FIELD_SOURCES: { lengthHint: 'jev' | 'claude'; reuse: 'jev' | 'claude' } =
  { lengthHint: 'claude', reuse: 'jev' }

const MODEL = 'sonnet'
const BATCH_SIZE = 40
const CLAUDE_CONCURRENCY = 4
const JEV_CONCURRENCY = 8
/** Usage sites shown to the model per key. */
const MODEL_SITE_LIMIT = 3
/** Usage sites compared pairwise by Jev per key (6 pairs). */
const JEV_SITE_LIMIT = 4
const REUSE_THRESHOLD = 0.5

const LENGTH_CRITERIA: Record<LengthHint, string> = {
  button: 'A short action label on a button, tab, menu item or link',
  label: 'A short title, heading, field label, column header or status word',
  paragraph:
    'A sentence or longer: a message, description, error, warning or explanation'
}

const SYSTEM_PROMPT = `You document the user-facing strings of Edge, a mobile crypto wallet app built with React Native, so translators understand each string.

You receive a JSON array. Each item has a string key, its English value, and up to ${MODEL_SITE_LIMIT} code snippets where the app uses it (file, enclosing component, about 15 lines of code). "siteCount" is the total number of usage sites.

Reply with one JSON object and nothing else, keyed by string key. Each value is an object with:
- "description": one or two sentences on what the string means and where and when the user sees it. Name the action or the thing it refers to, so a translator can pick the right word.
- "uiLocation": the scene, modal or component that shows it, as a short human-readable name (for example "Send scene, fee row").
- "placeholders": an object mapping each sprintf token in the English value (%s, %1$s, %2$s, %d) to what it stands for at runtime. Use {} when there are none.
Extra fields, only when the item asks for them:
- "sameMeaning" and "reuseReason": when the item has "reuseFlagged", the listed sites scored as different meanings in a first check. Read them: "sameMeaning" is true when they use the string with the same meaning after all, false when they need different translations. When false, "reuseReason" is one line on how the meaning differs.
- "lengthHint": when the item has "askLengthHint", one of "button" (short action label), "label" (short title, field label or status word) or "paragraph" (a sentence or longer).
- "sameMeaning": when the item has "askReuse", true when every site uses the string with the same meaning, false when two sites need different translations. When false, also give "reuseReason".
When a string has no usage sites, infer its meaning from the key and the English value.`

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const limit = intArg(args, 'limit')
  const compare = args.has('compare')

  const english = readJsonFile(ENGLISH_PATH, asStringMap)
  const oldStore = readJsonFileOr(CONTEXT_PATH, asContextStore, {})
  const keys = Object.keys(english)
  const sitesByKey = findUsageSites(new Set(keys))

  // Keep fresh entries, and queue new or changed keys:
  const store: ContextStore = {}
  const pending: PendingKey[] = []
  for (const key of keys) {
    const sites = sitesByKey.get(key) ?? []
    const usageFiles = usageFilesOf(sites)
    const sourceHash = sha256(english[key] + '\n' + usageFiles.join('\n'))
    const oldEntry = oldStore[key]
    if (oldEntry?.sourceHash === sourceHash) {
      store[key] = oldEntry
      continue
    }
    pending.push({
      key,
      english: english[key],
      sites,
      distinct: distinctSites(sites),
      usageFiles,
      sourceHash
    })
  }
  const work = limit == null ? pending : pending.slice(0, limit)
  console.log(
    `${keys.length} keys, ${keys.length - pending.length} up to date, ` +
      `${pending.length} new or changed, processing ${work.length}. ` +
      `Backend: ${describeBackend()}.`
  )

  const ledger = new TokenLedger()
  const jev = new JevClient(ledger)
  const lengthFromJev = jev.enabled && FIELD_SOURCES.lengthHint === 'jev'
  const reuseFromJev = jev.enabled && FIELD_SOURCES.reuse === 'jev'

  const jevContext = new Map<string, JevContext>()
  if (lengthFromJev || reuseFromJev || (compare && jev.enabled)) {
    await mapPool(work, JEV_CONCURRENCY, async item => {
      jevContext.set(item.key, await askJevContext(jev, item))
    })
  }

  const options: DescribeOptions = {
    askLengthHint: !lengthFromJev,
    askReuse: !reuseFromJev
  }
  const described = await describeAll(work, jevContext, options, ledger)

  const failed: string[] = []
  for (const item of work) {
    const model = described.get(item.key)
    if (model == null) {
      failed.push(item.key)
      continue
    }
    store[item.key] = buildEntry(item, model, jevContext.get(item.key), {
      lengthFromJev,
      reuseFromJev
    })
  }
  writeJsonFile(CONTEXT_PATH, sortLike(store, keys))

  if (compare) {
    if (!jev.enabled) throw new Error('--compare needs TYPESAFE_API_KEY')
    await compareWithClaude(work, jevContext, ledger)
  }

  const entries = Object.values(store)
  console.log(
    `\n${entries.length} of ${keys.length} keys have an entry. ` +
      `${entries.filter(entry => entry.unused).length} unused, ` +
      `${
        entries.filter(entry => entry.reuseWarning != null).length
      } with a reuseWarning.`
  )
  if (failed.length > 0) {
    console.log(`No reply for ${failed.length} keys: ${failed.join(', ')}`)
  }
  console.log(`\nTokens (${MODEL}):\n${ledger.format()}`)
}

/**
 * Asks Jev for the length hint and, for keys with two or more distinct
 * usage sites, whether each pair of sites shares one meaning.
 */
async function askJevContext(
  jev: JevClient,
  item: PendingKey
): Promise<JevContext> {
  const sites = item.distinct.slice(0, JEV_SITE_LIMIT)
  const lengthState = [
    `English UI string: "${item.english}"`,
    ...sites
      .slice(0, 2)
      .map(site => `Code that shows it (${site.file}):\n${site.snippet}`)
  ].join('\n\n')
  const lengthAnswers = await jev.ask(lengthState, {
    length: {
      type: 'choice',
      instructions: 'What kind of UI text is this string?',
      criteria: LENGTH_CRITERIA
    }
  })
  const lengthHint = asMaybe(asLengthHint)(choiceOf(lengthAnswers.length))

  const reuseSites = new Set<string>()
  for (let i = 0; i < sites.length; ++i) {
    for (let j = i + 1; j < sites.length; ++j) {
      const state = [
        `English UI string: "${item.english}"`,
        `Usage A (${siteLabel(sites[i])}):\n${sites[i].snippet}`,
        `Usage B (${siteLabel(sites[j])}):\n${sites[j].snippet}`
      ].join('\n\n')
      const answers = await jev.ask(state, {
        same: {
          type: 'noul',
          instructions:
            'The English string has the same meaning in usage A and usage B, so one translation fits both.'
        }
      })
      if (noulOf(answers.same) < REUSE_THRESHOLD) {
        reuseSites.add(siteLabel(sites[i]))
        reuseSites.add(siteLabel(sites[j]))
      }
    }
  }
  return { lengthHint: lengthHint ?? 'label', reuseSites: [...reuseSites] }
}

/**
 * Sends the keys to Claude in batches, retrying keys missing from a
 * reply once in a batch of their own.
 */
async function describeAll(
  work: PendingKey[],
  jevContext: Map<string, JevContext>,
  options: DescribeOptions,
  ledger: TokenLedger
): Promise<Map<string, ModelContext>> {
  const described = new Map<string, ModelContext>()
  const runBatches = async (items: PendingKey[]): Promise<void> => {
    await mapPool(
      chunk(items, BATCH_SIZE),
      CLAUDE_CONCURRENCY,
      async (batch, index) => {
        try {
          const replies = await describeBatch(
            batch,
            jevContext,
            options,
            ledger
          )
          for (const [key, reply] of replies) described.set(key, reply)
        } catch (error: unknown) {
          console.warn(`Batch ${index} failed: ${errorMessage(error)}`)
        }
        console.log(`  batch ${index + 1} done, ${described.size} described`)
      }
    )
  }
  await runBatches(work)
  const missing = work.filter(item => !described.has(item.key))
  if (missing.length > 0) {
    console.log(`Retrying ${missing.length} keys missing from the replies`)
    await runBatches(missing)
  }
  return described
}

async function describeBatch(
  batch: PendingKey[],
  jevContext: Map<string, JevContext>,
  options: DescribeOptions,
  ledger: TokenLedger
): Promise<Map<string, ModelContext>> {
  const items = batch.map(item => {
    const reuseSites = jevContext.get(item.key)?.reuseSites ?? []
    return {
      key: item.key,
      english: item.english,
      siteCount: item.sites.length,
      sites: item.distinct.slice(0, MODEL_SITE_LIMIT).map(site => ({
        file: site.file,
        component: site.component,
        code: site.snippet
      })),
      ...(options.askLengthHint ? { askLengthHint: true } : {}),
      ...(options.askReuse && item.distinct.length > 1
        ? { askReuse: true }
        : {}),
      ...(!options.askReuse && reuseSites.length > 0
        ? { reuseFlagged: reuseSites }
        : {})
    }
  })
  const reply = await askClaude(
    {
      model: MODEL,
      system: SYSTEM_PROMPT,
      prompt: JSON.stringify(items, null, 1)
    },
    ledger
  )
  const parsed = asObject(asMaybe(asModelContext))(extractJsonObject(reply))
  const result = new Map<string, ModelContext>()
  for (const item of batch) {
    const context = parsed[item.key]
    if (context != null) result.set(item.key, context)
  }
  return result
}

function buildEntry(
  item: PendingKey,
  model: ModelContext,
  jevContext: JevContext | undefined,
  sources: { lengthFromJev: boolean; reuseFromJev: boolean }
): ContextEntry {
  const lengthHint = sources.lengthFromJev
    ? jevContext?.lengthHint
    : model.lengthHint
  // Claude reviews the sites Jev flags and clears the false alarms:
  const reuseSites = sources.reuseFromJev
    ? model.sameMeaning === true
      ? []
      : jevContext?.reuseSites ?? []
    : model.sameMeaning === false
    ? item.distinct.slice(0, MODEL_SITE_LIMIT).map(siteLabel)
    : []
  return {
    description: model.description,
    uiLocation: model.uiLocation,
    placeholders: model.placeholders,
    lengthHint: lengthHint ?? 'label',
    usageFiles: item.usageFiles,
    reuseWarning:
      reuseSites.length > 0
        ? {
            sites: reuseSites,
            reason: model.reuseReason ?? 'Used with different meanings.'
          }
        : undefined,
    unused: item.sites.length === 0,
    sourceHash: item.sourceHash
  }
}

/**
 * Pilot check: runs the all-Claude path on the same keys and prints how
 * often Claude agrees with Jev on lengthHint and on reuse flags.
 */
async function compareWithClaude(
  work: PendingKey[],
  jevContext: Map<string, JevContext>,
  jevPathLedger: TokenLedger
): Promise<void> {
  const claudeLedger = new TokenLedger()
  const claudeOnly = await describeAll(
    work,
    new Map(),
    { askLengthHint: true, askReuse: true },
    claudeLedger
  )

  let lengthCompared = 0
  let lengthAgreed = 0
  let reuseCompared = 0
  let reuseAgreed = 0
  const disagreements: string[] = []
  for (const item of work) {
    const claude = claudeOnly.get(item.key)
    const jev = jevContext.get(item.key)
    if (claude == null || jev == null) continue
    if (claude.lengthHint != null) {
      ++lengthCompared
      if (claude.lengthHint === jev.lengthHint) ++lengthAgreed
      else {
        disagreements.push(
          `lengthHint ${item.key}: Claude ${claude.lengthHint}, Jev ${jev.lengthHint} ("${item.english}")`
        )
      }
    }
    if (item.distinct.length > 1) {
      ++reuseCompared
      const claudeFlagged = claude.sameMeaning === false
      const jevFlagged = jev.reuseSites.length > 0
      if (claudeFlagged === jevFlagged) ++reuseAgreed
      else {
        disagreements.push(
          `reuse ${item.key}: Claude ${claudeFlagged ? 'flagged' : 'clear'}, ` +
            `Jev ${jevFlagged ? 'flagged' : 'clear'}` +
            (claude.reuseReason != null ? ` (${claude.reuseReason})` : '')
        )
      }
    }
  }

  console.log('\nPilot comparison, all-Claude path vs Jev path:')
  console.log(
    `lengthHint agreement: ${lengthAgreed}/${lengthCompared} (${percent(
      lengthAgreed,
      lengthCompared
    )})`
  )
  console.log(
    `reuse agreement on keys with 2+ distinct sites: ${reuseAgreed}/${reuseCompared} (${percent(
      reuseAgreed,
      reuseCompared
    )})`
  )
  for (const line of disagreements) console.log(`  ${line}`)
  console.log(
    `All-Claude path tokens: ${formatClaudeUsage(claudeLedger.claudeTotal())}`
  )
  console.log(
    `Jev path tokens: Claude ${formatClaudeUsage(
      jevPathLedger.claudeTotal()
    )}; Jev ${jevPathLedger.jev.calls} calls, input ${
      jevPathLedger.jev.inputTokens
    }, output ${jevPathLedger.jev.outputTokens}`
  )
}

function siteLabel(site: UsageSite): string {
  return `${site.file}:${site.line} (${site.component})`
}

function sortLike<T>(
  map: Record<string, T>,
  keys: string[]
): Record<string, T> {
  const sorted: Record<string, T> = {}
  for (const key of keys) {
    if (map[key] != null) sorted[key] = map[key]
  }
  return sorted
}

function percent(part: number, whole: number): string {
  return whole === 0 ? 'n/a' : `${((100 * part) / whole).toFixed(1)}%`
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
