import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

import { getAppliedLocale } from '../../locales/bootLocale'
import { localeTagsMatch } from '../../locales/nodeLocale'
import {
  type EngineRunFile,
  ensureRunDir,
  profileHash,
  type ProfileKey,
  readRunFile,
  socketPathFor
} from '../engine/discovery'
import { ApiClient } from './apiClient'

/** Last few KB of the spawned engine's output, for error messages. */
function readTail(path: string, maxBytes: number): string {
  try {
    const text = fs.readFileSync(path, 'utf8').trimEnd()
    if (text === '') return ''
    return text.length > maxBytes ? text.slice(-maxBytes) : text
  } catch {
    return ''
  }
}

export interface EnsureEngineOpts extends ProfileKey {
  /** Serve an in-process fake world instead of a login server. */
  fake?: boolean
  apiKey?: string
  noSpawn?: boolean
  tcpPort?: number | null
  idleTimeoutSeconds?: number
  spawnTimeoutMs?: number
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

async function pingEngine(socketPath: string): Promise<boolean> {
  try {
    const client = new ApiClient({ socketPath, timeoutMs: 3000 })
    await client.get('/engine/status')
    return true
  } catch {
    return false
  }
}

async function warnIfEngineLocaleDiffers(client: ApiClient): Promise<void> {
  try {
    const status = await client.get<{ locale?: string }>('/engine/status')
    const wanted = getAppliedLocale().languageTag
    if (
      status.locale != null &&
      status.locale !== '' &&
      !localeTagsMatch(status.locale, wanted)
    ) {
      console.error(
        `[edge-cli] Warning: engine locale is ${status.locale}; this client requested ${wanted}. Using the engine locale.`
      )
    }
  } catch {
    // Status is optional for locale mismatch; spend/login still work.
  }
}

export async function ensureEngine(
  opts: EnsureEngineOpts
): Promise<{ profile: string; run: EngineRunFile; client: ApiClient }> {
  const profile = profileHash({
    appId: opts.appId,
    directory: opts.directory,
    testMode: opts.testMode,
    loginServer: opts.loginServer
  })
  const socketPath = socketPathFor(profile)

  if (await pingEngine(socketPath)) {
    const run = readRunFile(profile)
    if (run == null) {
      throw new Error('Engine is up but run file is missing')
    }
    const client = new ApiClient({ socketPath })
    await warnIfEngineLocaleDiffers(client)
    return {
      profile,
      run,
      client
    }
  }

  if (opts.noSpawn === true) {
    throw new Error(
      `Engine is not running for profile ${profile} (socket ${socketPath}). Start it with: npm run engine -- -t`
    )
  }

  // Resolve engine entry relative to this source file or the package root.
  // The sibling bundle comes first. Rollup flattens src/cli into lib/edgeCli.js,
  // so in a built or installed tree (npm, Homebrew's libexec, /usr/lib/edgecli)
  // `__dirname` is the package's `lib/` and its sibling is lib/edgeEngine.js —
  // while `../engine/index.ts` resolves above the package and the cwd
  // candidates point at whatever directory the user's shell happens to be in.
  // Running from source it cannot false-positive: `__dirname` is
  // src/cli/client, which has no edgeEngine.js.
  const candidates = [
    path.resolve(__dirname, 'edgeEngine.js'),
    path.resolve(__dirname, '../engine/index.ts'),
    path.resolve(process.cwd(), 'src/cli/engine/index.ts'),
    path.resolve(process.cwd(), 'lib/edgeEngine.js')
  ]
  const engineEntry = candidates.find(p => {
    try {
      return fs.existsSync(p)
    } catch {
      return false
    }
  })
  if (engineEntry == null) {
    throw new Error(
      `Could not find edge-engine entry. Tried:\n${candidates
        .map(p => `  - ${p}`)
        .join('\n')}`
    )
  }
  const args = engineEntry.endsWith('.js')
    ? [engineEntry]
    : ['-r', 'sucrase/register', engineEntry]
  if (opts.testMode) args.push('-t')
  if (opts.fake === true) args.push('--fake')
  if (opts.directory !== '') args.push('-d', opts.directory)
  if (opts.appId !== '') args.push('-a', opts.appId)
  if (opts.apiKey != null && opts.apiKey !== '') args.push('-k', opts.apiKey)
  if (opts.tcpPort != null) args.push(`--tcp=${opts.tcpPort}`)
  if (opts.idleTimeoutSeconds != null) {
    args.push(`--idle-timeout=${opts.idleTimeoutSeconds}`)
  }
  const applied = getAppliedLocale()
  args.push(`--locale=${applied.languageTag}`)

  // Ensure directory exists for core data
  try {
    fs.mkdirSync(opts.directory, { recursive: true })
  } catch {
    // ignore
  }

  // Capture the child's output: a detached engine that dies during startup
  // (bad keys.json, plugin load failure) would otherwise fail silently and
  // surface only as a spawn timeout.
  const startupLog = path.join(ensureRunDir(profile), 'engine-startup.log')
  const logFd = fs.openSync(startupLog, 'w')
  const child = spawn(process.execPath, args, {
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: { ...process.env, EDGE_CLI_LOCALE: applied.languageTag }
  })
  child.unref()
  fs.closeSync(logFd)

  const timeout = opts.spawnTimeoutMs ?? 30_000
  const start = Date.now()
  while (Date.now() - start < timeout) {
    await sleep(250)
    if (await pingEngine(socketPath)) {
      const run = readRunFile(profile)
      if (run == null) continue
      const client = new ApiClient({ socketPath })
      await warnIfEngineLocaleDiffers(client)
      return {
        profile,
        run,
        client
      }
    }
  }

  const tail = readTail(startupLog, 2000)
  throw new Error(
    `Timed out waiting for engine to start (profile ${profile}).` +
      (tail === ''
        ? ` No engine output; see ${startupLog}.`
        : `\n--- engine output (${startupLog}) ---\n${tail}`)
  )
}
