import AsyncLock from 'async-lock'
import dateFormat from 'dateformat'
import RNFS from 'react-native-fs'
import { sprintf } from 'sprintf-js'

import { ENV } from '../env'

const NUM_FILES = 20
export type LogType = 'info' | 'activity'

const padZeros = (n: number): string => {
  return sprintf('%03d', n)
}

const makePaths = (type: LogType): string[] => {
  const fileArray: string[] = []
  for (let i = 0; i < NUM_FILES; i++) {
    fileArray.push(
      `${RNFS.DocumentDirectoryPath}/logs_${type}.${padZeros(i)}.txt`
    )
  }
  return fileArray
}

const logMap = {
  info: makePaths('info'),
  activity: makePaths('activity')
}

const getTime = (): string => new Date().toISOString()

const isObject = (item: unknown): boolean =>
  typeof item === 'object' && item !== null
const isError = (item: unknown): item is Error => item instanceof Error

const normalize = (...info: unknown[]): string =>
  `${getTime()} | ${info
    .map(item =>
      isError(item)
        ? item.stack ?? item.message
        : isObject(item)
        ? JSON.stringify(item)
        : item
    )
    .join(' ')}`

const lock = new AsyncLock({ maxPending: 100000 })

const MAX_BYTE_SIZE_PER_FILE = 100000
const NUM_WRITES_BEFORE_ROTATE_CHECK = 100

let numWrites = 0

async function isLogFileLimitExceeded(filePath: string): Promise<boolean> {
  const stats = await RNFS.stat(filePath)

  return Number(stats.size) > MAX_BYTE_SIZE_PER_FILE
}

async function rotateLogs(type: LogType): Promise<void> {
  const paths = logMap[type]
  if (!(await RNFS.exists(paths[0]))) {
    return
  }
  if (!(await isLogFileLimitExceeded(paths[0]))) {
    return
  }

  try {
    if (await RNFS.exists(paths[paths.length - 1])) {
      await RNFS.unlink(paths[paths.length - 1])
    }
    for (let i = paths.length - 1; i > 0; i--) {
      if (await RNFS.exists(paths[i - 1])) {
        await RNFS.moveFile(paths[i - 1], paths[i])
      }
    }
    await RNFS.writeFile(paths[0], '')
    numWrites = 0
  } catch (e: unknown) {
    // @ts-expect-error - global.clog is injected at runtime
    global.clog(e)
  }
}

async function migrateLogs(): Promise<void> {
  if (await RNFS.exists(RNFS.DocumentDirectoryPath + '/logs1.txt')) {
    await RNFS.moveFile(
      RNFS.DocumentDirectoryPath + '/logs1.txt',
      RNFS.DocumentDirectoryPath + '/logs_info.000.txt'
    )
  }
  if (await RNFS.exists(RNFS.DocumentDirectoryPath + '/logs2.txt')) {
    await RNFS.moveFile(
      RNFS.DocumentDirectoryPath + '/logs2.txt',
      RNFS.DocumentDirectoryPath + '/logs_info.001.txt'
    )
  }
  if (await RNFS.exists(RNFS.DocumentDirectoryPath + '/logs3.txt')) {
    await RNFS.moveFile(
      RNFS.DocumentDirectoryPath + '/logs3.txt',
      RNFS.DocumentDirectoryPath + '/logs_info.002.txt'
    )
  }
}

let checkMigrated = false
async function writeLog(type: LogType, content: string): Promise<void> {
  const path = logMap[type][0]
  try {
    if (!checkMigrated) {
      await migrateLogs()
      await rotateLogs(type)
      checkMigrated = true
    }
    const exists = await RNFS.exists(path)

    if (exists) {
      numWrites++
      if (numWrites > NUM_WRITES_BEFORE_ROTATE_CHECK) {
        await rotateLogs(type)
      }
      await RNFS.appendFile(path, '\n' + content)
    } else {
      await RNFS.writeFile(path, content)
    }
  } catch (e: unknown) {
    // @ts-expect-error - global.clog is injected at runtime
    global.clog(e instanceof Error ? e.message : e)
  }
}

export async function clearLogs(type: LogType): Promise<void> {
  const paths = logMap[type]

  for (const path of paths) {
    if (await RNFS.exists(path)) {
      await RNFS.unlink(path)
    }
  }
}

export async function readLogs(type: LogType): Promise<string | undefined> {
  const paths = logMap[type]

  try {
    let log = ''

    for (let i = paths.length - 1; i >= 0; i--) {
      if (await RNFS.exists(paths[i])) {
        log = log + (await RNFS.readFile(paths[i]))
      }
    }
    return log
  } catch (err: unknown) {
    // @ts-expect-error - global.clog is injected at runtime
    global.clog(err instanceof Error ? err.message : err)
  }
}

export async function logWithType(
  type: LogType,
  ...info: Array<number | string | null | object>
): Promise<void> {
  const logs = normalize(...info)

  const now = Date.now()
  const d = dateFormat(now, 'HH:MM:ss:l')

  try {
    await lock.acquire('logger', async () => {
      await writeLog(type, d + ': ' + logs)
    })
  } catch (e: unknown) {
    // @ts-expect-error - global.clog is injected at runtime
    global.clog(e)
  }
  // @ts-expect-error - global.clog is injected at runtime
  global.clog(logs)
}

export function log(...info: Array<number | string | null | object>): void {
  logWithType('info', ...info).catch((err: unknown) => {
    console.warn(err)
  })
}

export function logActivity(
  ...info: Array<number | string | null | object>
): void {
  logWithType('activity', ...info).catch((err: unknown) => {
    console.warn(err)
  })
}

async function request(data: string): Promise<Response> {
  // @ts-expect-error - ENV.LOG_SERVER may not be defined in all configs
  const logServer = ENV.LOG_SERVER as { host: string; port: number } | undefined
  return await global.fetch(`${logServer?.host}:${logServer?.port}/log`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data })
  })
}

export function logToServer(...info: unknown[]): void {
  const args = info[0] as unknown[]
  let logs = ''
  for (const item of args) {
    if (isObject(item)) {
      logs = logs + (' ' + JSON.stringify(item))
    } else {
      logs = logs + (' ' + String(item))
    }
  }
  request(logs).catch((err: unknown) => {
    console.error(err)
    console.log('Failed logToServer')
  })
}

// ---------------------------------------------------------------------------
// Configurable Debug Logging
// ---------------------------------------------------------------------------
// Configure via LOG_CONFIG in env.json:
// {
//   "LOG_CONFIG": {
//     "enabledCategories": ["phaze", "coinrank"],
//     "maskSensitiveHeaders": true,
//     "sensitiveHeaders": ["api-key", "user-api-key", "authorization"]
//   }
// }
// ---------------------------------------------------------------------------

interface LogConfig {
  enabledCategories: Set<string>
  maskSensitiveHeaders: boolean
  sensitiveHeaders: Set<string>
}

/** Get log config from ENV with defaults */
const getLogConfig = (): LogConfig => {
  const config = ENV.LOG_CONFIG ?? {}
  return {
    enabledCategories: new Set(
      (config.enabledCategories ?? []).map((c: string) => c.toLowerCase())
    ),
    maskSensitiveHeaders: config.maskSensitiveHeaders ?? true,
    sensitiveHeaders: new Set(
      (
        config.sensitiveHeaders ?? [
          'api-key',
          'user-api-key',
          'authorization',
          'x-api-key'
        ]
      ).map((h: string) => h.toLowerCase())
    )
  }
}

// Cache config at module load (ENV is static)
const logConfig = getLogConfig()

/**
 * Check if a log category is enabled.
 * Categories are configured via LOG_CONFIG.enabledCategories in env.json.
 */
export const isLogCategoryEnabled = (category: string): boolean => {
  return logConfig.enabledCategories.has(category.toLowerCase())
}

/**
 * Enable a log category at runtime.
 * Useful for debugging in development.
 */
export const enableLogCategory = (category: string): void => {
  logConfig.enabledCategories.add(category.toLowerCase())
}

/**
 * Disable a log category at runtime.
 */
export const disableLogCategory = (category: string): void => {
  logConfig.enabledCategories.delete(category.toLowerCase())
}

/**
 * Debug log function that only outputs when the category is enabled.
 * Categories are simple strings like 'phaze', 'coinrank', etc.
 *
 * @example
 * debugLog('phaze', 'Fetching gift cards...')
 * debugLog('coinrank', 'Refreshing rankings', { page: 1 })
 */
export const debugLog = (category: string, ...args: unknown[]): void => {
  if (!logConfig.enabledCategories.has(category.toLowerCase())) return
  // Provides date formatting for the form '01-14 03:43:56.273'
  const dateTime = new Date().toISOString().slice(5, 23).replace('T', ' ')
  console.log(dateTime, `[${category}]`, ...args)
}

/**
 * Mask sensitive values in headers for safe logging.
 * Shows first 4 characters followed by '***' for sensitive headers.
 * Controlled by LOG_CONFIG.maskSensitiveHeaders and LOG_CONFIG.sensitiveHeaders.
 */
export const maskHeaders = (
  headers: Record<string, string>
): Record<string, string> => {
  if (!logConfig.maskSensitiveHeaders) return headers

  const masked: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (logConfig.sensitiveHeaders.has(key.toLowerCase())) {
      masked[key] = value.length > 4 ? value.slice(0, 4) + '***' : '***'
    } else {
      masked[key] = value
    }
  }
  return masked
}
