import { asBoolean, asObject, asOptional, asString } from 'cleaners'
import fs from 'fs'
import os from 'os'
import { join, resolve } from 'path'

export interface CliConfig {
  apiKey?: string
  appId?: string
  authServer?: string
  directory?: string
  password?: string
  testMode?: boolean
  username?: string
  workingDir?: string
}

const asCliConfig = asObject<CliConfig>({
  apiKey: asOptional(asString),
  appId: asOptional(asString),
  authServer: asOptional(asString),
  directory: asOptional(asString),
  password: asOptional(asString),
  testMode: asOptional(asBoolean),
  username: asOptional(asString),
  workingDir: asOptional(asString)
})

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

  if (text == null || where == null) return {}

  try {
    return asCliConfig(JSON.parse(text))
  } catch (error) {
    throw new Error(`Cannot load config file "${where}": ${String(error)}`)
  }
}

export function defaultDirectory(): string {
  return join(os.homedir(), '.config', 'edge-cli')
}
