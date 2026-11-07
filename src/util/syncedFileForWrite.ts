import { asJSON, asMaybe, type Cleaner } from 'cleaners'

import { isDecryptionFailure, isMissingFile, isPlainObject } from './predicates'
import { reportWarning } from './reportWarning'

/** What a write to a synced JSON file can start from. */
export type SyncedFileBase =
  | { kind: 'text'; text: string }
  | { kind: 'absent' }
  | { kind: 'kept'; keptAs: string }

/**
 * The text a write to a synced JSON file starts from — the one policy for
 * `Settings.json` and `Categories.json` on `account.disklet`.
 *
 * Moving or replacing a synced file reaches every device, and the two files
 * used to answer the same failure in opposite ways: categories wrote the
 * defaults over a file that would not decrypt, without syncing, while
 * settings refused it as a sync still in progress. So, for both:
 *
 * - Absent: `absent`, which the caller answers with its defaults.
 * - Text that parses to an object: `text`, for the caller's own cleaner.
 *   The categories cleaner refuses a `categories` that is not a list of
 *   strings; the settings cleaner takes any object, field by field.
 * - Text that does not parse, or is not an object: a half-synced file is
 *   what this usually is, so the account syncs and the file is read again.
 *   Still not an object, it is the same bad bytes on every device and
 *   nothing would ever end that state, so the bytes of that read are kept as
 *   `<file>.unreadable-<ms>` on the same repo and the caller starts from its
 *   defaults (`kept`). Nothing reads the kept copy back.
 * - A file that will not decrypt: synced and read once more; still failing,
 *   it is thrown, with the file untouched. That is the likeliest sign of a
 *   sync still in progress, and there are no bytes to keep.
 * - Any other read failure: thrown, file untouched.
 */
export async function readSyncedFileForWrite(
  account: {
    disklet: {
      getText: (path: string) => Promise<string>
      setText: (path: string, text: string) => Promise<unknown>
    }
    sync?: () => Promise<void>
  },
  filename: string
): Promise<SyncedFileBase> {
  const read = async (): Promise<string | undefined> => {
    try {
      return await account.disklet.getText(filename)
    } catch (error: unknown) {
      if (isMissingFile(error)) return undefined
      throw error
    }
  }
  let synced = false
  const sync = async (): Promise<void> => {
    synced = true
    if (account.sync != null) await account.sync()
  }

  let text: string | undefined
  try {
    text = await read()
  } catch (error: unknown) {
    if (!isDecryptionFailure(error)) throw error
    await sync()
    text = await read()
  }
  if (text == null) return { kind: 'absent' }
  if (isObjectText(text)) return { kind: 'text', text }

  if (!synced) {
    await sync()
    text = await read()
    if (text == null) return { kind: 'absent' }
    if (isObjectText(text)) return { kind: 'text', text }
  }
  const keptAs = `${filename}.unreadable-${Date.now()}`
  await account.disklet.setText(keptAs, text)
  reportWarning(
    `${filename} is not a JSON object after a sync; kept as ${keptAs}, ` +
      'starting again from the defaults'
  )
  return { kind: 'kept', keptAs }
}

/**
 * A parsed value that is a plain object: the one test of a settings- or
 * categories-shaped file. `asJsonObject` applies it to text; the categories
 * cleaner applies it before its own shape.
 *
 * `isPlainObject`, because `asObject` accepts an array — and `[]` is what a
 * half-written file is likeliest to be when it is valid JSON and not these
 * files, which would otherwise clean to the defaults.
 */
export function asPlainObjectValue(raw: unknown): object {
  if (!isPlainObject(raw)) throw new TypeError('not a JSON object')
  return raw
}

/**
 * JSON text whose value is a plain object: this door's test, and the synced
 * settings reads'. The categories cleaner applies `asPlainObjectValue`
 * itself, inside its own `asJSON`.
 */
export const asJsonObject: Cleaner<object> = asJSON(asPlainObjectValue)

function isObjectText(text: string): boolean {
  return asMaybe(asJsonObject)(text) != null
}
