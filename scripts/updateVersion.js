#!/usr/bin/env node -r sucrase/register
// @flow
// This script sets up the version numbers for a release build.
//
// Run it as `./scripts/updateVersion.js [<branch>]`
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
import { type Disklet, makeNodeDisklet } from 'disklet'
import path from 'path'

import { type VersionFile, asLegacyBuildNumFile, asVersionFile } from './cleaners.js'

const specialBranches: { [branch: string]: string } = {
  develop: '-d',
  master: '',
  test: '-t',
  yolo: '-yolo',
  'test-cheddar': '-cheddar',
  'test-feta': '-feta',
  'test-gouda': '-gouda',
  'test-halloumi': '-halloumi',
  'test-paneer': '-paneer'
}

async function main() {
  const cwd = path.join(__dirname, '..')
  const disklet = makeNodeDisklet(cwd)
  const [branch] = process.argv.slice(2)

  // Determine the current build number:
  const build = Math.max(
    pickBuildNumber(),
    1 + (await readLastBuildNumber(disklet)),
    1 + (await readLegacyBuildNumber(disklet, 'ios')),
    1 + (await readLegacyBuildNumber(disklet, 'android'))
  )

  // Determine the current version:
  const packageJson = JSON.parse(await disklet.getText('package.json'))
  const version = `${packageJson.version}${pickVersionSuffix(branch)}`

  // Write the vesion info file:
  const versionFile = {
    branch,
    build,
    version
  }
  console.log(versionFile)
  await disklet.setText('release-version.json', JSON.stringify(versionFile, null, 2))

  // Update the native project files:
  await Promise.all([updateAndroid(disklet, versionFile), updateIos(cwd, versionFile)])
}

/**
 * Pick a build number based on the current date.
 */
function pickBuildNumber(now: Date = new Date()) {
  const year = now.getFullYear() - 2000
  const month = now.getMonth() + 1
  const day = now.getDate()
  const counter = 1

  return (year % 100) * 1000000 + month * 10000 + day * 100 + counter
}

/**
 * Pick a suffix to add to the package.json version.
 */
function pickVersionSuffix(branch: string | void): string {
  if (branch == null || branch === '') return ''

  const specialSuffix = specialBranches[branch]
  if (specialSuffix != null) return specialSuffix

  return '-' + branch.replace(/[^0-9a-zA-Z]+/g, '-')
}

/**
 * Read the previous build number from release-version.json file.
 */
async function readLastBuildNumber(disklet: Disklet): Promise<number> {
  try {
    const text = await disklet.getText('release-version.json')
    const { build } = asVersionFile(text)
    return build
  } catch (e) {
    return 0
  }
}

/**
 * Read the legacy buildnum file.
 */
async function readLegacyBuildNumber(disklet: Disklet, platform: 'ios' | 'android'): Promise<number> {
  try {
    const text = await disklet.getText(`buildnum/${platform}.json`)
    const { buildNum } = asLegacyBuildNumFile(text)
    return Number(buildNum)
  } catch (e) {
    return 0
  }
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
  const opts = {
    cwd: path.join(cwd, 'ios'),
    stdio: 'inherit'
  }
  childProcess.execSync(`agvtool new-marketing-version ${versionFile.version}`, opts)
  childProcess.execSync(`agvtool new-version -all ${versionFile.build}`, opts)
}

main().catch(error => console.log(error))
