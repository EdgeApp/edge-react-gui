import fs from 'fs'
import path from 'path'

import { defaultDirectory } from './cliConfig'
import { errorMessage } from './errors'

/**
 * Create the account data directory `0700`, and tighten only one that is ours.
 *
 * It holds the login stashes — `pin2Key`, `otpKey`, the password and
 * recovery boxes — and disklet writes them at the umask default, so the
 * directory's mode is what keeps another local user out. The CLI owns the
 * default directory and any directory this call creates, and makes both
 * `0700`, including one an earlier run created laxer.
 *
 * Not an existing directory the caller named with `-d`: `-d .`, `-d ~` or a
 * shared folder turned to `0700` cut off every other user and service that
 * relied on its mode. That mode is the caller's; when it lets other users
 * in, the answer is a warning saying so.
 *
 * Returns the warning to print, if any; both halves print it with their own
 * prefix.
 */
export function secureDataDir(directory: string): string | undefined {
  const existed = fs.existsSync(directory)
  try {
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 })
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code !== 'EEXIST') {
      return `could not create ${directory}: ${errorMessage(error)}`
    }
  }
  const ours =
    !existed || path.resolve(directory) === path.resolve(defaultDirectory())
  if (ours) {
    try {
      fs.chmodSync(directory, 0o700)
    } catch (error: unknown) {
      return (
        `could not set ${directory} to 0700 (${errorMessage(error)}); ` +
        'the login stashes in it may be readable by other local users'
      )
    }
    return
  }
  // Windows reports every directory as mode 666 and controls access with
  // ACLs, which `chmod` does not change. A mode check means nothing there.
  if (process.platform === 'win32') return
  let mode: number
  try {
    mode = fs.statSync(directory).mode & 0o777
  } catch {
    return
  }
  if ((mode & 0o077) === 0) return
  return (
    `${directory} is mode ${mode.toString(8)}, so other local users can read ` +
    'the login stashes in it. The CLI leaves the mode of a directory it did ' +
    'not create alone: run `chmod 700` on it, or pass a -d of its own.'
  )
}
