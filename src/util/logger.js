// @flow

import RNFS from 'react-native-fs'

const SAVE_TIMEOUT = 1000 * 10 // ms

const path = RNFS.DocumentDirectoryPath + '/logs.txt'

let buffer = ''
let lastSaving = Date.now()

const getTime = () => new Date().toISOString()

const isObject = (item) => typeof item === 'object' && item !== null

const normalize = (...info) =>
  `${getTime()} | ${info.map((item) => isObject(item) ? JSON.stringify(item) : item).join(' ')}`

function saveToBuffer (log) {
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
