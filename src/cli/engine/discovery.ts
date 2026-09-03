import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import { join } from 'path'

export const API_VERSION = '1.0.0'

export interface ProfileKey {
  appId: string
  directory: string
  testMode: boolean
  loginServer?: string
}

export interface EngineRunFile {
  pid: number
  apiVersion: string
  socketPath: string
  tcpPort: number | null
  appId: string
  testMode: boolean
  startedAt: string
}

export function profileHash(key: ProfileKey): string {
  const payload = JSON.stringify({
    appId: key.appId,
    directory: key.directory,
    testMode: key.testMode,
    loginServer: key.loginServer ?? null
  })
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16)
}

export function runDir(profile: string): string {
  return join(os.homedir(), '.edge-cli', 'run', profile)
}

export function socketPathFor(profile: string): string {
  return join(runDir(profile), 'engine.sock')
}

export function runFilePath(profile: string): string {
  return join(runDir(profile), 'engine.json')
}

export function sessionFilePath(profile: string): string {
  return join(runDir(profile), 'session.json')
}

export function ensureRunDir(profile: string): string {
  const dir = runDir(profile)
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
  return dir
}

export function writeRunFile(profile: string, data: EngineRunFile): void {
  ensureRunDir(profile)
  const path = runFilePath(profile)
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n', {
    mode: 0o600
  })
  try {
    // `mode` only applies when creating; force 0600 on rewrite.
    fs.chmodSync(path, 0o600)
  } catch {
    // ignore
  }
}

export function readRunFile(profile: string): EngineRunFile | null {
  try {
    const text = fs.readFileSync(runFilePath(profile), 'utf8')
    return JSON.parse(text) as EngineRunFile
  } catch {
    return null
  }
}

export function removeRunArtifacts(profile: string): void {
  const sock = socketPathFor(profile)
  const run = runFilePath(profile)
  try {
    fs.unlinkSync(sock)
  } catch {
    // ignore
  }
  try {
    fs.unlinkSync(run)
  } catch {
    // ignore
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error: unknown) {
    // EPERM means the pid exists but belongs to another user.
    return (
      error != null &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'EPERM'
    )
  }
}

/**
 * Remove stale socket / run-file if the recorded pid is dead. Returns the pid
 * of an engine that is still running for this profile, so the caller can
 * refuse to start rather than unlinking a live socket out from under it.
 */
export function cleanupStaleLock(profile: string): number | null {
  const run = readRunFile(profile)
  if (run == null) {
    // Orphan socket?
    try {
      fs.unlinkSync(socketPathFor(profile))
    } catch {
      // ignore
    }
    return null
  }
  if (isProcessAlive(run.pid)) return run.pid
  removeRunArtifacts(profile)
  return null
}
