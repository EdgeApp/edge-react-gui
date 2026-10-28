import {
  asArray,
  asBoolean,
  asJSON,
  asObject,
  asOptional,
  asString,
  asValue,
  type Cleaner
} from 'cleaners'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

export const ROOT_DIR = path.resolve(__dirname, '../..')
export const ENGLISH_PATH = path.join(ROOT_DIR, 'src/locales/strings/enUS.json')
export const STRINGS_DIR = path.join(ROOT_DIR, 'src/locales/strings')
export const CONTEXT_PATH = path.join(
  ROOT_DIR,
  'src/locales/context/enUS.context.json'
)
export const AI_STRINGS_DIR = path.join(ROOT_DIR, 'src/locales/strings-ai')

export const asStringMap = asObject(asString)
export type StringMap = ReturnType<typeof asStringMap>

export const asLengthHint = asValue('button', 'label', 'paragraph')
export type LengthHint = ReturnType<typeof asLengthHint>

/**
 * One entry of src/locales/context/enUS.context.json,
 * which tells translators what a string means and where it shows.
 */
export const asContextEntry = asObject({
  description: asString,
  uiLocation: asString,
  placeholders: asObject(asString),
  lengthHint: asLengthHint,
  usageFiles: asArray(asString),
  reuseWarning: asOptional(
    asObject({ sites: asArray(asString), reason: asString })
  ),
  unused: asBoolean,
  sourceHash: asString
})
export type ContextEntry = ReturnType<typeof asContextEntry>

export const asContextStore = asObject(asContextEntry)
export type ContextStore = ReturnType<typeof asContextStore>

/**
 * Matches sprintf-js conversion tokens such as %s, %1$s, %d and %%.
 */
const SPRINTF_TOKEN =
  /%(?:[1-9]\d*\$)?\+?(?:0|'[^$])?-?\d*(?:\.\d+)?[b-gijostTuvxX]|%%/g

export function readJsonFile<T>(filePath: string, cleaner: Cleaner<T>): T {
  return asJSON(cleaner)(fs.readFileSync(filePath, 'utf8'))
}

export function readJsonFileOr<T>(
  filePath: string,
  cleaner: Cleaner<T>,
  fallback: T
): T {
  if (!fs.existsSync(filePath)) return fallback
  return readJsonFile(filePath, cleaner)
}

export function writeJsonFile(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n')
}

export function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}

/**
 * The sprintf tokens in a string, sorted, so two strings can be compared
 * for the same set and count of tokens.
 */
export function sprintfTokens(text: string): string[] {
  return [...(text.match(SPRINTF_TOKEN) ?? [])].sort((a, b) =>
    a.localeCompare(b)
  )
}

/**
 * Explains how a translation breaks the English placeholders or line breaks,
 * or returns undefined when both match.
 */
export function placeholderProblem(
  english: string,
  translation: string
): string | undefined {
  const expected = sprintfTokens(english).join(' ')
  const actual = sprintfTokens(translation).join(' ')
  if (expected !== actual) {
    return `placeholders [${expected}] became [${actual}]`
  }
  const expectedLines = countNewlines(english)
  const actualLines = countNewlines(translation)
  if (expectedLines !== actualLines) {
    return `${expectedLines} newlines became ${actualLines}`
  }
  return undefined
}

/**
 * Parses the JSON object in a model reply,
 * tolerating code fences or prose around it.
 */
export function extractJsonObject(reply: string): unknown {
  const start = reply.indexOf('{')
  const end = reply.lastIndexOf('}')
  if (start < 0 || end < start) {
    throw new Error(`No JSON object in reply: ${reply.slice(0, 200)}`)
  }
  return JSON.parse(reply.slice(start, end + 1))
}

export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/**
 * Maps over items with at most `limit` promises in flight,
 * keeping the result order.
 */
export async function mapPool<T, R>(
  items: T[],
  limit: number,
  callback: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const index = next++
      results[index] = await callback(items[index], index)
    }
  }
  const workers: Array<Promise<void>> = []
  for (let i = 0; i < Math.min(limit, items.length); ++i) workers.push(worker())
  await Promise.all(workers)
  return results
}

/**
 * Reads `--name value` and `--flag` style arguments.
 */
export function parseArgs(argv: string[]): Map<string, string> {
  const args = new Map<string, string>()
  for (let i = 0; i < argv.length; ++i) {
    const arg = argv[i]
    if (!arg.startsWith('--')) throw new Error(`Unexpected argument ${arg}`)
    const value = argv[i + 1]
    if (value == null || value.startsWith('--')) {
      args.set(arg.slice(2), 'true')
    } else {
      args.set(arg.slice(2), value)
      ++i
    }
  }
  return args
}

export function intArg(
  args: Map<string, string>,
  name: string
): number | undefined {
  const value = args.get(name)
  if (value == null) return undefined
  const number = parseInt(value, 10)
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`--${name} must be a positive integer`)
  }
  return number
}

function countNewlines(text: string): number {
  return text.split('\n').length - 1
}
