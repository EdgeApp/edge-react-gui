// This script puts a release build's version numbers into the native
// projects.
//
// Run it as `node -r sucrase/register ./scripts/updateVersion.ts`
//
// Each production build has a version number and a build number.
// The version number is a human-readable string like, "1.2.3-d",
// while the build number is a machine-readable integer like 18010203,
// based on the current date and an incrementing counter.
//
// Both come from release-version.json, which scripts/gitVersionFile.ts
// writes. This script inserts them into the native project files, leaving
// the project ready for a release build. Any failure exits non-zero, so a
// build never goes ahead with the wrong version.

import childProcess from 'child_process'
import { type Disklet, makeNodeDisklet } from 'disklet'
import path from 'path'

import { asVersionFile, type VersionFile } from './cleaners'

async function main(): Promise<void> {
  const cwd = path.join(__dirname, '..')
  const disklet = makeNodeDisklet(cwd)

  const file = await disklet.getText('release-version.json')
  const versionFile = asVersionFile(file)

  console.log(versionFile)

  // Update the native project files:
  await updateAndroid(disklet, versionFile)
  updateIos(cwd, versionFile)
}

/**
 * Inserts the build information into the Android project files.
 */
async function updateAndroid(
  disklet: Disklet,
  versionFile: VersionFile
): Promise<void> {
  const gradle = await disklet.getText('android/app/build.gradle')
  await disklet.setText(
    'android/app/build.gradle',
    stampGradle(gradle, versionFile)
  )
}

/**
 * Puts the version and build number into build.gradle's text. A line that
 * is missing throws, so the old version is never left in place.
 */
export function stampGradle(
  gradle: string,
  versionFile: Pick<VersionFile, 'version' | 'build'>
): string {
  const replace = (text: string, pattern: RegExp, line: string): string => {
    if (text.search(pattern) < 0) {
      throw new Error(`android/app/build.gradle has no ${String(pattern)}`)
    }
    return text.replace(pattern, line)
  }
  return replace(
    replace(
      gradle,
      /versionName "[^"]*"/g,
      `versionName "${versionFile.version}"`
    ),
    /versionCode [0-9]+/g,
    `versionCode ${versionFile.build}`
  )
}

/**
 * Inserts the build information into the iOS project files.
 */
function updateIos(cwd: string, versionFile: VersionFile): void {
  childProcess.execSync(
    `agvtool new-marketing-version ${versionFile.version}`,
    {
      cwd: path.join(cwd, 'ios'),
      stdio: 'inherit'
    }
  )
  childProcess.execSync(`agvtool new-version -all ${versionFile.build}`, {
    cwd: path.join(cwd, 'ios'),
    stdio: 'inherit'
  })
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
}
