import childProcess from 'child_process'
import fs from 'fs'
import { copySync } from 'fs-extra'
import { join } from 'path'

import { MAX_SECRET_LEN } from './makeApiSigner'

const argv = process.argv
const mylog = console.log

const _rootProjectDir = join(__dirname, '../')

let _currentPath = __dirname
const baseDir = join(_currentPath, '..')
const githubSshKey = process.env.GITHUB_SSH_KEY ?? join(baseDir, 'id_github')

const REQUIRED_FILES = ['config.json', 'keys.json'] as const

const filePaths = [
  { file: 'deploy-config.json', path: './' },
  { file: 'config.json', path: './' },
  { file: 'keys.json', path: './' },
  { file: 'edgeKey.json', path: './' },
  { file: 'fastlane.json', path: './' },
  { file: 'GoogleService-Info.plist', path: './ios/edge/' },
  { file: 'google-services.json', path: './android/app/' }
]

async function main(): Promise<void> {
  if (argv.length < 4) {
    mylog(
      'Usage: node -r sucrase/register secretFiles.ts [branch] [secret files path]'
    )
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
    call(
      `GIT_SSH_COMMAND="ssh -i ${githubSshKey}" git clone --depth 1 ${filesArg} ${filesDir}`
    )
  } else {
    filesDir = filesArg
  }

  if (repoBranch.length < 3) throw new Error(`Invalid branch ${repoBranch}`)
  if (filesDir.length < 3) throw new Error(`Invalid filesDir ${filesDir}`)

  const copyFiles = (branch: string): void => {
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

  const missing = REQUIRED_FILES.filter(
    file => !fs.existsSync(join(_rootProjectDir, file))
  )
  if (missing.length > 0) {
    throw new Error(
      `Required secret file(s) missing after copy: ${missing.join(', ')}`
    )
  }

  // edgeKey.json is required for native HMAC codegen after this step.
  const edgeKeyDest = join(_rootProjectDir, 'edgeKey.json')
  if (!fs.existsSync(edgeKeyDest)) {
    const searched =
      repoBranch === 'master' ? 'master' : `master, ${repoBranch}`
    throw new Error(
      `edgeKey.json missing after secretFiles copy (expected under ${filesDir}/{${searched}}/)`
    )
  }
  let edgeKey: { apiKey?: unknown; apiSecret?: unknown }
  try {
    edgeKey = JSON.parse(fs.readFileSync(edgeKeyDest, 'utf8'))
  } catch (error: unknown) {
    throw new Error(
      `edgeKey.json is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
  if (typeof edgeKey.apiKey !== 'string' || edgeKey.apiKey === '') {
    throw new Error('edgeKey.json apiKey must be a non-empty string')
  }
  if (typeof edgeKey.apiSecret !== 'string' || edgeKey.apiSecret === '') {
    throw new Error('edgeKey.json apiSecret must be a non-empty hex string')
  }
  const secretHex = edgeKey.apiSecret.replace(/^0x/i, '').trim()
  if (!/^[0-9a-fA-F]+$/.test(secretHex) || secretHex.length % 2 !== 0) {
    throw new Error('edgeKey.json apiSecret must be even-length hex')
  }
  const secretBytes = secretHex.length / 2
  if (secretBytes > MAX_SECRET_LEN) {
    throw new Error(
      `edgeKey.json apiSecret must be 1..${MAX_SECRET_LEN} bytes (got ${secretBytes})`
    )
  }
}

// Copies a file if it exists and overwrites destination
function quietCopy(src: string, dest: string): void {
  if (fs.existsSync(src)) {
    console.log(`Copying ${src} > ${dest}`)
    fs.copyFileSync(src, dest)
  }
}

function chdir(path: string): void {
  console.log('chdir: ' + path)
  _currentPath = path
}

function call(cmdstring: string): void {
  console.log('call: ' + cmdstring)
  childProcess.execSync(cmdstring, {
    encoding: 'utf8',
    timeout: 3600000,
    cwd: _currentPath
  })
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e))
  process.exit(1)
})
