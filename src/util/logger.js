// @flow

import {makeReactNativeFolder} from 'disklet'

const LOGS_FOLDER = 'logs'

const root = makeReactNativeFolder()
const logsFolder = root.folder(LOGS_FOLDER)

const getTime = () => new Date().toISOString()

const getDate = () => getTime().slice(0, 10)

const isObject = (item) => typeof item === 'object' && item !== null

async function read (fileName) {
  const fileNames = await logsFolder.listFiles()
  if (fileNames.includes(fileName)) return logsFolder.file(fileName).getText()

  return ''
}

async function write (logString) {
  const fileName =`${getDate()}.txt`
  const logs = await read(fileName)
  const updatedLogs = logs ? `${logs}\n${logString}` : logString

  logsFolder.file(fileName).setText(updatedLogs)
}


export function log (...info: Array<number | string | null | {}>) {
  write(`${getTime()} | ${info.map((item) => isObject(item) ? JSON.stringify(item) : item).join(' ')}`)
}

export async function readLogs () {
  const fileNames = await logsFolder.listFiles()
  const files = await Promise.all(fileNames.map((fileName) => logsFolder.file(fileName).getText()))
  return files.join('\n\n')
}
