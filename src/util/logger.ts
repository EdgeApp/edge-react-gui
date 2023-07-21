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
    fileArray.push(`${RNFS.DocumentDirectoryPath}/logs_${type}.${padZeros(i)}.txt`)
  }
  return fileArray
}

const logMap = {
  info: makePaths('info'),
  activity: makePaths('activity')
}

const getTime = () => new Date().toISOString()

const isObject = (item: any) => typeof item === 'object' && item !== null
const isError = (item: any): item is Error => item instanceof Error

const normalize = (...info: any[]) =>
  `${getTime()} | ${info.map(item => (isError(item) ? item.stack ?? item.message : isObject(item) ? JSON.stringify(item) : item)).join(' ')}`

const lock = new AsyncLock({ maxPending: 100000 })

const MAX_BYTE_SIZE_PER_FILE = 100000
const NUM_WRITES_BEFORE_ROTATE_CHECK = 100

let numWrites = 0

// @ts-expect-error
async function isLogFileLimitExceeded(filePath) {
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
  } catch (e: any) {
    // @ts-expect-error
    global.clog(e)
  }
}

async function migrateLogs(): Promise<void> {
  if (await RNFS.exists(RNFS.DocumentDirectoryPath + '/logs1.txt')) {
    await RNFS.moveFile(RNFS.DocumentDirectoryPath + '/logs1.txt', RNFS.DocumentDirectoryPath + '/logs_info.000.txt')
  }
  if (await RNFS.exists(RNFS.DocumentDirectoryPath + '/logs2.txt')) {
    await RNFS.moveFile(RNFS.DocumentDirectoryPath + '/logs2.txt', RNFS.DocumentDirectoryPath + '/logs_info.001.txt')
  }
  if (await RNFS.exists(RNFS.DocumentDirectoryPath + '/logs3.txt')) {
    await RNFS.moveFile(RNFS.DocumentDirectoryPath + '/logs3.txt', RNFS.DocumentDirectoryPath + '/logs_info.002.txt')
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
      return await RNFS.appendFile(path, '\n' + content)
    } else {
      return await RNFS.writeFile(path, content)
    }
  } catch (e: any) {
    // @ts-expect-error
    global.clog((e && e.message) || e)
  }
}

export async function clearLogs(type: LogType): Promise<void> {
  const paths = logMap[type]

  for (let i = 0; i < paths.length; i++) {
    if (await RNFS.exists(paths[i])) {
      await RNFS.unlink(paths[i])
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
  } catch (err: any) {
    // @ts-expect-error
    global.clog((err && err.message) || err)
  }
}

export async function logWithType(type: LogType, ...info: Array<number | string | null | {}>): Promise<void> {
  const logs = normalize(...info)

  const now = Date.now()
  const d = dateFormat(now, 'HH:MM:ss:l')

  try {
    await lock.acquire('logger', async () => {
      return await writeLog(type, d + ': ' + logs)
    })
  } catch (e: any) {
    // @ts-expect-error
    global.clog(e)
  }
  // @ts-expect-error
  global.clog(logs)
}

export function log(...info: Array<number | string | null | {}>): void {
  logWithType('info', ...info).catch(err => console.warn(err))
}

export function logActivity(...info: Array<number | string | null | {}>): void {
  logWithType('activity', ...info).catch(err => console.warn(err))
}

async function request(data: string) {
  // @ts-expect-error
  return await global.fetch(`${ENV.LOG_SERVER.host}:${ENV.LOG_SERVER.port}/log`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data })
  })
}

export function logToServer(...info: any[]) {
  const args = info[0]
  let logs = ''
  for (const item of args) {
    if (isObject(item)) {
      logs = logs + (' ' + JSON.stringify(item))
    } else {
      logs = logs + (' ' + item)
    }
  }
  request(logs).catch(err => {
    console.error(err)
    console.log('Failed logToServer')
  })
}

// Log function meant to be used in various modules that is disabled by default and enabled
// by setting enable bits by log type
let debugLogType = 0
export const LOG_COINRANK = 0x0001
export const debugLog = (type: number, ...args: any): void => {
  // Provides date formatting for the form '01-14 03:43:56.273'
  const dateTime = new Date().toISOString().slice(5, 23).replace('T', ' ')
  if (type & debugLogType) console.log(dateTime, ...args)
}

export const enableDebugLogType = (type: number) => (debugLogType |= type)
