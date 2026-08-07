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
  fs.writeFileSync(
    sessionFilePath(profile),
    JSON.stringify(data, null, 2) + '\n',
    { mode: 0o600 }
  )
}

export function clearSessionFile(profile: string): void {
  try {
    fs.unlinkSync(sessionFilePath(profile))
  } catch {
    // ignore
  }
}
