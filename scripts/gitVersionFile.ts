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
import fs from 'fs'
import path, { join } from 'path'

import { asVersionFile, VersionFile } from './cleaners'

const specialBranches: { [branch: string]: string } = {
  develop: '-d',
  master: '',
  beta: '',
  coinhub: '',
  staging: '-rc',
  test: '-t',
  yolo: '-yolo',
  'test-cheddar': '-cheddar',
  'test-feta': '-feta',
  'test-gouda': '-gouda',
  'test-halloumi': '-halloumi',
  'test-paneer': '-paneer'
}

let _currentPath = __dirname
const baseDir = join(_currentPath, '..')
const versionFileName = 'release-version.json'

async function main() {
  const cwd = path.join(__dirname, '..')
  const disklet = makeNodeDisklet(cwd)
  const [branch] = process.argv.slice(2)

  // Determine the current version:
  const packageJson = JSON.parse(await disklet.getText('package.json'))
  const version = `${packageJson.version}${pickVersionSuffix(branch)}`

  const versionFile = getVersionFile(branch, version)
  if (versionFile == null) throw new Error('Could not get version file')

  console.log(versionFile)

  // Update the native project files:
  await Promise.all([updateAndroid(disklet, versionFile), updateIos(cwd, versionFile)])
}

function getVersionFile(branch: string, version: string): VersionFile | undefined {
  const buildRepoUrl = process.env.BUILD_REPO_URL ?? 'git@github.com:EdgeApp/edge-build-server.git'
  const githubSshKey = process.env.GITHUB_SSH_KEY ?? join(baseDir, 'id_github')

  // Determine the current build number:

  const pathTemp = buildRepoUrl.split('/')
  const repo = pathTemp[pathTemp.length - 1].replace('.git', '')
  let versionFile: VersionFile | undefined
  const repoPath = join(baseDir, repo)

  let retries = 5
  while (--retries > 0) {
    if (fs.existsSync(repoPath)) {
      call(`rm -rf ${repoPath}`)
    }
    // Clone repo
    chdir(baseDir)
    call(`GIT_SSH_COMMAND="ssh -i ${githubSshKey}" git clone --depth 1 ${buildRepoUrl}`)
    const newBuildNum = pickBuildNumber()
    let build
    // Rm edge-build-server
    const versionFileDir = join(repoPath, 'versionFiles', branch)
    const versionFilePath = join(versionFileDir, versionFileName)
    if (fs.existsSync(versionFilePath)) {
      const result = fs.readFileSync(versionFilePath, { encoding: 'utf8' })
      const verFile = asVersionFile(result)
      build = Math.max(verFile.build + 1, newBuildNum)
    } else {
      build = newBuildNum
    }
    const tryVersionFile: VersionFile = {
      build,
      version,
      branch
    }

    call(`mkdir -p ${versionFileDir}`)
    const versionFileString = JSON.stringify(tryVersionFile)
    fs.writeFileSync(versionFilePath, versionFileString, { encoding: 'utf8' })
    fs.writeFileSync(join(baseDir, versionFileName), versionFileString, { encoding: 'utf8' })
    chdir(repoPath)
    call(`git add ${versionFilePath}`)
    call(`git commit -m "Update ${branch} to build ${build}"`)
    try {
      call(`GIT_SSH_COMMAND="ssh -i ${githubSshKey}" git push`)
      versionFile = tryVersionFile
      break
    } catch (e: any) {
      console.log('Error pushing version file...')
    }
  }
  return versionFile
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
function pickVersionSuffix(branch?: string): string {
  if (branch == null || branch === '') return ''

  const specialSuffix = specialBranches[branch]
  if (specialSuffix != null) return specialSuffix

  return '-' + branch.replace(/[^0-9a-zA-Z]+/g, '-')
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

function chdir(path: string) {
  console.log('chdir: ' + path)
  _currentPath = path
}

function call(cmdstring: string) {
  console.log('call: ' + cmdstring)
  childProcess.execSync(cmdstring, {
    encoding: 'utf8',
    timeout: 3600000,
    stdio: 'inherit',
    cwd: _currentPath,
    killSignal: 'SIGKILL'
  })
}

main().catch(error => console.log(error))
