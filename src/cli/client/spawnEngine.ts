import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

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
  apiKey?: string
  noSpawn?: boolean
  tcpPort?: number | null
  idleTimeoutSeconds?: number
  spawnTimeoutMs?: number
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

export async function pingEngine(socketPath: string): Promise<boolean> {
  try {
    const client = new ApiClient({ socketPath, timeoutMs: 3000 })
    await client.get('/v1/status')
    return true
  } catch {
    return false
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
    return {
      profile,
      run,
      client: new ApiClient({ socketPath })
    }
  }

  if (opts.noSpawn === true) {
    throw new Error(
      `Engine is not running for profile ${profile} (socket ${socketPath}). Start it with: npm run engine -- -t`
    )
  }

  // Resolve engine entry relative to this source file or the package root.
  const candidates = [
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
  if (opts.directory !== '') args.push('-d', opts.directory)
  if (opts.appId !== '') args.push('-a', opts.appId)
  if (opts.apiKey != null && opts.apiKey !== '') args.push('-k', opts.apiKey)
  if (opts.tcpPort != null) args.push(`--tcp=${opts.tcpPort}`)
  if (opts.idleTimeoutSeconds != null) {
    args.push(`--idle-timeout=${opts.idleTimeoutSeconds}`)
  }

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
    env: process.env
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
      return {
        profile,
        run,
        client: new ApiClient({ socketPath })
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
