import fs from 'fs'

import { ensureRunDir, sessionFilePath } from '../engine/discovery'

export interface SessionFile {
  sessionId: string
  username?: string
  updatedAt: string
}

export function readSessionFile(profile: string): SessionFile | null {
  try {
    const text = fs.readFileSync(sessionFilePath(profile), 'utf8')
    return JSON.parse(text) as SessionFile
  } catch {
    return null
  }
}

export function writeSessionFile(
  profile: string,
  sessionId: string,
  username?: string
): void {
  ensureRunDir(profile)
  const data: SessionFile = {
    sessionId,
    username,
    updatedAt: new Date().toISOString()
  }
  const file = sessionFilePath(profile)
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 })
  // `mode` only applies when the file is created, so a session file written
  // before that option was added keeps its old permissions forever. The run
  // directory is already 0700, but a session id is a bearer token — narrow it
  // on every write rather than trusting the directory alone.
  fs.chmodSync(file, 0o600)
}

export function clearSessionFile(profile: string): void {
  try {
    fs.unlinkSync(sessionFilePath(profile))
  } catch {
    // ignore
  }
}
