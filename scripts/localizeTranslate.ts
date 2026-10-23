import { asObject, asString, asValue } from 'cleaners'
import path from 'path'

import {
  AI_STRINGS_DIR,
  asContextStore,
  asStringMap,
  chunk,
  CONTEXT_PATH,
  type ContextEntry,
  type ContextStore,
  ENGLISH_PATH,
  extractJsonObject,
  intArg,
  mapPool,
  parseArgs,
  placeholderProblem,
  readJsonFile,
  readJsonFileOr,
  ROOT_DIR,
  type StringMap,
  writeJsonFile
} from './localize/common'
import { choiceOf, JevClient, type JevQuestion, noulOf } from './localize/jev'
import { TokenLedger } from './localize/ledger'
import { askClaude, describeBackend, errorMessage } from './localize/llm'
import { type LocaleConfig, LOCALES } from './localize/locales'

/**
 * How a batch goes to Claude:
 * baseline sends the batch once per locale,
 * multi sends it once for a group of locales,
 * prefix caches the batch as the system prompt and sends one short
 * request per locale after it.
 */
const asShape = asValue('baseline', 'multi', 'prefix')
type Shape = ReturnType<typeof asShape>

/**
 * enforce retries and then empties values the Jev gate rejects,
 * report keeps them and only lists the rejections.
 * Placeholder mismatches are always enforced.
 */
const asGateMode = asValue('enforce', 'report')
type GateMode = ReturnType<typeof asGateMode>

/** Locale to key to the context sourceHash it was translated from. */
const asTranslateState = asObject(asObject(asString))

interface Rejection {
  key: string
  english: string
  value: string
  problem: string
  /** True for Jev gate rejections, false for placeholder problems. */
  fromGate: boolean
}

interface LocaleResult {
  values: StringMap
  firstPass: Rejection[]
  failures: Rejection[]
}

/** Terms every locale keeps in English. */
export const KEEP_ENGLISH =
  'Edge, ticker symbols (BTC, ETH, USDT and so on), token standards (ERC-20), ' +
  'and product, partner and network names (FIO, WalletConnect, Thorchain, ' +
  'MoonPay, Banxa, Apple Pay, Google Pay, PIX, SEPA)'

const JEV_LANGUAGES = [
  'English',
  'German',
  'Spanish',
  'French',
  'Italian',
  'Japanese',
  'Korean',
  'Portuguese',
  'Russian',
  'Vietnamese',
  'Chinese',
  'Other'
]

/**
 * The es and it pilot (100 keys each) used about the same output for every
 * shape. Prefix wrote half the cache of baseline and read the rest from it,
 * and kept closer to the baseline wording than multi did.
 */
const DEFAULT_SHAPE: Shape = 'prefix'
/**
 * The Jev gate rejected 5 values over the three pilot runs and all 5 were
 * good translations, so its rejections are listed but not enforced.
 */
const DEFAULT_GATE: GateMode = 'report'
const MODEL = 'sonnet'
const BATCH_SIZE = 40
/** Locales per request in the multi shape. */
const MULTI_GROUP_SIZE = 4
const CLAUDE_CONCURRENCY = 4
const JEV_CONCURRENCY = 8
const MEANING_THRESHOLD = 0.5
const STATE_PATH = path.join(
  ROOT_DIR,
  'src/locales/context/translateState.json'
)

const SYSTEM_PROMPT = `You translate the user interface strings of Edge, a mobile crypto wallet app, from English.

Each item has a string key, the English value, and context: what the string means and where it shows, what each placeholder stands for, and whether it is a button, a label or a paragraph. Use the context to choose the right words. Keep buttons and labels short.

Rules:
- Keep every sprintf placeholder exactly as written (%s, %1$s, %2$s, %d), the same number of times. Move positional placeholders only where the grammar needs it.
- Keep every line break (\\n) and any leading or trailing space where the English has one.
- Keep these in English: ${KEEP_ENGLISH}.
- Do not add or drop information, and do not add quotes, notes or explanations.

Reply with one JSON object and nothing else.`

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const locales = parseLocales(args.get('locale'))
  const limit = intArg(args, 'limit')
  const outDir = path.resolve(args.get('out') ?? AI_STRINGS_DIR)
  const statePath = path.resolve(args.get('state') ?? STATE_PATH)
  const shape = asShape(args.get('shape') ?? DEFAULT_SHAPE)
  const gateMode = asGateMode(args.get('gate') ?? DEFAULT_GATE)
  const reportPath = args.get('report')

  const english = readJsonFile(ENGLISH_PATH, asStringMap)
  const context = readJsonFile(
    path.resolve(args.get('context') ?? CONTEXT_PATH),
    asContextStore
  )
  const state = readJsonFileOr(statePath, asTranslateState, {})
  const keys = Object.keys(english)
  const missingContext = keys.filter(key => context[key] == null)
  if (missingContext.length > 0) {
    console.warn(
      `${missingContext.length} keys have no context entry and are skipped. ` +
        'Run localize:context first.'
    )
  }

  const pendingByLocale = new Map<string, string[]>()
  for (const locale of locales) {
    const done = state[locale] ?? {}
    const pending = keys.filter(
      key => context[key] != null && done[key] !== context[key].sourceHash
    )
    pendingByLocale.set(
      locale,
      limit == null ? pending : pending.slice(0, limit)
    )
  }
  console.log(
    `Translating with shape ${shape}, gate ${gateMode}, backend ${describeBackend()}:`
  )
  for (const [locale, pending] of pendingByLocale) {
    console.log(`  ${locale}: ${pending.length} keys`)
  }

  const ledger = new TokenLedger()
  const jev = new JevClient(ledger)
  const firstPass = await requestTranslations(
    shape,
    pendingByLocale,
    english,
    context,
    ledger
  )

  const results = new Map<string, LocaleResult>()
  for (const [locale, pending] of pendingByLocale) {
    results.set(
      locale,
      await finishLocale(locale, pending, firstPass.get(locale) ?? {}, {
        english,
        context,
        gateMode,
        jev,
        ledger
      })
    )
  }

  const report: Record<string, Omit<LocaleResult, 'values'>> = {}
  for (const [locale, result] of results) {
    const outPath = path.join(outDir, `${locale}.json`)
    const existing = readJsonFileOr(outPath, asStringMap, {})
    const merged: StringMap = {}
    for (const key of keys) {
      const value = result.values[key] ?? existing[key]
      if (value != null) merged[key] = value
    }
    writeJsonFile(outPath, merged)

    const done = state[locale] ?? {}
    const failed = new Set(result.failures.map(failure => failure.key))
    for (const key of pendingByLocale.get(locale) ?? []) {
      if (!failed.has(key)) done[key] = context[key].sourceHash
    }
    state[locale] = done
    report[locale] = { firstPass: result.firstPass, failures: result.failures }

    const gateRejections = result.firstPass.filter(item => item.fromGate)
    console.log(
      `\n${locale}: ${pendingByLocale.get(locale)?.length ?? 0} translated, ` +
        `${
          result.firstPass.length - gateRejections.length
        } placeholder problems and ` +
        `${gateRejections.length} gate rejections on the first pass, ` +
        `${result.failures.length} left empty`
    )
    if (gateMode === 'report') {
      for (const rejection of gateRejections) {
        console.log(`  gate: ${rejection.key}: ${rejection.problem}`)
      }
    }
    for (const failure of result.failures) {
      console.log(`  ${failure.key}: ${failure.problem}`)
    }
  }
  writeJsonFile(statePath, state)
  if (reportPath != null) writeJsonFile(path.resolve(reportPath), report)
  console.log(`\nTokens (${MODEL}):\n${ledger.format()}`)
}

/**
 * Requests the first-pass translations for every locale with the chosen
 * request shape.
 */
async function requestTranslations(
  shape: Shape,
  pendingByLocale: Map<string, string[]>,
  english: StringMap,
  context: ContextStore,
  ledger: TokenLedger
): Promise<Map<string, StringMap>> {
  const translations = new Map<string, StringMap>()
  const store = (locale: string, values: StringMap): void => {
    translations.set(locale, { ...translations.get(locale), ...values })
  }

  const groups =
    shape === 'multi'
      ? chunk([...pendingByLocale.keys()], MULTI_GROUP_SIZE)
      : [...pendingByLocale.keys()].map(locale => [locale])
  const jobs: Array<{ locales: string[]; batch: string[] }> = []
  for (const locales of groups) {
    const groupKeys = new Set(
      locales.flatMap(locale => pendingByLocale.get(locale) ?? [])
    )
    const ordered = Object.keys(english).filter(key => groupKeys.has(key))
    for (const batch of chunk(ordered, BATCH_SIZE))
      jobs.push({ locales, batch })
  }

  // The prefix shape sends every locale of one batch back to back,
  // so each request after the first reads the batch from the cache:
  if (shape === 'prefix') {
    const batches = new Map<string, string[]>()
    for (const job of jobs) batches.set(job.batch.join(','), job.batch)
    await mapPool(
      [...batches.values()],
      CLAUDE_CONCURRENCY,
      async (batch, index) => {
        const system = `${SYSTEM_PROMPT}\n\nStrings to translate:\n${batchJson(
          batch,
          english,
          context
        )}`
        for (const locale of pendingByLocale.keys()) {
          const wanted = batch.filter(
            key => pendingByLocale.get(locale)?.includes(key) === true
          )
          if (wanted.length === 0) continue
          store(
            locale,
            await translateRequest(
              system,
              `Translate every string above into ${describeLocale(
                locale
              )}\nReply with a JSON object mapping each key to its translation.`,
              ledger,
              `batch ${index + 1} ${locale}`
            )
          )
        }
        console.log(`  batch ${index + 1} of ${batches.size} done`)
      }
    )
    return translations
  }

  await mapPool(jobs, CLAUDE_CONCURRENCY, async (job, index) => {
    const items = batchJson(job.batch, english, context)
    if (job.locales.length === 1) {
      const [locale] = job.locales
      store(
        locale,
        await translateRequest(
          SYSTEM_PROMPT,
          `Translate into ${describeLocale(
            locale
          )}\nReply with a JSON object mapping each key to its translation.\n\n${items}`,
          ledger,
          `batch ${index + 1} ${locale}`
        )
      )
    } else {
      const targets = job.locales
        .map(locale => `- "${locale}": ${describeLocale(locale)}`)
        .join('\n')
      const reply = await translateMultiRequest(
        `Translate every string into each of these locales:\n${targets}\n` +
          'Reply with a JSON object keyed by locale code, each mapping every key to its translation.\n\n' +
          items,
        ledger,
        `batch ${index + 1} ${job.locales.join('+')}`
      )
      for (const locale of job.locales) store(locale, reply[locale] ?? {})
    }
    console.log(`  request ${index + 1} of ${jobs.length} done`)
  })
  return translations
}

/**
 * Validates one locale's first pass, retries rejected keys once,
 * and empties the keys that still fail.
 */
async function finishLocale(
  locale: string,
  pending: string[],
  firstPass: StringMap,
  env: {
    english: StringMap
    context: ContextStore
    gateMode: GateMode
    jev: JevClient
    ledger: TokenLedger
  }
): Promise<LocaleResult> {
  const { english, context, gateMode, ledger } = env
  const values: StringMap = {}
  const rejections = await validate(locale, pending, firstPass, env)
  const rejected = new Map<string, Rejection>()
  for (const rejection of rejections) {
    if (rejection.fromGate && gateMode === 'report') continue
    rejected.set(rejection.key, rejection)
  }
  for (const key of pending) {
    if (!rejected.has(key)) values[key] = firstPass[key] ?? ''
  }

  const failures: Rejection[] = []
  if (rejected.size > 0) {
    console.log(`${locale}: retrying ${rejected.size} rejected keys`)
    const retryKeys = [...rejected.keys()]
    const retried: StringMap = {}
    await mapPool(
      chunk(retryKeys, BATCH_SIZE),
      CLAUDE_CONCURRENCY,
      async (batch, index) => {
        const notes = batch
          .map(key => `- ${key}: ${rejected.get(key)?.problem ?? ''}`)
          .join('\n')
        Object.assign(
          retried,
          await translateRequest(
            SYSTEM_PROMPT,
            `Translate into ${describeLocale(locale)}\n` +
              `A previous translation of these strings was rejected:\n${notes}\n` +
              'Fix those problems. Reply with a JSON object mapping each key to its translation.\n\n' +
              batchJson(batch, english, context),
            ledger,
            `retry ${index + 1} ${locale}`
          )
        )
      }
    )
    const retryRejections = await validate(locale, retryKeys, retried, env)
    const stillRejected = new Map<string, Rejection>()
    for (const rejection of retryRejections) {
      if (rejection.fromGate && gateMode === 'report') continue
      stillRejected.set(rejection.key, rejection)
    }
    for (const key of retryKeys) {
      const rejection = stillRejected.get(key)
      if (rejection == null) values[key] = retried[key]
      else {
        values[key] = ''
        failures.push(rejection)
      }
    }
  }
  return { values, firstPass: rejections, failures }
}

/**
 * Checks placeholders and line breaks, then asks Jev whether each value
 * keeps the English meaning and is written in the target language.
 */
async function validate(
  locale: string,
  keys: string[],
  values: StringMap,
  env: { english: StringMap; context: ContextStore; jev: JevClient }
): Promise<Rejection[]> {
  const { english, context, jev } = env
  const config = LOCALES[locale]
  const rejections: Rejection[] = []
  const gateKeys: string[] = []
  for (const key of keys) {
    const value = values[key]
    const problem =
      value == null
        ? 'missing from the reply'
        : placeholderProblem(english[key], value)
    if (problem != null) {
      rejections.push({
        key,
        english: english[key],
        value: value ?? '',
        problem,
        fromGate: false
      })
    } else gateKeys.push(key)
  }
  if (!jev.enabled) return rejections

  await mapPool(gateKeys, JEV_CONCURRENCY, async key => {
    const value = values[key]
    const checkLanguage =
      config.jevLanguage != null && value.trim() !== english[key].trim()
    const problem = await gateProblem(
      jev,
      config,
      english[key],
      value,
      context[key],
      checkLanguage
    ).catch((error: unknown) => {
      console.warn(`Jev failed on ${locale} ${key}: ${errorMessage(error)}`)
      return undefined
    })
    if (problem != null) {
      rejections.push({
        key,
        english: english[key],
        value,
        problem,
        fromGate: true
      })
    }
  })
  return rejections
}

async function gateProblem(
  jev: JevClient,
  config: LocaleConfig,
  english: string,
  value: string,
  entry: ContextEntry,
  checkLanguage: boolean
): Promise<string | undefined> {
  const state =
    `English source: "${english}"\n` +
    `Context: ${entry.description}\n` +
    `Translation: "${value}"`
  const questions: Record<string, JevQuestion> = {
    meaning: {
      type: 'noul',
      instructions:
        'The translation conveys the same meaning as the English source.'
    }
  }
  if (checkLanguage) {
    questions.language = {
      type: 'choice',
      instructions: 'Which language is the translation written in?',
      criteria: Object.fromEntries(JEV_LANGUAGES.map(name => [name, null]))
    }
  }
  const answers = await jev.ask(state, questions)
  const problems: string[] = []
  const score = noulOf(answers.meaning)
  if (score < MEANING_THRESHOLD) {
    problems.push(`meaning score ${score.toFixed(2)}`)
  }
  if (answers.language != null) {
    const detected = choiceOf(answers.language)
    if (detected !== config.jevLanguage) {
      problems.push(`language detected as ${detected}`)
    }
  }
  return problems.length > 0 ? problems.join(', ') : undefined
}

async function translateRequest(
  system: string,
  prompt: string,
  ledger: TokenLedger,
  label: string
): Promise<StringMap> {
  try {
    const reply = await askClaude({ model: MODEL, system, prompt }, ledger)
    return asObject(asString)(extractJsonObject(reply))
  } catch (error: unknown) {
    console.warn(`${label} failed: ${errorMessage(error)}`)
    return {}
  }
}

async function translateMultiRequest(
  prompt: string,
  ledger: TokenLedger,
  label: string
): Promise<Record<string, StringMap>> {
  try {
    const reply = await askClaude(
      { model: MODEL, system: SYSTEM_PROMPT, prompt },
      ledger
    )
    return asObject(asObject(asString))(extractJsonObject(reply))
  } catch (error: unknown) {
    console.warn(`${label} failed: ${errorMessage(error)}`)
    return {}
  }
}

function batchJson(
  batch: string[],
  english: StringMap,
  context: ContextStore
): string {
  const items = batch.map(key => {
    const entry = context[key]
    return {
      key,
      english: english[key],
      description: entry.description,
      uiLocation: entry.uiLocation,
      lengthHint: entry.lengthHint,
      ...(Object.keys(entry.placeholders).length > 0
        ? { placeholders: entry.placeholders }
        : {}),
      ...(entry.reuseWarning != null
        ? { reuseWarning: entry.reuseWarning.reason }
        : {})
    }
  })
  return JSON.stringify(items, null, 1)
}

function describeLocale(locale: string): string {
  const config = LOCALES[locale]
  return `${config.language}. ${config.instructions}`
}

function parseLocales(value: string | undefined): string[] {
  if (value == null) {
    throw new Error('Pass --locale <code>, a comma-separated list, or all')
  }
  const locales = value === 'all' ? Object.keys(LOCALES) : value.split(',')
  for (const locale of locales) {
    if (LOCALES[locale] == null) throw new Error(`Unknown locale ${locale}`)
  }
  return locales
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
