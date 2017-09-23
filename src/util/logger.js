// @flow

import {makeReactNativeFolder} from 'disklet'

const LOGS_FOLDER = 'logs'
const SAVE_TIMEOUT = 1000 * 10 // ms

let buffer = ''
let lastSaving = Date.now()

const root = makeReactNativeFolder()
const logsFolder = root.folder(LOGS_FOLDER)

const getTime = () => new Date().toISOString()

const getDate = () => getTime().slice(0, 10)

const isObject = (item) => typeof item === 'object' && item !== null

const joinLogs = (...logs) => logs.filter((str) => str !== '').join('\n')

function saveToBuffer (log) {
  buffer = joinLogs(buffer, log)
}

function readAndClearBuffer () {
  const logs = buffer
  buffer = ''
  lastSaving = Date.now()
  return logs
}

async function read (fileName) {
  const fileNames = await logsFolder.listFiles()
  if (fileNames.includes(fileName)) return logsFolder.file(fileName).getText()

  return ''
}

async function write (logString) {
  if (Date.now() - lastSaving < SAVE_TIMEOUT) return saveToBuffer(logString)

  const bufferedLogs = readAndClearBuffer()
  const fileName =`${getDate()}.txt`
  const logs = await read(fileName)
  const updatedLogs = joinLogs(logs, bufferedLogs, logString)

  logsFolder.file(fileName).setText(updatedLogs)
}


export async function log (...info: Array<number | string | null | {}>) {
  await write(`${getTime()} | ${info.map((item) => isObject(item) ? JSON.stringify(item) : item).join(' ')}`)
}

export async function readLogs () {
  const fileNames = await logsFolder.listFiles()
  const files = await new Promise.all(fileNames.map((fileName) => (fileName.indexOf('.txt') > -1) ? logsFolder.file(fileName).getText() : ''))
  return files.join('\n\n')
}
