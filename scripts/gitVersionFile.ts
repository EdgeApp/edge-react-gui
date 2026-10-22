// This script sets up the version numbers for a release build.
//
// Run it as `node -r sucrase/register ./scripts/gitVersionFile.ts [<branch>]`
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
// it returns a JSON string with all version information.
//

/****************************************************************************/
// WARNING: This script is run from the Jenkinsfile without npm install of
// the package.json dependencies. It should require only default nodejs
// packages. It may use typescript as sucrase will be installed by the
// Jenkinsfile
/****************************************************************************/

import childProcess from 'child_process'
import fs from 'fs'
import { join } from 'path'

const specialBranches: Record<string, string> = {
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
  'test-paneer': '-paneer',
  'test-kraft': '-kraft',
  'test-colby': '-colby',
  'test-string': '-string',
  'test-parm': '-parm',
  'test-swiss': '-swiss'
}

let _currentPath = __dirname
const baseDir = join(_currentPath, '..')
const versionFileName = 'release-version.json'

async function main(): Promise<void> {
  const cwd = join(__dirname, '..')
  const branch = process.argv[2] ?? 'master'

  // Determine the current version:
  const packageJson = JSON.parse(
    fs.readFileSync(join(cwd, 'package.json'), { encoding: 'utf8' })
  )
  const version = `${packageJson.version}${pickVersionSuffix(branch)}`

  updateVersionFile(branch, version)
}

function updateVersionFile(branch: string, version: string): void {
  const buildRepoUrl =
    process.env.BUILD_REPO_URL ?? 'git@github.com:EdgeApp/edge-build-server.git'
  const githubSshKey = process.env.GITHUB_SSH_KEY ?? join(baseDir, 'id_github')

  // Determine the current build number:

  const pathTemp = buildRepoUrl.split('/')
  const repo = pathTemp[pathTemp.length - 1].replace('.git', '')
  const repoPath = join(baseDir, repo)

  let retries = 5
  while (--retries > 0) {
    if (fs.existsSync(repoPath)) {
      call(`rm -rf ${repoPath}`)
    }
    // Clone repo
    chdir(baseDir)
    call(
      `GIT_SSH_COMMAND="ssh -i ${githubSshKey}" git clone --depth 1 ${buildRepoUrl}`
    )
    const newBuildNum = pickBuildNumber()
    let build
    // Rm edge-build-server
    const versionFileDir = join(repoPath, 'versionFiles', branch)
    const versionFilePath = join(versionFileDir, versionFileName)
    if (fs.existsSync(versionFilePath)) {
      const result = fs.readFileSync(versionFilePath, { encoding: 'utf8' })
      const { build: previousBuild } = JSON.parse(result)
      if (typeof previousBuild !== 'number')
        throw new Error(`Invalid previous buildNum ${previousBuild}`)
      // Advance by 3, not 1, so each build owns a block of three
      // versionCodes: the Android split APKs add per-ABI offsets to the
      // build number (universal +0, armeabi-v7a +1, arm64-v8a +2, see
      // app/build.gradle), and Google Play rejects any versionCode it
      // has ever seen, so consecutive builds must never overlap blocks.
      // The stride must stay >= the number of APK flavors per build,
      // which is pinned by the gradle splits include list. Widening the
      // gap the other way, by giving the splits their own numeric range
      // (build * 10 + offset) and leaving this at +1, does not work: the
      // next build's universal APK would then carry a lower code than
      // the previous build's splits, which Play treats as a downgrade,
      // and the universal APK has to keep reporting the plain build
      // number because getBuildNumber() returns the versionCode and the
      // info server string-compares it against minBuildNum/maxBuildNum/
      // exactBuildNum rules.
      //
      // Costs, both accepted: iOS build numbers share this counter and
      // simply skip by 3, and same-day capacity drops from 99 builds to
      // 33 before the date-shaped number bleeds into the next day's
      // range. That bleed already existed at 99, and it only misreads
      // the date -- build numbers stay unique and increasing either way:
      build = Math.max(previousBuild + 3, newBuildNum)
    } else {
      build = newBuildNum
    }
    const tryVersionFile = {
      build,
      version,
      branch
    }

    call(`mkdir -p ${versionFileDir}`)
    const versionFileString = JSON.stringify(tryVersionFile)
    fs.writeFileSync(versionFilePath, versionFileString, { encoding: 'utf8' })
    fs.writeFileSync(join(baseDir, versionFileName), versionFileString, {
      encoding: 'utf8'
    })
    chdir(repoPath)
    call(`git add ${versionFilePath}`)
    call(`git commit -m "Update ${branch} to build ${build}"`)
    try {
      call(`GIT_SSH_COMMAND="ssh -i ${githubSshKey}" git push`)
      fs.writeFileSync(join(baseDir, versionFileName), versionFileString, {
        encoding: 'utf8'
      })
      process.exit(0)
    } catch (e: any) {
      // Error pushing file. Retry a few times
    }
  }
  console.error(`Unable to get new version`)
  process.exit(-1)
}

/**
 * Pick a build number based on the current date.
 */
function pickBuildNumber(now: Date = new Date()): number {
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

function chdir(path: string): void {
  _currentPath = path
}

function call(cmdstring: string): void {
  childProcess.execSync(cmdstring, {
    encoding: 'utf8',
    timeout: 3600000,
    stdio: 'inherit',
    cwd: _currentPath,
    killSignal: 'SIGKILL'
  })
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(-1)
})
