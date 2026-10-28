import { asMaybe, asObject, asString, asValue } from 'cleaners'
import fs from 'fs'
import os from 'os'
import path from 'path'

import {
  AI_STRINGS_DIR,
  asContextStore,
  asStringMap,
  chunk,
  CONTEXT_PATH,
  type ContextStore,
  ENGLISH_PATH,
  extractJsonObject,
  intArg,
  mapPool,
  parseArgs,
  placeholderProblem,
  readJsonFile,
  readJsonFileOr,
  type StringMap,
  STRINGS_DIR
} from './localize/common'
import {
  type Bucket,
  bucketOf,
  checkThresholds,
  existingIsA,
  stableSample,
  type ThresholdCheck
} from './localize/compare'
import { JevClient, type JevQuestion, noulOf } from './localize/jev'
import { formatClaudeUsage, TokenLedger } from './localize/ledger'
import { askClaude, describeBackend, errorMessage } from './localize/llm'
import { LOCALES } from './localize/locales'

export type Verdict =
  | 'existing better'
  | 'AI better'
  | 'equivalent'
  | 'both wrong'
  | 'equivalent (pre-filter)'
  | 'not judged'

/** What the judge writes for one key, with A and B in shuffled order. */
const asJudgement = asObject({
  verdict: asValue('A', 'B', 'equivalent', 'both wrong'),
  reason: asString
})

interface Comparison {
  key: string
  english: string
  existing: string
  ai: string
  verdict: Verdict
  reason: string
}

interface LocaleReport {
  locale: string
  skippedEnglish: number
  skippedMissing: number
  buckets: Record<Bucket, number>
  verdicts: Record<Verdict, number>
  comparisons: Comparison[]
  /** Human translations Jev scored below the meaning threshold. */
  weakExisting: Array<{
    key: string
    english: string
    existing: string
    score: number
    /** The judge's verdict, when the key went to the judge. */
    verdict?: Verdict
  }>
  /** Jev's equivalence scores against the judge's verdicts, set when no pair skipped the judge. */
  thresholdCheck?: ThresholdCheck[]
  placeholderProblems: Array<{ file: string; key: string; problem: string }>
  judgeCallsRemoved: number
  ledger: TokenLedger
}

const MODEL = 'opus'
const BATCH_SIZE = 40
const CLAUDE_CONCURRENCY = 4
const JEV_CONCURRENCY = 8
/** With --prefilter, pairs Jev scores at or above this skip the judge as equivalent. */
const EQUIVALENCE_THRESHOLD = 0.9
const CHECK_THRESHOLDS = [0.8, 0.9, 0.95]
const MEANING_THRESHOLD = 0.5
const SAMPLE_SIZE = 50

const VERDICTS: Verdict[] = [
  'existing better',
  'AI better',
  'equivalent',
  'both wrong',
  'equivalent (pre-filter)',
  'not judged'
]

const SYSTEM_PROMPT = `You review translations of the user interface strings of Edge, a mobile crypto wallet app.

You receive a JSON array. Each item has a string key, the English source, context on what the string means and where it shows, and two candidate translations, A and B, into the same language.

Judge which candidate a native speaker would rather see in the app: accuracy of meaning first, then natural wording, then fit (a button label must stay short). Placeholders such as %s and %1$s stand for runtime values and must survive in both.

Reply with one JSON object and nothing else, keyed by string key. Each value is an object with:
- "verdict": "A" or "B" when that candidate is clearly better, "equivalent" when both are acceptable and neither is clearly better, or "both wrong" when neither conveys the English meaning.
- "reason": one short line in English naming the difference that decided it. Refer to the candidates only as [A] and [B], with the brackets.`

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const localeArg = args.get('locale')
  if (localeArg == null) {
    throw new Error('Pass --locale <code> or a comma-separated list')
  }
  const locales = localeArg.split(',')
  for (const locale of locales) {
    if (LOCALES[locale] == null) throw new Error(`Unknown locale ${locale}`)
  }
  const outDir = path.resolve(args.get('out') ?? os.tmpdir())
  const aiDir = path.resolve(args.get('ai') ?? AI_STRINGS_DIR)
  const limit = intArg(args, 'limit')
  const prefilter = args.has('prefilter')

  const english = readJsonFile(ENGLISH_PATH, asStringMap)
  const context = readJsonFileOr(CONTEXT_PATH, asContextStore, {})
  console.log(`Comparing with judge ${MODEL}, backend ${describeBackend()}.`)

  const summaries: string[] = []
  for (const locale of locales) {
    const existing = readJsonFile(
      path.join(STRINGS_DIR, `${locale}.json`),
      asStringMap
    )
    const ai = readJsonFile(path.join(aiDir, `${locale}.json`), asStringMap)
    const report = await compareLocale(locale, {
      english,
      existing,
      ai,
      context,
      limit,
      prefilter
    })
    const outPath = path.join(outDir, `ai-compare-${locale}.md`)
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(outPath, formatReport(report))
    console.log(`\n${locale}: wrote ${outPath}`)
    console.log(report.ledger.format())
    summaries.push(summaryRow(report))
  }
  console.log(`\n${SUMMARY_HEADER}\n${summaries.join('\n')}`)
}

async function compareLocale(
  locale: string,
  input: {
    english: StringMap
    existing: StringMap
    ai: StringMap
    context: ContextStore
    limit: number | undefined
    prefilter: boolean
  }
): Promise<LocaleReport> {
  const { english, existing, ai, context, limit, prefilter } = input
  const ledger = new TokenLedger()
  const jev = new JevClient(ledger)

  // Pick the keys a human translated, which the loader shows instead of English:
  let skippedEnglish = 0
  let skippedMissing = 0
  const translated: string[] = []
  for (const key of Object.keys(english)) {
    const value = existing[key]
    if (value == null || value === '') ++skippedMissing
    else if (value === english[key]) ++skippedEnglish
    else translated.push(key)
  }
  const keys = limit == null ? translated : translated.slice(0, limit)

  const buckets: Record<Bucket, number> = {
    identical: 0,
    trivial: 0,
    different: 0
  }
  const different: string[] = []
  for (const key of keys) {
    const bucket = bucketOf(existing[key], ai[key] ?? '')
    ++buckets[bucket]
    if (bucket === 'different') different.push(key)
  }

  // One Jev call per key checks the human translation,
  // and for different pairs also whether the two mean the same:
  const differentSet = new Set(different)
  const weakExisting: LocaleReport['weakExisting'] = []
  const equivalenceScores = new Map<string, number>()
  const preFiltered = new Set<string>()
  if (jev.enabled) {
    await mapPool(keys, JEV_CONCURRENCY, async key => {
      const questions: Record<string, JevQuestion> = {
        existingMeaning: {
          type: 'noul',
          instructions:
            'Translation A conveys the same meaning as the English source.'
        }
      }
      if (differentSet.has(key) && ai[key] !== '') {
        questions.equivalent = {
          type: 'noul',
          instructions:
            'Translation A and translation B have the same meaning as each other.'
        }
      }
      const state =
        `English source: "${english[key]}"\n` +
        `Context: ${context[key]?.description ?? 'none'}\n` +
        `Translation A: "${existing[key]}"\n` +
        (questions.equivalent != null ? `Translation B: "${ai[key]}"` : '')
      try {
        const answers = await jev.ask(state, questions)
        const score = noulOf(answers.existingMeaning)
        if (score < MEANING_THRESHOLD) {
          weakExisting.push({
            key,
            english: english[key],
            existing: existing[key],
            score
          })
        }
        if (answers.equivalent != null) {
          const equivalence = noulOf(answers.equivalent)
          equivalenceScores.set(key, equivalence)
          if (prefilter && equivalence >= EQUIVALENCE_THRESHOLD) {
            preFiltered.add(key)
          }
        }
      } catch (error: unknown) {
        console.warn(`Jev failed on ${locale} ${key}: ${errorMessage(error)}`)
      }
    })
  }

  const comparisons: Comparison[] = []
  const toJudge: string[] = []
  for (const key of different) {
    if (preFiltered.has(key)) {
      comparisons.push({
        key,
        english: english[key],
        existing: existing[key],
        ai: ai[key] ?? '',
        verdict: 'equivalent (pre-filter)',
        reason: 'Jev scored the two as the same meaning.'
      })
    } else toJudge.push(key)
  }
  console.log(
    `${locale}: ${keys.length} translated keys, ${different.length} different, ` +
      `${preFiltered.size} pre-filtered, judging ${toJudge.length}`
  )

  const batches = chunk(toJudge, BATCH_SIZE)
  await mapPool(batches, CLAUDE_CONCURRENCY, async (batch, index) => {
    const judgements = await judgeBatch(batch, input, ledger).catch(
      (error: unknown) => {
        console.warn(
          `${locale} batch ${index + 1} failed: ${errorMessage(error)}`
        )
        return new Map<string, Comparison>()
      }
    )
    for (const key of batch) {
      comparisons.push(
        judgements.get(key) ?? {
          key,
          english: english[key],
          existing: existing[key],
          ai: ai[key] ?? '',
          verdict: 'not judged',
          reason: 'The judge did not answer.'
        }
      )
    }
    console.log(`  ${locale} batch ${index + 1} of ${batches.length} judged`)
  })

  const verdicts = Object.fromEntries(
    VERDICTS.map(verdict => [verdict, 0])
  ) as Record<Verdict, number>
  for (const comparison of comparisons) ++verdicts[comparison.verdict]
  const verdictByKey = new Map(
    comparisons.map(comparison => [comparison.key, comparison.verdict])
  )
  for (const item of weakExisting) item.verdict = verdictByKey.get(item.key)

  const placeholderProblems: LocaleReport['placeholderProblems'] = []
  for (const [file, values] of [
    [`strings/${locale}.json`, existing],
    [`strings-ai/${locale}.json`, ai]
  ] as const) {
    for (const key of Object.keys(english)) {
      const value = values[key]
      if (value == null || value === '') continue
      const problem = placeholderProblem(english[key], value)
      if (problem != null) placeholderProblems.push({ file, key, problem })
    }
  }

  return {
    locale,
    skippedEnglish,
    skippedMissing,
    buckets,
    verdicts,
    comparisons: sortByEnglishOrder(comparisons, english),
    weakExisting: sortByEnglishOrder(weakExisting, english),
    thresholdCheck: prefilter
      ? undefined
      : checkThresholds(equivalenceScores, verdictByKey, CHECK_THRESHOLDS),
    placeholderProblems,
    judgeCallsRemoved:
      Math.ceil(different.length / BATCH_SIZE) - batches.length,
    ledger
  }
}

/**
 * Asks the judge about one batch, showing the existing and AI values as
 * A and B in an order fixed by the key hash, so neither side always comes first.
 */
async function judgeBatch(
  batch: string[],
  input: {
    english: StringMap
    existing: StringMap
    ai: StringMap
    context: ContextStore
  },
  ledger: TokenLedger
): Promise<Map<string, Comparison>> {
  const { english, existing, ai, context } = input
  const items = batch.map(key => {
    const [a, b] = existingIsA(key)
      ? [existing[key], ai[key] ?? '']
      : [ai[key] ?? '', existing[key]]
    return {
      key,
      english: english[key],
      context: context[key]?.description,
      lengthHint: context[key]?.lengthHint,
      A: a,
      B: b
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
  const parsed = asObject(asMaybe(asJudgement))(extractJsonObject(reply))
  const result = new Map<string, Comparison>()
  for (const key of batch) {
    const judgement = parsed[key]
    if (judgement == null) continue
    result.set(key, {
      key,
      english: english[key],
      existing: existing[key],
      ai: ai[key] ?? '',
      verdict: verdictOf(judgement.verdict, existingIsA(key)),
      reason: nameCandidates(judgement.reason, existingIsA(key))
    })
  }
  return result
}

function verdictOf(
  verdict: ReturnType<typeof asJudgement>['verdict'],
  existingFirst: boolean
): Verdict {
  if (verdict === 'equivalent' || verdict === 'both wrong') return verdict
  return (verdict === 'A') === existingFirst ? 'existing better' : 'AI better'
}

const SUMMARY_HEADER =
  '| Locale | Compared | Identical | Trivial | Different | Pre-filtered | Existing better | AI better | Equivalent | Both wrong | Weak human (Jev) | Placeholder problems |\n' +
  '|---|---|---|---|---|---|---|---|---|---|---|---|'

function summaryRow(report: LocaleReport): string {
  const { buckets, verdicts } = report
  return `| ${[
    report.locale,
    buckets.identical + buckets.trivial + buckets.different,
    buckets.identical,
    buckets.trivial,
    buckets.different,
    verdicts['equivalent (pre-filter)'],
    verdicts['existing better'],
    verdicts['AI better'],
    verdicts.equivalent,
    verdicts['both wrong'],
    report.weakExisting.length,
    report.placeholderProblems.length
  ].join(' | ')} |`
}

function formatReport(report: LocaleReport): string {
  const { locale, buckets, verdicts, comparisons, ledger } = report
  const byVerdict = (verdict: Verdict): Comparison[] =>
    comparisons.filter(comparison => comparison.verdict === verdict)
  const claude = ledger.claudeTotal()
  const lines: string[] = [
    `# AI translation compare: ${locale}`,
    '',
    `Existing values are \`src/locales/strings/${locale}.json\`; AI values are \`src/locales/strings-ai/${locale}.json\`. ` +
      `Keys whose existing value equals English (${report.skippedEnglish}) or is empty or missing (${report.skippedMissing}) are not compared.`,
    '',
    '## Counts',
    '',
    '| Bucket | Keys |',
    '|---|---|',
    `| identical | ${buckets.identical} |`,
    `| trivial (case, spacing, quotes, trailing punctuation) | ${buckets.trivial} |`,
    `| different | ${buckets.different} |`,
    '',
    '| Verdict on different keys | Keys |',
    '|---|---|',
    ...VERDICTS.filter(
      verdict => verdict !== 'not judged' || verdicts[verdict] > 0
    ).map(verdict => `| ${verdict} | ${verdicts[verdict]} |`),
    '',
    ...(report.thresholdCheck != null
      ? thresholdSection(report.thresholdCheck)
      : [
          `Jev pre-filter: ${verdicts['equivalent (pre-filter)']} pairs scored ${EQUIVALENCE_THRESHOLD} or more as the same meaning and skipped the judge, ` +
            `removing ${report.judgeCallsRemoved} judge calls of ${BATCH_SIZE} keys each.`,
          ''
        ]),
    'Tokens:',
    '',
    `- Claude ${MODEL} (judge): ${formatClaudeUsage(claude)}`,
    `- Jev: ${ledger.jev.calls} calls, input ${ledger.jev.inputTokens}, output ${ledger.jev.outputTokens}`,
    '',
    ...comparisonSection('Existing better (all)', byVerdict('existing better')),
    ...comparisonSection('Both wrong (all)', byVerdict('both wrong')),
    ...comparisonSection(
      `AI better (sample of ${SAMPLE_SIZE})`,
      stableSample(byVerdict('AI better'), SAMPLE_SIZE)
    ),
    ...(report.thresholdCheck == null
      ? comparisonSection(
          `Equivalent by the Jev pre-filter (sample of ${SAMPLE_SIZE})`,
          stableSample(byVerdict('equivalent (pre-filter)'), SAMPLE_SIZE)
        )
      : []),
    ...(verdicts['not judged'] > 0
      ? comparisonSection('Not judged (all)', byVerdict('not judged'))
      : []),
    `## Existing translations Jev scored below ${MEANING_THRESHOLD} for meaning (${report.weakExisting.length})`,
    '',
    '| Key | English | Existing | Score | Judge |',
    '|---|---|---|---|---|',
    ...report.weakExisting.map(
      item =>
        `| \`${item.key}\` | ${cell(item.english)} | ${cell(
          item.existing
        )} | ${item.score.toFixed(2)} | ${item.verdict ?? '-'} |`
    ),
    '',
    `## Placeholder and line-break mismatches (${report.placeholderProblems.length})`,
    '',
    '| File | Key | Problem |',
    '|---|---|---|',
    ...report.placeholderProblems.map(
      item => `| ${item.file} | \`${item.key}\` | ${cell(item.problem)} |`
    ),
    ''
  ]
  return lines.join('\n')
}

function thresholdSection(checks: ThresholdCheck[]): string[] {
  const judged: Verdict[] = [
    'equivalent',
    'AI better',
    'existing better',
    'both wrong',
    'not judged'
  ]
  return [
    '## Pre-filter check',
    '',
    'Every different pair went to the judge. Each row counts the pairs Jev scored at or above the threshold, which the pre-filter would skip, and what the judge said about them.',
    '',
    `| Threshold | Pairs | ${judged.join(' | ')} |`,
    `|---|---|${judged.map(() => '---|').join('')}`,
    ...checks.map(
      check =>
        `| ${check.threshold} | ${check.pairs} | ${judged
          .map(verdict => check.verdicts[verdict] ?? 0)
          .join(' | ')} |`
    ),
    ''
  ]
}

function comparisonSection(title: string, items: Comparison[]): string[] {
  if (items.length === 0) return [`## ${title}: 0`, '', 'None.', '']
  return [
    `## ${title}: ${items.length}`,
    '',
    '| Key | English | Existing | AI | Reason |',
    '|---|---|---|---|---|',
    ...items.map(
      item =>
        `| \`${item.key}\` | ${cell(item.english)} | ${cell(
          item.existing
        )} | ${cell(item.ai)} | ${cell(item.reason)} |`
    ),
    ''
  ]
}

/** Replaces the judge's [A] and [B] with the files they came from. */
function nameCandidates(reason: string, existingFirst: boolean): string {
  const [a, b] = existingFirst ? ['existing', 'AI'] : ['AI', 'existing']
  return reason.replace(/\[A\]/g, a).replace(/\[B\]/g, b)
}

function cell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, '<br>')
}

function sortByEnglishOrder<T extends { key: string }>(
  items: T[],
  english: StringMap
): T[] {
  const order = new Map(Object.keys(english).map((key, index) => [key, index]))
  return [...items].sort(
    (a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0)
  )
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
