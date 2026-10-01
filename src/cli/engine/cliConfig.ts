import { asBoolean, asJSON, asObject, asOptional, asString } from 'cleaners'
import fs from 'fs'
import os from 'os'
import { join, resolve } from 'path'

const asCliConfig = asObject({
  apiKey: asOptional(asString),
  appId: asOptional(asString),
  authServer: asOptional(asString),
  directory: asOptional(asString),
  locale: asOptional(asString),
  password: asOptional(asString),
  testMode: asOptional(asBoolean),
  username: asOptional(asString),
  workingDir: asOptional(asString)
})

/** Derived from the cleaner, so the two cannot drift. */
export type CliConfig = ReturnType<typeof asCliConfig>

export function loadConfig(configPath?: string): CliConfig {
  let where: string | undefined
  let text: string | undefined

  if (configPath != null) {
    try {
      where = resolve(configPath)
      text = fs.readFileSync(where, 'utf8')
    } catch (error) {
      throw new Error(
        `Cannot load config file "${configPath}": ${String(error)}`
      )
    }
  } else {
    try {
      where = resolve(
        join(os.homedir(), '.config', 'edge-cli', 'edge-cli.conf')
      )
      text = fs.readFileSync(where, 'utf8')
    } catch {
      // optional
    }
  }

  // Through the cleaner, so "no config file" and "an empty config file"
  // are the same value rather than two shapes.
  if (text == null || where == null) return asCliConfig({})

  try {
    // `asJSON`, so one cleaner owns both the parse and the shape.
    return asJSON(asCliConfig)(text)
  } catch (error) {
    throw new Error(`Cannot load config file "${where}": ${String(error)}`)
  }
}

export function defaultDirectory(): string {
  return join(os.homedir(), '.config', 'edge-cli')
}
