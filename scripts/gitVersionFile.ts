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
// WARNING: This script is run from the Jenkinsfile without yarn install of
// the package.json dependencies. It should require only default nodejs
// packages. It may use typescript as sucrase will be install globally by the
// Jenkinsfile
/****************************************************************************/

import childProcess from 'child_process'
import fs from 'fs'
import { join } from 'path'

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
  const cwd = join(__dirname, '..')
  const branch = process.argv[2] ?? 'master'

  // Determine the current version:
  const packageJson = JSON.parse(fs.readFileSync(join(cwd, 'package.json'), { encoding: 'utf8' }))
  const version = `${packageJson.version}${pickVersionSuffix(branch)}`

  updateVersionFile(branch, version)
}

function updateVersionFile(branch: string, version: string): void {
  const buildRepoUrl = process.env.BUILD_REPO_URL ?? 'git@github.com:EdgeApp/edge-build-server.git'
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
    call(`GIT_SSH_COMMAND="ssh -i ${githubSshKey}" git clone --depth 1 ${buildRepoUrl}`)
    const newBuildNum = pickBuildNumber()
    let build
    // Rm edge-build-server
    const versionFileDir = join(repoPath, 'versionFiles', branch)
    const versionFilePath = join(versionFileDir, versionFileName)
    if (fs.existsSync(versionFilePath)) {
      const result = fs.readFileSync(versionFilePath, { encoding: 'utf8' })
      const { build: previousBuild } = JSON.parse(result)
      if (typeof previousBuild !== 'number') throw new Error(`Invalid previous buildNum ${previousBuild}`)
      build = Math.max(previousBuild + 1, newBuildNum)
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
    fs.writeFileSync(join(baseDir, versionFileName), versionFileString, { encoding: 'utf8' })
    chdir(repoPath)
    call(`git add ${versionFilePath}`)
    call(`git commit -m "Update ${branch} to build ${build}"`)
    try {
      call(`GIT_SSH_COMMAND="ssh -i ${githubSshKey}" git push`)
      fs.writeFileSync(join(baseDir, versionFileName), versionFileString, { encoding: 'utf8' })
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

function chdir(path: string) {
  _currentPath = path
}

function call(cmdstring: string) {
  childProcess.execSync(cmdstring, {
    encoding: 'utf8',
    timeout: 3600000,
    stdio: 'inherit',
    cwd: _currentPath,
    killSignal: 'SIGKILL'
  })
}

main().catch(error => {
  console.error(error)
  process.exit(-1)
})
