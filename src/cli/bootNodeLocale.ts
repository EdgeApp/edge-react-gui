/**
 * Side-effect locale *detection* for both CLI entries.
 *
 * Detection only. The client renders no localized string — `git grep lstrings
 * src/cli` outside `engine/` is empty — so applying the language here dragged
 * `locales/strings` and all eleven translation tables into `lib/edgeCli.js`
 * for a value it never reads. It needs the *tag*, to pass `--locale` to the
 * engine and to warn on a mismatch; `bootEngineLocale` is what applies it.
 *
 * Must be the first import in `src/cli/index.ts`.
 */
import type { LocaleSource } from '../locales/bootLocale'
import { detectNodeLocale, parseConfigPathFlag } from '../locales/nodeLocale'
import { loadConfig } from './engine/cliConfig'

const argv = process.argv.slice(2)

// This runs at import, before `main()` has a handler, so a bad `-c/--config`
// would otherwise print Node's uncaught-exception format — source line, caret,
// stack — and exit 1. The documented failure model is the JSON envelope with
// exit 2 for bad argv, so report it that way and stop here.
let fileConfig
try {
  fileConfig = loadConfig(parseConfigPathFlag(argv))
} catch (error: unknown) {
  console.error(
    JSON.stringify(
      {
        error: {
          code: 'USAGE',
          message: error instanceof Error ? error.message : String(error),
          status: 400
        }
      },
      null,
      2
    )
  )
  process.exit(2)
}
const detected: LocaleSource = detectNodeLocale({
  argv,
  env: process.env,
  configLocale: fileConfig.locale
})

/** What this process resolved from argv, config and the environment. */
export function getDetectedLocale(): LocaleSource {
  return detected
}
