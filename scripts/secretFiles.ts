import childProcess from 'child_process'
import fs from 'fs'
import { copySync } from 'fs-extra'
import { join } from 'path'

const argv = process.argv
const mylog = console.log

const _rootProjectDir = join(__dirname, '../')

let _currentPath = __dirname
const baseDir = join(_currentPath, '..')
const githubSshKey = process.env.GITHUB_SSH_KEY ?? join(baseDir, 'id_github')

const filePaths = [
  { file: 'deploy-config.json', path: './' },
  { file: 'GoogleService-Info.plist', path: './ios/edge/' },
  { file: 'google-services.json', path: './android/app/' },
  { file: 'env.json', path: './' }
]

async function main() {
  if (argv.length < 4) {
    mylog('Usage: node -r sucrase/register secretFiles.ts [branch] [secret files path]')
    mylog('  branch options: master, develop, beta')
  }

  const repoBranch = argv[2] // master or develop
  const filesArg = argv[3] // edge or some other app
  let filesDir: string

  if (filesArg.startsWith('git@') && filesArg.endsWith('.git')) {
    // Specified a git repo so clone into a local dir
    filesDir = './jenkins-files'
    chdir(baseDir)
    fs.rmSync(filesDir, { recursive: true, force: true })
    call(`GIT_SSH_COMMAND="ssh -i ${githubSshKey}" git clone --depth 1 ${filesArg} ${filesDir}`)
  } else {
    filesDir = filesArg
  }

  if (repoBranch.length < 3) throw new Error(`Invalid branch ${repoBranch}`)
  if (filesDir.length < 3) throw new Error(`Invalid filesDir ${filesDir}`)

  const copyFiles = (branch: string) => {
    filePaths.forEach(filePath => {
      const src = join(filesDir, branch, filePath.file)
      const dest = join(_rootProjectDir, filePath.path, filePath.file)
      quietCopy(src, dest)
    })
    // Copy keystores directory
    const keystoreSrc = join(filesDir, branch, 'keystores')
    if (fs.existsSync(keystoreSrc)) {
      copySync(keystoreSrc, join(_rootProjectDir, 'keystores'))
    }
  }
  // Always copy the files for the master branch first
  copyFiles('master')

  // Then copy the files for actual branch to overwrite those of master
  if (repoBranch !== 'master') {
    copyFiles(repoBranch)
  }
}

// Copies a file if it exists and overwrites destination
function quietCopy(src: string, dest: string) {
  if (fs.existsSync(src)) {
    console.log(`Copying ${src} > ${dest}`)
    fs.copyFileSync(src, dest)
  }
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

main().catch(e => console.log(e.message))
