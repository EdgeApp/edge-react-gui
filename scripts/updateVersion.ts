// This script sets up the version numbers for a release build.
//
// Run it as `node -r sucrase/register ./scripts/updateVersion.ts [<branch>]`
//
// Each production build has a version number and a build number.
// The version number is a human-readable string like, "1.2.3-d",
// while the build number is a machine-readable integer like 18010203,
// based on the current date and an incrementing counter.
//
// The version number comes from package.json, plus an optional suffix
// based on the current branch name, which this script takes as a parameter.
//
// Once this script determines the version information,
// it writes to to a file called release-version.json.
// It is important that the CI system preserves this file between builds,
// since it contains the auto-incrementing build number.
//
// Finally, this script inserts the build number and version into
// the native project files, leaving the project ready for a release build.

import childProcess from 'child_process'
import { Disklet, makeNodeDisklet } from 'disklet'
import path from 'path'

import { asVersionFile, VersionFile } from './cleaners'

async function main() {
  const cwd = path.join(__dirname, '..')
  const disklet = makeNodeDisklet(cwd)

  const file = await disklet.getText('release-version.json')
  const versionFile = asVersionFile(file)

  console.log(versionFile)

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

main().catch(error => console.log(error))
