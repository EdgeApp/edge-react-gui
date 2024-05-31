/* eslint-disable @typescript-eslint/no-var-requires */

import childProcess from 'child_process'
import fs from 'fs'
import { join } from 'path'

const argv = process.argv
const mylog = console.log

const _rootProjectDir = join(__dirname, '../')

let _currentPath = __dirname

main().catch(error => {
  console.error(error)
  process.exit(1)
})

async function main() {
  if (argv.length < 4) {
    mylog('Usage: node -r sucrase/register patchFiles.ts [project] [branch]')
    mylog('  project options: edge')
    mylog('  network options: master, develop, beta')
  }

  const guiDir = _rootProjectDir
  const repoBranch = argv[3] // master or develop
  const projectName = argv[2] // edge or some other app

  // Run patch files for this project/branch
  const patchDir = join(guiDir, 'deployPatches', projectName, repoBranch)

  if (fs.existsSync(patchDir)) {
    const files = fs.readdirSync(patchDir)
    const patchFiles = files.filter(f => f.endsWith('.patch'))
    chdir(guiDir)
    patchFiles.forEach(f => {
      const file = join(patchDir, f)
      call(`git apply ${file}`)
    })
  }

  // Patch native files for Sentry
  const env = require('../env.json')
  const sentryFiles = [
    './android/sentry.properties',
    './ios/sentry.properties',
    './ios/edge/AppDelegate.mm',
    './android/app/src/main/java/co/edgesecure/app/MainApplication.kt',
    './android/app/build.gradle'
  ]

  for (const file of sentryFiles) {
    await searchReplace(file, 'https://sentryuploadurl.mydomain.com', env.SENTRY_MAP_UPLOAD_URL)
    await searchReplace(file, 'SENTRY_MAP_UPLOAD_URL', env.SENTRY_MAP_UPLOAD_URL)
    await searchReplace(file, 'SENTRY_DSN_URL', env.SENTRY_DSN_URL)
    await searchReplace(file, 'SENTRY_MAP_UPLOAD_AUTH_TOKEN', env.SENTRY_MAP_UPLOAD_AUTH_TOKEN)
    await searchReplace(file, 'SENTRY_ORGANIZATION_SLUG', env.SENTRY_ORGANIZATION_SLUG)
    await searchReplace(file, 'SENTRY_PROJECT_SLUG', env.SENTRY_PROJECT_SLUG)
  }
}

export async function searchReplace(file: string, search: string, replace: string): Promise<void> {
  console.log(`${file} ${search} ${replace}`)
  const text = fs.readFileSync(file, { encoding: 'utf8' })
  const newText = text.split(search).join(replace)
  fs.writeFileSync(file, newText, { encoding: 'utf8' })
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
