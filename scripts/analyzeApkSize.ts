/**
 * Analyze an Android APK (or AAB-derived universal APK) for size attribution.
 *
 * Usage:
 *   node -r sucrase/register ./scripts/analyzeApkSize.ts <apk>
 *   node -r sucrase/register ./scripts/analyzeApkSize.ts --compare <before.json> <after.json>
 *   node -r sucrase/register ./scripts/analyzeApkSize.ts --out <path.json> <apk>
 *
 * Relies on:
 *   - apkanalyzer (Android SDK cmdline-tools)
 *   - unzip / zipinfo for entry sizes
 *   - optional bundletool for AAB get-size (if --aab given)
 */
import childProcess from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path, { join } from 'path'

interface EntrySize {
  path: string
  compressedBytes: number
  uncompressedBytes: number
}

interface CategoryRollup {
  name: string
  compressedBytes: number
  uncompressedBytes: number
  entries: number
  topEntries: Array<{
    path: string
    compressedBytes: number
    uncompressedBytes: number
  }>
}

interface ApkSizeReport {
  generatedAt: string
  apkPath: string
  apkFileBytes: number
  downloadSizeEstimateBytes: number | null
  packageName: string | null
  versionCode: string | null
  versionName: string | null
  categories: CategoryRollup[]
  byAbi: CategoryRollup[]
  byAssetPackage: CategoryRollup[]
  byDexFile: CategoryRollup[]
  topEntries: EntrySize[]
  duplicateGroups: Array<{
    sha256: string
    uncompressedBytes: number
    paths: string[]
    wastedCompressedBytes: number
  }>
  notes: string[]
}

const ROOT = join(__dirname, '..')
const DEFAULT_OUT = join(ROOT, 'docs', 'apkSizeBaseline.json')
const APKANALYZER_CANDIDATES = [
  join(
    os.homedir(),
    'Library/Android/sdk/cmdline-tools/latest/bin/apkanalyzer'
  ),
  join(os.homedir(), 'Library/Android/sdk/tools/bin/apkanalyzer'),
  'apkanalyzer'
]

function findApkanalyzer(): string | null {
  for (const candidate of APKANALYZER_CANDIDATES) {
    if (candidate === 'apkanalyzer') {
      try {
        childProcess.execSync('which apkanalyzer', { stdio: 'ignore' })
        return 'apkanalyzer'
      } catch {
        continue
      }
    }
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

function run(cmd: string, opts: { cwd?: string } = {}): string {
  return childProcess.execSync(cmd, {
    encoding: 'utf8',
    maxBuffer: 200 * 1024 * 1024,
    cwd: opts.cwd
  })
}

function parseZipEntries(apkPath: string): EntrySize[] {
  // zipinfo -l columns: permissions, version, size, type, compressed, method, date, time, name
  // Prefer `unzip -l` + `unzip -v` for compressed sizes.
  const verbose = run(`unzip -v -l ${shellQuote(apkPath)}`)
  const entries: EntrySize[] = []
  for (const line of verbose.split('\n')) {
    // Typical: "  1234  Defl:N   567  54% 01-01-1980 00:00  ........  path"
    // Or Stored: "  1234  Stored   1234  0% ..."
    const m =
      /^\s*(\d+)\s+(?:Defl:\S+|Stored|Defl:N)\s+(\d+)\s+\d+%\s+\S+\s+\S+\s+\S+\s+(.+)$/.exec(
        line
      )
    if (m == null) continue
    const uncompressedBytes = Number(m[1])
    const compressedBytes = Number(m[2])
    const entryPath = m[3].trim()
    if (entryPath === 'Name' || entryPath.endsWith('/')) continue
    entries.push({ path: entryPath, compressedBytes, uncompressedBytes })
  }
  return entries
}

function shellQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`
}

function categorize(entryPath: string): string {
  if (entryPath.startsWith('lib/')) {
    const parts = entryPath.split('/')
    return `lib/${parts[1] ?? 'unknown'}`
  }
  if (entryPath.startsWith('assets/')) {
    const rest = entryPath.slice('assets/'.length)
    const slash = rest.indexOf('/')
    if (slash === -1) return 'assets/(root)'
    return `assets/${rest.slice(0, slash)}`
  }
  if (entryPath.startsWith('res/')) return 'res'
  if (entryPath.endsWith('.dex')) return 'dex'
  if (entryPath === 'resources.arsc') return 'resources.arsc'
  if (entryPath.startsWith('META-INF/')) return 'META-INF'
  return 'other'
}

function rollup(
  name: string,
  entries: EntrySize[],
  topN: number = 15
): CategoryRollup {
  const sorted = [...entries].sort(
    (a, b) => b.compressedBytes - a.compressedBytes
  )
  return {
    name,
    compressedBytes: entries.reduce((s, e) => s + e.compressedBytes, 0),
    uncompressedBytes: entries.reduce((s, e) => s + e.uncompressedBytes, 0),
    entries: entries.length,
    topEntries: sorted.slice(0, topN).map(e => ({
      path: e.path,
      compressedBytes: e.compressedBytes,
      uncompressedBytes: e.uncompressedBytes
    }))
  }
}

function groupBy(
  entries: EntrySize[],
  keyFn: (e: EntrySize) => string
): Map<string, EntrySize[]> {
  const map = new Map<string, EntrySize[]>()
  for (const e of entries) {
    const k = keyFn(e)
    const list = map.get(k)
    if (list == null) map.set(k, [e])
    else list.push(e)
  }
  return map
}

function findDuplicates(
  apkPath: string,
  entries: EntrySize[]
): ApkSizeReport['duplicateGroups'] {
  // Hash large-enough assets only to keep runtime reasonable.
  const candidates = entries.filter(
    e =>
      e.uncompressedBytes >= 8 * 1024 &&
      (e.path.startsWith('assets/') || e.path.startsWith('lib/'))
  )
  const tmp = fs.mkdtempSync(join(os.tmpdir(), 'apk-dup-'))
  const byHash = new Map<
    string,
    { uncompressedBytes: number; paths: string[]; compressedBytes: number[] }
  >()

  try {
    // Extract only candidate paths
    const listFile = join(tmp, 'list.txt')
    fs.writeFileSync(listFile, candidates.map(c => c.path).join('\n'))
    try {
      run(
        `unzip -q -o ${shellQuote(apkPath)} -d ${shellQuote(tmp)} ${candidates
          .map(c => shellQuote(c.path))
          .join(' ')}`
      )
    } catch {
      // unzip returns non-zero if some paths missing; continue with what we got
    }

    for (const e of candidates) {
      const filePath = join(tmp, e.path)
      if (!fs.existsSync(filePath)) continue
      const buf = fs.readFileSync(filePath)
      const sha256 = crypto.createHash('sha256').update(buf).digest('hex')
      const existing = byHash.get(sha256)
      if (existing == null) {
        byHash.set(sha256, {
          uncompressedBytes: e.uncompressedBytes,
          paths: [e.path],
          compressedBytes: [e.compressedBytes]
        })
      } else {
        existing.paths.push(e.path)
        existing.compressedBytes.push(e.compressedBytes)
      }
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }

  const groups: ApkSizeReport['duplicateGroups'] = []
  for (const [sha256, g] of byHash) {
    if (g.paths.length < 2) continue
    // Waste = all but one copy's compressed size
    const sorted = [...g.compressedBytes].sort((a, b) => b - a)
    const wastedCompressedBytes = sorted.slice(1).reduce((s, n) => s + n, 0)
    groups.push({
      sha256,
      uncompressedBytes: g.uncompressedBytes,
      paths: g.paths,
      wastedCompressedBytes
    })
  }
  groups.sort((a, b) => b.wastedCompressedBytes - a.wastedCompressedBytes)
  return groups
}

function analyzeApk(apkPath: string): ApkSizeReport {
  const abs = path.resolve(apkPath)
  if (!fs.existsSync(abs)) {
    throw new Error(`APK not found: ${abs}`)
  }

  const notes: string[] = []
  const apkFileBytes = fs.statSync(abs).size
  const entries = parseZipEntries(abs)
  if (entries.length === 0) {
    throw new Error('Failed to parse zip entries from APK')
  }

  const apkanalyzer = findApkanalyzer()
  let packageName: string | null = null
  let versionCode: string | null = null
  let versionName: string | null = null
  let downloadSizeEstimateBytes: number | null = null

  if (apkanalyzer != null) {
    try {
      const summary = run(
        `${shellQuote(apkanalyzer)} apk summary ${shellQuote(abs)}`
      ).trim()
      const parts = summary.split('\t')
      packageName = parts[0] ?? null
      versionCode = parts[1] ?? null
      versionName = parts[2] ?? null
    } catch (e) {
      notes.push(`apkanalyzer summary failed: ${String(e)}`)
    }
    try {
      downloadSizeEstimateBytes = Number(
        run(
          `${shellQuote(apkanalyzer)} apk download-size ${shellQuote(abs)}`
        ).trim()
      )
    } catch (e) {
      notes.push(`apkanalyzer download-size failed: ${String(e)}`)
    }
  } else {
    notes.push('apkanalyzer not found; summary/download-size skipped')
  }

  const byCategory = groupBy(entries, e => categorize(e.path))
  const categories = [...byCategory.entries()]
    .map(([name, list]) => rollup(name, list))
    .sort((a, b) => b.compressedBytes - a.compressedBytes)

  const libEntries = entries.filter(e => e.path.startsWith('lib/'))
  const byAbi = [...groupBy(libEntries, e => e.path.split('/')[1] ?? 'unknown')]
    .map(([name, list]) => rollup(name, list))
    .sort((a, b) => b.compressedBytes - a.compressedBytes)

  const assetEntries = entries.filter(e => e.path.startsWith('assets/'))
  const byAssetPackage = [
    ...groupBy(assetEntries, e => {
      const rest = e.path.slice('assets/'.length)
      const slash = rest.indexOf('/')
      return slash === -1 ? '(root)' : rest.slice(0, slash)
    })
  ]
    .map(([name, list]) => rollup(name, list))
    .sort((a, b) => b.compressedBytes - a.compressedBytes)

  const dexEntries = entries.filter(e => e.path.endsWith('.dex'))
  const byDexFile = dexEntries
    .map(e => rollup(e.path, [e]))
    .sort((a, b) => b.compressedBytes - a.compressedBytes)

  const topEntries = [...entries]
    .sort((a, b) => b.compressedBytes - a.compressedBytes)
    .slice(0, 40)

  console.log('Scanning for duplicate asset/lib content (sha256)...')
  const duplicateGroups = findDuplicates(abs, entries)

  return {
    generatedAt: new Date().toISOString(),
    apkPath: abs,
    apkFileBytes,
    downloadSizeEstimateBytes,
    packageName,
    versionCode,
    versionName,
    categories,
    byAbi,
    byAssetPackage,
    byDexFile,
    topEntries,
    duplicateGroups,
    notes
  }
}

function formatBytes(n: number): string {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  if (abs < 1024) return `${sign}${abs} B`
  if (abs < 1024 * 1024) return `${sign}${(abs / 1024).toFixed(1)} KB`
  return `${sign}${(abs / (1024 * 1024)).toFixed(2)} MB`
}

function printReport(report: ApkSizeReport): void {
  console.log('\n=== APK Size Report ===')
  console.log(`APK: ${report.apkPath}`)
  console.log(
    `File size: ${formatBytes(report.apkFileBytes)} (${
      report.apkFileBytes
    } bytes)`
  )
  if (report.downloadSizeEstimateBytes != null) {
    console.log(
      `Download estimate: ${formatBytes(report.downloadSizeEstimateBytes)}`
    )
  }
  if (report.packageName != null) {
    console.log(
      `Package: ${report.packageName} ${report.versionName} (${report.versionCode})`
    )
  }

  console.log('\n--- Categories (compressed) ---')
  for (const c of report.categories) {
    console.log(
      `  ${c.name.padEnd(28)} ${formatBytes(c.compressedBytes).padStart(
        10
      )}  uncomp ${formatBytes(c.uncompressedBytes).padStart(10)}  (${
        c.entries
      } files)`
    )
  }

  console.log('\n--- Native libs by ABI ---')
  for (const c of report.byAbi) {
    console.log(
      `  ${c.name.padEnd(16)} ${formatBytes(c.compressedBytes).padStart(
        10
      )}  uncomp ${formatBytes(c.uncompressedBytes).padStart(10)}`
    )
  }

  console.log('\n--- Assets by package ---')
  for (const c of report.byAssetPackage.slice(0, 20)) {
    console.log(
      `  ${c.name.padEnd(36)} ${formatBytes(c.compressedBytes).padStart(
        10
      )}  uncomp ${formatBytes(c.uncompressedBytes).padStart(10)}`
    )
  }

  console.log('\n--- Top entries ---')
  for (const e of report.topEntries.slice(0, 25)) {
    console.log(`  ${formatBytes(e.compressedBytes).padStart(10)}  ${e.path}`)
  }

  if (report.duplicateGroups.length > 0) {
    console.log('\n--- Exact duplicate groups (wasted compressed) ---')
    for (const g of report.duplicateGroups.slice(0, 15)) {
      console.log(
        `  waste ${formatBytes(g.wastedCompressedBytes)}  copies=${
          g.paths.length
        }  size=${formatBytes(g.uncompressedBytes)}`
      )
      for (const p of g.paths) console.log(`    - ${p}`)
    }
  }

  for (const n of report.notes) console.log(`NOTE: ${n}`)
}

function compareReports(before: ApkSizeReport, after: ApkSizeReport): void {
  const delta = after.apkFileBytes - before.apkFileBytes
  console.log('\n=== APK Compare ===')
  console.log(
    `Before: ${formatBytes(before.apkFileBytes)}  (${before.apkPath})`
  )
  console.log(`After:  ${formatBytes(after.apkFileBytes)}  (${after.apkPath})`)
  console.log(`Delta:  ${formatBytes(delta)} (${delta} bytes)`)

  const beforeMap = new Map(before.categories.map(c => [c.name, c]))
  const afterMap = new Map(after.categories.map(c => [c.name, c]))
  const keys = new Set([...beforeMap.keys(), ...afterMap.keys()])
  console.log('\n--- Category deltas (compressed) ---')
  const rows: Array<{ name: string; delta: number }> = []
  for (const k of keys) {
    const b = beforeMap.get(k)?.compressedBytes ?? 0
    const a = afterMap.get(k)?.compressedBytes ?? 0
    rows.push({ name: k, delta: a - b })
  }
  rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  for (const r of rows) {
    if (r.delta === 0) continue
    const prefix = r.delta > 0 ? '+' : ''
    console.log(`  ${r.name.padEnd(28)} ${prefix}${formatBytes(r.delta)}`)
  }
}

function main(): void {
  const argv = process.argv.slice(2)
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    console.log(
      'Usage:\n' +
        '  node -r sucrase/register ./scripts/analyzeApkSize.ts [--out path.json] <apk>\n' +
        '  node -r sucrase/register ./scripts/analyzeApkSize.ts --compare <before.json> <after.json>'
    )
    process.exit(argv.length === 0 ? 1 : 0)
  }

  if (argv[0] === '--compare') {
    const beforePath = argv[1]
    const afterPath = argv[2]
    if (beforePath == null || afterPath == null) {
      throw new Error('--compare requires <before.json> <after.json>')
    }
    const before = JSON.parse(
      fs.readFileSync(beforePath, 'utf8')
    ) as ApkSizeReport
    const after = JSON.parse(
      fs.readFileSync(afterPath, 'utf8')
    ) as ApkSizeReport
    compareReports(before, after)
    return
  }

  let outPath = DEFAULT_OUT
  let apkPath: string | undefined
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') {
      outPath = argv[++i]
    } else if (!argv[i].startsWith('-')) {
      apkPath = argv[i]
    }
  }
  if (apkPath == null) throw new Error('Missing <apk> argument')

  const report = analyzeApk(apkPath)
  printReport(report)

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n')
  console.log(`\nWrote ${outPath}`)
}

main()
