import { asObject, asOptional, asString } from 'cleaners'
import fs from 'fs'
import { join, resolve } from 'path'
import xdgBasedir from 'xdg-basedir'

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
  username: asOptional(asString),
  workingDir: asOptional(asString)
})

export function loadConfig(configPath?: string): CliConfig {
  let where: string | undefined
  let text: string | undefined

  // Try to load the file:
  if (configPath != null) {
    try {
      where = resolve(configPath)
      text = fs.readFileSync(where, 'utf8')
    } catch (error) {
      throw new Error(
        `Cannot load config file "${configPath}": ${String(error)}`
      )
    }
  } else if (xdgBasedir.config != null) {
    try {
      where = resolve(join(xdgBasedir.config, '/edge-cli/edge-cli.conf'))
      text = fs.readFileSync(where, 'utf8')
    } catch (error) {
      // It's fine if the default location doesn't have a file
    }
  }

  // There is no file, so return a default:
  if (text == null || where == null) return {}

  // We want to throw cleaner errors and parsing errors:
  try {
    return asCliConfig(JSON.parse(text))
  } catch (error) {
    throw new Error(`Cannot load config file "${where}": ${String(error)}`)
  }
}
