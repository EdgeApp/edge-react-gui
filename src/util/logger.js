// @flow

import RNFS from 'react-native-fs'
import ENV from '../../env.json'

const SAVE_TIMEOUT = 1000 * 10 // ms
// const LOG_SERVER_TIMEOUT = 1000 // ms

const path = RNFS.DocumentDirectoryPath + '/logs.txt'

let buffer = ''
let lastSaving = Date.now()

const getTime = () => new Date().toISOString()

const isObject = (item: any) => typeof item === 'object' && item !== null

const normalize = (...info: Array<any>) =>
  `${getTime()} | ${info.map((item) => isObject(item) ? JSON.stringify(item) : item).join(' ')}`

function saveToBuffer (log: string) {
  buffer = buffer !== '' ? buffer + '\n' + log : log
}

function readAndClearBuffer () {
  const logs = buffer
  buffer = ''
  lastSaving = Date.now()
  return logs
}

async function writeLog (content) {
  try {
    const exists = await RNFS.exists(path)

    if (exists) return await RNFS.appendFile(path, '\n' + content)
    return await RNFS.writeFile(path, content)
  } catch (err) {
    console.log((err && err.message) || err)
  }
}

export async function readLogs () {
  try {
    return await RNFS.readFile(path)
  } catch (err) {
    console.log((err && err.message) || err)
  }
}

export async function log (...info: Array<number | string | null | {}>) {
  const logs = normalize(...info)

  if (Date.now() - lastSaving < SAVE_TIMEOUT) return saveToBuffer(logs)

  const bufferedLogs = readAndClearBuffer()

  await writeLog(bufferedLogs)
  await writeLog(logs)
}

async function request (data: string) {
  return global.fetch(`${ENV.LOG_SERVER.host}:${ENV.LOG_SERVER.port}/log`, {
    method: 'POST',
    headers : {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({data})
  })
}

export async function logToServer (...info: Array<any>) {
  let args = info[0]
  let logs = ''
  for (let item of args) {
    if (isObject(item)) {
      logs = logs + (' ' + JSON.stringify(item))
    } else {
      logs = logs + (' ' + item)
    }
  }
  request(logs)
}
