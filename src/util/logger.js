// @flow

import AsyncLock from 'async-lock'
import dateFormat from 'dateformat'
import RNFS from 'react-native-fs'

import ENV from '../../env.json'

const path1 = RNFS.DocumentDirectoryPath + '/logs1.txt'
const path2 = RNFS.DocumentDirectoryPath + '/logs2.txt'
const path3 = RNFS.DocumentDirectoryPath + '/logs3.txt'
const path = path1

const getTime = () => new Date().toISOString()

const isObject = (item: any) => typeof item === 'object' && item !== null

const normalize = (...info: any[]) => `${getTime()} | ${info.map(item => (isObject(item) ? JSON.stringify(item) : item)).join(' ')}`

const lock = new AsyncLock({ maxPending: 100000 })
// function saveToBuffer (log: string) {
//   buffer = buffer !== '' ? buffer + '\n' + log : log
// }
//
// function readAndClearBuffer () {
//   const logs = buffer
//   buffer = ''
//   lastSaving = Date.now()
//   return logs
// }
//
const MAX_BYTE_SIZE_PER_FILE = 1000000
const NUM_WRITES_BEFORE_ROTATE_CHECK = 100

let numWrites = 0

async function isLogFileLimitExceeded(filePath) {
  const stats = await RNFS.stat(filePath)

  return Number(stats.size) > MAX_BYTE_SIZE_PER_FILE
}

async function rotateLogs() {
  try {
    if (await RNFS.exists(path3)) {
      await RNFS.unlink(path3)
    }
    if (await RNFS.exists(path2)) {
      await RNFS.moveFile(path2, path3)
    }
    if (await RNFS.exists(path1)) {
      await RNFS.moveFile(path1, path2)
    }
    await RNFS.writeFile(path1, '')
  } catch (e) {
    global.clog(e)
  }
}

async function writeLog(content) {
  try {
    const exists = await RNFS.exists(path)

    if (exists) {
      numWrites++
      if (numWrites > NUM_WRITES_BEFORE_ROTATE_CHECK) {
        if (await isLogFileLimitExceeded(path)) {
          await rotateLogs()
          numWrites = 0
        }
      }
      return await RNFS.appendFile(path, '\n' + content)
    } else {
      return await RNFS.writeFile(path, content)
    }
  } catch (e) {
    global.clog((e && e.message) || e)
  }
}

export async function readLogs() {
  try {
    let log = ''
    let exists

    exists = await RNFS.exists(path3)
    if (exists) {
      log = log + (await RNFS.readFile(path3))
    }
    exists = await RNFS.exists(path2)
    if (exists) {
      log = log + (await RNFS.readFile(path2))
    }
    exists = await RNFS.exists(path1)
    if (exists) {
      log = log + (await RNFS.readFile(path1))
    }
    return log
  } catch (err) {
    global.clog((err && err.message) || err)
  }
}

export async function log(...info: Array<number | string | null | {}>) {
  // const logs = normalize(...info)
  // const now = Date.now()
  // const d = dateFormat(now, 'HH:MM:ss:l')
  // try {
  //   await lock.acquire('logger', async () => {
  //     return writeLog(d + '..... ' + logs)
  //   })
  // } catch (e) {
  //   global.clog(e)
  // }
  // global.clog(logs)
}

async function request(data: string) {
  return global.fetch(`${ENV.LOG_SERVER.host}:${ENV.LOG_SERVER.port}/log`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data })
  })
}

export async function logToServer(...info: any[]) {
  const args = info[0]
  let logs = ''
  for (const item of args) {
    if (isObject(item)) {
      logs = logs + (' ' + JSON.stringify(item))
    } else {
      logs = logs + (' ' + item)
    }
  }
  request(logs).catch(e => {
    console.log('Failed logToServer')
  })
}
