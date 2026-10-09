import {
  asJSON,
  asMaybe,
  asObject,
  asOptional,
  asString,
  uncleaner
} from 'cleaners'
import fs from 'fs'

import { ensureRunDir, sessionFilePath } from '../engine/discovery'

/**
 * The session file, cleaned.
 *
 * The `sessionId` is a bearer token every account-scoped command sends. A cast
 * let a malformed file through with `sessionId: undefined`, which reached the
 * engine as the literal string 'undefined'.
 */
const asSessionFile = asJSON(
  asObject({
    sessionId: asString,
    username: asOptional(asString),
    updatedAt: asString
  })
)

const uncleanSessionFile = uncleaner(asSessionFile)

type SessionFile = ReturnType<typeof asSessionFile>

export function readSessionFile(profile: string): SessionFile | null {
  try {
    const text = fs.readFileSync(sessionFilePath(profile), 'utf8')
    return asMaybe(asSessionFile)(text) ?? null
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
  // Through the cleaner's uncleaner: this file is a bearer token, and a
  // cast here is what let a malformed one through as `sessionId: undefined`.
  // `asSessionFile` is an `asJSON` cleaner, so its uncleaner returns the JSON
  // text already; `JSON.stringify` on top of that writes a quoted string.
  fs.writeFileSync(file, uncleanSessionFile(data) + '\n', { mode: 0o600 })
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
