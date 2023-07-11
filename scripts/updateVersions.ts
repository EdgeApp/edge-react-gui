// This script sets up the version numbers for a release build.
//
// Run it as `node -r sucrase/register ./scripts/updateVersion.ts [<branch>]`
//
// This script inserts the build number and version into the native project
// files, leaving the project ready for a release build.

import childProcess from 'child_process'
import { Disklet, makeNodeDisklet } from 'disklet'
import path from 'path'

import { asVersionFile, VersionFile } from './cleaners'

const versionFileName = 'release-version.json'

async function main() {
  const cwd = path.join(__dirname, '..')
  const disklet = makeNodeDisklet(cwd)

  // Determine the current version:
  const rawJson = JSON.parse(await disklet.getText(versionFileName))
  const versionFile = asVersionFile(rawJson)
  if (versionFile == null) throw new Error('Could not get version file')

  // Update the native project files:
  await Promise.all([updateAndroid(disklet, versionFile), updateIos(cwd, versionFile)])
}

/**
 * Inserts the build information into the Android project files.
 */
async function updateAndroid(disklet: Disklet, versionFile: VersionFile): Promise<void> {
  let gradle = await disklet.getText('android/app/build.gradle')

  gradle = gradle.replace(/versionName "[0-9.]+"/g, `versionName "${versionFile.version}"`)
  gradle = gradle.replace(/versionCode [0-9]+/g, `versionCode ${versionFile.build}`)

  await disklet.setText('android/app/build.gradle', gradle)
}

/**
 * Inserts the build information into the iOS project files.
 */
function updateIos(cwd: string, versionFile: VersionFile): void {
  childProcess.execSync(`agvtool new-marketing-version ${versionFile.version}`, {
    cwd: path.join(cwd, 'ios'),
    stdio: 'inherit'
  })
  childProcess.execSync(`agvtool new-version -all ${versionFile.build}`, {
    cwd: path.join(cwd, 'ios'),
    stdio: 'inherit'
  })
}

main().catch(error => {
  console.error(error)
  throw error
})
