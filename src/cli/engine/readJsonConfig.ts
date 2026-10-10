/**
 * Read one JSON config file through a cleaner.
 *
 * `appConfig.ts`, `keysConfig.ts` and `cliConfig.ts` each had the same
 * twenty-odd statements in the same order — `readFileSync` →
 * `isMissingFile` → null, `JSON.parse` → "Invalid JSON in <path>", cleaner →
 * "Invalid <label> at <path>" — differing only in the cleaner and one word
 * of each message.
 *
 * An absent file is `null`, which is what the search-path loop above each
 * caller treats as "try the next one", and what `cliConfig.ts` turns into
 * either the defaults or an error depending on whether the operator named
 * the path. Anything else throws, naming the file and the field: a config
 * this version cannot read must not be answered with silent defaults,
 * because the values in it decide which servers the engine talks to.
 *
 * The parse is deliberately outside the cleaner, so the two failures say
 * different things: an operator hand-editing a config file gets "Invalid
 * JSON in <path>: Unexpected token }" for a syntax slip and "Invalid CLI
 * config at <path>: expected a string at .apiKey" for a wrong value, where
 * `asJSON` would answer both with the cleaner's own wording. `json.ts` does
 * the same for every request body — its own `BAD_REQUEST`/"Invalid JSON
 * body" ahead of the route's `body` cleaner — which is the request-side
 * instance of the same rule.
 */
import type { Cleaner } from 'cleaners'
import fs from 'fs'
import { resolve } from 'path'

import { isMissingFile } from '../../util/predicates'
import { cliHomeFile } from './cliHome'
import { errorMessage } from './errors'

export function readJsonConfig<T>(
  path: string,
  cleaner: Cleaner<T>,
  label: string
): T | null {
  let text: string
  try {
    text = fs.readFileSync(path, 'utf8')
  } catch (error: unknown) {
    if (isMissingFile(error)) return null
    throw error
  }
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch (error: unknown) {
    const message = errorMessage(error)
    throw new Error(`Invalid JSON in ${path}: ${message}`)
  }
  try {
    return cleaner(json)
  } catch (error: unknown) {
    const message = errorMessage(error)
    throw new Error(`Invalid ${label} at ${path}: ${message}`)
  }
}

/**
 * Where a config file is looked for, in order.
 *
 * The working directory first, so a checkout or a container can override,
 * then the CLI's own home.
 */
export function configSearchPaths(filename: string): string[] {
  return [resolve(`./${filename}`), cliHomeFile(filename)]
}
