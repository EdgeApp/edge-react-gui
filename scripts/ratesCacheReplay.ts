// ---------------------------------------------------------------------------
// ratesCacheReplay
//
// Replays a logged exchange-rate cache blob (the `***Exchange Rate Cache***`
// section captured in the support logs, or any JSON matching that shape)
// against the rates server: it rebuilds the `v3/rates` queries the app would
// have sent for the pairs in the blob, sends them, and reports what the server
// returns for every requested pair — so a rate problem seen in a user's logs
// can be reproduced and inspected directly.
//
// Query construction mirrors `convertToRatesParams` in
// `src/actions/ExchangeRateActions.ts` — keep the two in sync. Only the
// subscribed pairs present in the blob (`cryptoPairs` / `fiatPairs`) are
// replayed; wallet-derived and historical pairs the app adds at runtime are
// not part of the cache and so are not reproduced here.
//
// Each requested pair is reported as one of:
//   <rate>   the server returned a rate
//   NO RATE  the server returned the pair but declined to price it
//   MISSING  the server omitted the pair from its response entirely
//
// Usage:
//   node -r sucrase/register scripts/ratesCacheReplay.ts <blob.json>
//   pbpaste | node -r sucrase/register scripts/ratesCacheReplay.ts
//   node -r sucrase/register scripts/ratesCacheReplay.ts <blob.json> --server https://rates4.edge.app
//   node -r sucrase/register scripts/ratesCacheReplay.ts <blob.json> --dry-run
//
// Input may be the bare cache JSON or a log excerpt containing it — the first
// complete JSON object in the text is used. `--server` picks which rates host
// to hit (default rates3; point it at rates4 to compare hosts). `--dry-run`
// prints the query bodies without sending them.
// ---------------------------------------------------------------------------

import * as fs from 'fs'

// Mirrors RATES_SERVER_MAX_QUERY_SIZE in ExchangeRateActions.ts:
const RATES_SERVER_MAX_QUERY_SIZE = 100
// Default v3 rate server (see RATES_SERVERS in src/util/network.ts):
const DEFAULT_RATES_SERVER = 'https://rates3.edge.app'

// Mirrors removeIsoPrefix in src/util/utils.ts:
const removeIsoPrefix = (currencyCode: string): string =>
  currencyCode.replace('iso:', '')

interface CryptoAsset {
  pluginId: string
  tokenId?: string | null
}
interface CryptoFiatPair {
  asset: CryptoAsset
  targetFiat: string
  isoDate?: string
  expiration: number
}
interface FiatFiatPair {
  fiatCode: string
  targetFiat: string
  isoDate?: string
  expiration: number
}
interface RateCacheBlob {
  cryptoPairs?: CryptoFiatPair[]
  fiatPairs?: FiatFiatPair[]
}

interface RatesQuery {
  targetFiat: string
  crypto: Array<{ isoDate: string; asset: CryptoAsset }>
  fiat: Array<{ isoDate: string; fiatCode: string }>
}
interface RatesResponse {
  crypto?: Array<{ asset?: CryptoAsset; rate?: number | null }>
  fiat?: Array<{ fiatCode?: string; rate?: number | null }>
}

type Outcome = 'resolved' | 'no-rate' | 'missing'
interface PairResult {
  label: string
  outcome: Outcome
  rate?: number | null
}

/** Identity for matching a response entry back to the pair we asked for. */
const cryptoKey = (asset: CryptoAsset): string =>
  `${asset.pluginId}:${asset.tokenId ?? ''}`

/**
 * Group the cached pairs by targetFiat and chunk them into query bodies,
 * exactly as convertToRatesParams does in the app.
 */
function cacheToQueries(blob: RateCacheBlob, isoNow: string): RatesQuery[] {
  const cryptoPairs = blob.cryptoPairs ?? []
  const fiatPairs = blob.fiatPairs ?? []

  const grouped = new Map<
    string,
    { crypto: CryptoFiatPair[]; fiat: FiatFiatPair[] }
  >()
  const bucket = (
    targetFiat: string
  ): { crypto: CryptoFiatPair[]; fiat: FiatFiatPair[] } => {
    let entry = grouped.get(targetFiat)
    if (entry == null) {
      entry = { crypto: [], fiat: [] }
      grouped.set(targetFiat, entry)
    }
    return entry
  }
  for (const pair of cryptoPairs) bucket(pair.targetFiat).crypto.push(pair)
  for (const pair of fiatPairs) bucket(pair.targetFiat).fiat.push(pair)

  const queries: RatesQuery[] = []
  for (const [targetFiat, { crypto, fiat }] of grouped.entries()) {
    const remainingCrypto = [...crypto]
    const remainingFiat = [...fiat]
    while (remainingCrypto.length > 0 || remainingFiat.length > 0) {
      const cryptoChunk = remainingCrypto.splice(0, RATES_SERVER_MAX_QUERY_SIZE)
      const fiatChunk = remainingFiat.splice(0, RATES_SERVER_MAX_QUERY_SIZE)
      queries.push({
        targetFiat: removeIsoPrefix(targetFiat),
        crypto: cryptoChunk.map(pair => ({
          isoDate:
            pair.isoDate == null
              ? isoNow
              : new Date(pair.isoDate).toISOString(),
          asset: pair.asset
        })),
        fiat: fiatChunk.map(pair => ({
          isoDate:
            pair.isoDate == null
              ? isoNow
              : new Date(pair.isoDate).toISOString(),
          fiatCode: removeIsoPrefix(pair.fiatCode)
        }))
      })
    }
  }
  return queries
}

/**
 * Pull the first complete JSON object out of arbitrary text, so a pasted log
 * excerpt (with surrounding lines) works as well as bare JSON.
 */
function extractFirstJsonObject(text: string): string {
  const start = text.indexOf('{')
  if (start < 0) throw new Error('No JSON object found in input')
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  throw new Error('Unbalanced JSON object in input')
}

/**
 * Match every pair we asked for against what the server actually returned.
 */
function matchResults(
  query: RatesQuery,
  response: RatesResponse
): PairResult[] {
  const cryptoByKey = new Map<string, { rate?: number | null }>()
  for (const entry of response.crypto ?? []) {
    if (entry.asset != null) cryptoByKey.set(cryptoKey(entry.asset), entry)
  }
  const fiatByCode = new Map<string, { rate?: number | null }>()
  for (const entry of response.fiat ?? []) {
    if (entry.fiatCode != null) fiatByCode.set(entry.fiatCode, entry)
  }

  const results: PairResult[] = []
  for (const requested of query.crypto) {
    const label =
      requested.asset.tokenId == null
        ? requested.asset.pluginId
        : `${requested.asset.pluginId}:${requested.asset.tokenId}`
    const found = cryptoByKey.get(cryptoKey(requested.asset))
    if (found == null) results.push({ label, outcome: 'missing' })
    else if (found.rate == null) results.push({ label, outcome: 'no-rate' })
    else results.push({ label, outcome: 'resolved', rate: found.rate })
  }
  for (const requested of query.fiat) {
    const label = `${requested.fiatCode} (fiat)`
    const found = fiatByCode.get(requested.fiatCode)
    if (found == null) results.push({ label, outcome: 'missing' })
    else if (found.rate == null) results.push({ label, outcome: 'no-rate' })
    else results.push({ label, outcome: 'resolved', rate: found.rate })
  }
  return results
}

function printResults(results: PairResult[]): void {
  const width = results.reduce((max, r) => Math.max(max, r.label.length), 0)
  for (const result of results) {
    const value =
      result.outcome === 'resolved'
        ? String(result.rate)
        : result.outcome.toUpperCase()
    console.log(`    ${result.label.padEnd(width)}  ${value}`)
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  let server = DEFAULT_RATES_SERVER
  let dryRun = false
  let file: string | undefined
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') dryRun = true
    else if (arg === '--server') server = argv[++i]
    else if (!arg.startsWith('--')) file = arg
  }

  const raw =
    file != null && file !== '-'
      ? fs.readFileSync(file, 'utf8')
      : fs.readFileSync(0, 'utf8')

  const blob = JSON.parse(extractFirstJsonObject(raw)) as RateCacheBlob
  const queries = cacheToQueries(blob, new Date().toISOString())
  const cryptoCount = blob.cryptoPairs?.length ?? 0
  const fiatCount = blob.fiatPairs?.length ?? 0
  console.log(
    `${queries.length} quer${
      queries.length === 1 ? 'y' : 'ies'
    } from ${cryptoCount} crypto + ${fiatCount} fiat cached pairs`
  )

  if (dryRun) {
    for (const query of queries) console.log(JSON.stringify(query))
    return
  }

  const totals = { resolved: 0, 'no-rate': 0, missing: 0 }
  let failedQueries = 0

  for (const [index, query] of queries.entries()) {
    console.log(
      `\nquery ${index}  targetFiat=${query.targetFiat}  ${query.crypto.length} crypto + ${query.fiat.length} fiat  -> ${server}/v3/rates`
    )
    const started = Date.now()
    let response
    try {
      response = await fetch(`${server}/v3/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      })
    } catch (error) {
      failedQueries++
      console.log(`  request failed: ${String(error)}`)
      continue
    }
    const elapsed = Date.now() - started
    const text = await response.text()
    if (!response.ok) {
      failedQueries++
      console.log(
        `  HTTP ${response.status} (${elapsed}ms): ${text.slice(0, 300)}`
      )
      continue
    }

    let parsed: RatesResponse
    try {
      parsed = JSON.parse(text)
    } catch (error) {
      failedQueries++
      console.log(
        `  HTTP 200 (${elapsed}ms) but unparseable body: ${text.slice(0, 300)}`
      )
      continue
    }

    const results = matchResults(query, parsed)
    console.log(`  HTTP ${response.status} (${elapsed}ms)`)
    printResults(results)
    const counts = { resolved: 0, 'no-rate': 0, missing: 0 }
    for (const result of results) counts[result.outcome]++
    for (const key of Object.keys(counts) as Outcome[])
      totals[key] += counts[key]
    console.log(
      `  -> ${counts.resolved} resolved, ${counts['no-rate']} no rate, ${counts.missing} missing`
    )
  }

  console.log(
    `\nTOTAL: ${totals.resolved} resolved, ${totals['no-rate']} no rate, ${
      totals.missing
    } missing across ${queries.length} quer${
      queries.length === 1 ? 'y' : 'ies'
    }${failedQueries > 0 ? ` (${failedQueries} failed)` : ''}`
  )
  if (totals.missing > 0 || totals['no-rate'] > 0 || failedQueries > 0) {
    process.exitCode = 1
  }
}

main().catch((error: unknown) => {
  console.error(String(error))
  process.exitCode = 1
})
