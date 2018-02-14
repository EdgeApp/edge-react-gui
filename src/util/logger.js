// @flow

import dateFormat from 'dateformat'
import RNFS from 'react-native-fs'

import ENV from '../../env.json'

const path1 = RNFS.DocumentDirectoryPath + '/logs1.txt'
const path2 = RNFS.DocumentDirectoryPath + '/logs2.txt'
const path3 = RNFS.DocumentDirectoryPath + '/logs3.txt'
const path = path1

let newBoot = true

const getTime = () => new Date().toISOString()

const isObject = (item: any) => typeof item === 'object' && item !== null

const normalize = (...info: Array<any>) => `${getTime()} | ${info.map(item => (isObject(item) ? JSON.stringify(item) : item)).join(' ')}`

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
async function writeLog (content) {
  try {
    const exists = await RNFS.exists(path)

    if (exists) {
      return await RNFS.appendFile(path, '\n' + content)
    } else {
      return await RNFS.writeFile(path, content)
    }
  } catch (e) {
    console.log((e && e.message) || e)
  }
}

export async function readLogs () {
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
    console.log((err && err.message) || err)
  }
}

export async function log (...info: Array<number | string | null | {}>) {
  if (newBoot) {
    try {
      newBoot = false
      await RNFS.unlink(path3)
      await RNFS.moveFile(path2, path3)
      await RNFS.moveFile(path1, path2)
    } catch (e) {
      newBoot = false
    }
  }
  const logs = normalize(...info)

  const now = Date.now()
  const d = dateFormat(now, 'HH:MM:ss:l')
  await writeLog(d + ': ' + logs)
}

async function request (data: string) {
  return global.fetch(`${ENV.LOG_SERVER.host}:${ENV.LOG_SERVER.port}/log`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data })
  })
}

export async function logToServer (...info: Array<any>) {
  const args = info[0]
  let logs = ''
  for (const item of args) {
    if (isObject(item)) {
      logs = logs + (' ' + JSON.stringify(item))
    } else {
      logs = logs + (' ' + item)
    }
  }
  request(logs)
}
