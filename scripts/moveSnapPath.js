#!/usr/bin/env node -r sucrase/register
// @flow

// eslint-disable-next-line no-import-assign
const ENV = require('../env.json')
const fs = require('fs')

const FormData = require('form-data')
const fetch = require('node-fetch')
const path = require('path')
const DEEPAI_URI = 'https://api.deepai.org/api/image-similarity'
const { execSync } = require('child_process')
const stdout = execSync('xcrun simctl list').toString('utf8')
const devices = stdout.split('== Devices ==')[1].split('== Device Pairs ==')[0]
const bootedDeviceRow = devices.split('\n').find(row => row.includes('(Booted)')) ?? ''
const deviceUUID = bootedDeviceRow.substr(bootedDeviceRow.length - 47, 36)

const readCleanDirSync = path => fs.readdirSync(path).filter(fileName => !fileName.includes('DS_Store'))
const appsSnapshotFolder = '/Documents/__snapshots__'
const snapshotPath = 'specs/__snapshots__'

const snapShotFolder = path.join(`${__dirname}`, `../${snapshotPath}`)
console.log('snapShotFolder', snapShotFolder)

const homedir = require('os').homedir()
const applicationIdPath = path.join(`${homedir}`, '/Library/Developer/CoreSimulator/Devices/', `${deviceUUID}`, '/data/Containers/Data/Application/')
const applicationIdFolders = readCleanDirSync(applicationIdPath)
let minDate = -Infinity
let folder = ''
for (let i = 0; i < applicationIdFolders.length; i++) {
  const currentFolder = path.join(applicationIdFolders[i], appsSnapshotFolder)
  try {
    const { mtimeMs: date } = fs.statSync(path.join(applicationIdPath, currentFolder))

    if (date > minDate) {
      minDate = date
      folder = applicationIdFolders[i]
    }
  } catch (error) {}
}

const documentFolder = path.join(applicationIdPath, folder, appsSnapshotFolder)
console.log('documentFolder', documentFolder)

const newSnapShots = readCleanDirSync(documentFolder)
const newSnapShotsTrimmed = []

for (let i = 0; i < newSnapShots.length; i++) {
  newSnapShotsTrimmed.push(newSnapShots[i].split(':')[1])
}

const existingSnapShots = readCleanDirSync(snapShotFolder)
const existingSnapShotsTrimmed = []
for (let i = 0; i < existingSnapShots.length; i++) {
  existingSnapShotsTrimmed.push(existingSnapShots[i].split(':')[1])
}

for (let i = 0; i < newSnapShotsTrimmed.length; i++) {
  if (!existingSnapShotsTrimmed.includes(newSnapShotsTrimmed[i])) {
    console.log('newSnapShotsTrimmed[i]', newSnapShotsTrimmed[i])
    fs.copyFileSync(`${documentFolder}/${newSnapShots[i]}`, `${snapShotFolder}/${newSnapShots[i]}`)
  }
}

const compareSnapShots = async () => {
  const report = []
  for (let i = 0; i < newSnapShots.length; i++) {
    if (newSnapShots[i] === '.DS_Store') continue
    if (!newSnapShots[i].includes('.jpg')) continue

    const form = new FormData()
    const fileA = `${snapShotFolder}/${newSnapShots[i]}`
    const fileB = `${documentFolder}/${existingSnapShots[i]}`
    form.append('image1', fs.createReadStream(fileA))
    form.append('image2', fs.createReadStream(fileB))
    const newSnapShotFile = newSnapShots[i]
    const existingSnapShotFile = existingSnapShots[i]
    const snapShotReport = { newSnapShotFile, existingSnapShotFile }
    try {
      const response = await fetch(DEEPAI_URI, {
        method: 'POST',
        body: form,
        headers: {
          'api-key': ENV.DEEPAI_API_KEY
        }
      })
      const json = await response.json()
      const snapShotDifference = json.output.distance
      const snapShotResult = snapShotDifference <= 2 ? `Same Snapshot ` : `Different Snapshot Distance `
      report.push({ ...snapShotReport, snapShotResult, snapShotDifference })
    } catch (error) {
      console.log('DeepAI comparison failed with the following error', error)
      report.push({ ...snapShotReport, snapShotError: `Failed To Respond for snapshot ${newSnapShots[i]}` })
    }
  }
  return report
}

compareSnapShots().then(console.log).catch(console.error)
