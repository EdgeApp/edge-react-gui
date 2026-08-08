/**
 * Split a legacy `env.json` into `config.json` (non-secret) + `keys.json`
 * (secret) using the same `splitEnv` classifier as the golden-equivalence test.
 *
 * Usage:
 *   socket npm run split-env-json
 *   socket npm run split-env-json -- --force
 *   socket npm run split-env-json -- path/to/env.json
 *   socket npm run split-env-json -- --force path/to/env.json outDir/
 *
 * Never prints secret values. Refuses to overwrite existing outputs unless
 * `--force` is passed.
 */

import fs from 'fs'
import path from 'path'

import { splitEnv } from '../src/envSplit'

function usage(): never {
  console.error(`Usage: splitEnvJson.ts [--force] [env.json] [outDir]

Reads a legacy env.json and writes config.json + keys.json (gitignored).
Defaults: ./env.json -> ./config.json and ./keys.json
Pass --force to overwrite existing output files.`)
  process.exit(1)
}

function parseArgs(argv: string[]): {
  force: boolean
  envPath: string
  outDir: string
} {
  let force = false
  const positional: string[] = []
  for (const arg of argv) {
    if (arg === '--force' || arg === '-f') {
      force = true
      continue
    }
    if (arg === '--help' || arg === '-h') usage()
    if (arg.startsWith('-')) {
      console.error(`Unknown flag: ${arg}`)
      usage()
    }
    positional.push(arg)
  }
  return {
    force,
    envPath: path.resolve(positional[0] ?? 'env.json'),
    outDir: path.resolve(positional[1] ?? '.')
  }
}

function writeJson(filePath: string, value: unknown, force: boolean): void {
  if (!force && fs.existsSync(filePath)) {
    console.error(
      `Refusing to overwrite existing ${filePath} (pass --force to replace)`
    )
    process.exit(1)
  }
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', {
    mode: 0o600
  })
}

function main(): void {
  const { force, envPath, outDir } = parseArgs(process.argv.slice(2))

  if (!fs.existsSync(envPath)) {
    console.error(`env.json not found: ${envPath}`)
    process.exit(1)
  }

  let legacyEnv: unknown
  try {
    legacyEnv = JSON.parse(fs.readFileSync(envPath, 'utf8'))
  } catch (error) {
    console.error(`Failed to parse ${envPath}: ${String(error)}`)
    process.exit(1)
  }

  const { config, keys } = splitEnv(legacyEnv)

  fs.mkdirSync(outDir, { recursive: true })
  const configPath = path.join(outDir, 'config.json')
  const keysPath = path.join(outDir, 'keys.json')

  writeJson(configPath, config, force)
  writeJson(keysPath, keys, force)

  const configPluginCounts = {
    corePlugins: Object.keys(config.corePlugins).length,
    swapPlugins: Object.keys(config.swapPlugins).length,
    pluginApiKeys: Object.keys(config.pluginApiKeys).length,
    rampPlugins: Object.keys(config.rampPlugins).length
  }
  const keysPluginCounts = {
    pluginApiKeys: Object.keys(keys.pluginApiKeys).length,
    rampPlugins: Object.keys(keys.rampPlugins).length
  }

  // Counts only — never dump field values (keys.json is secret).
  console.log(`Wrote ${configPath}`)
  console.log(`  plugin map sizes: ${JSON.stringify(configPluginCounts)}`)
  console.log(`Wrote ${keysPath}`)
  console.log(`  plugin map sizes: ${JSON.stringify(keysPluginCounts)}`)
}

main()
