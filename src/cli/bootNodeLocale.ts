/**
 * Side-effect locale boot for the CLI client and engine.
 * Must be the first import in src/cli/index.ts and src/cli/engine/index.ts.
 */
import { applyLocale } from '../locales/bootLocale'
import { detectNodeLocale, parseConfigPathFlag } from '../locales/nodeLocale'
import { loadConfig } from './engine/cliConfig'

const argv = process.argv.slice(2)
const fileConfig = loadConfig(parseConfigPathFlag(argv))
applyLocale(
  detectNodeLocale({
    argv,
    env: process.env,
    configLocale: fileConfig.locale
  })
)
