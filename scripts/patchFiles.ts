import childProcess from 'child_process'
import fs from 'fs'
import { join } from 'path'

const argv = process.argv
const mylog = console.log

const _rootProjectDir = join(__dirname, '../')

let _currentPath = __dirname

main().catch(e => console.log(e.message))

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
      try {
        call(`git apply ${file} 2> /dev/null`)
      } catch (e) {
        call(`git apply --reverse ${file}`)
        call(`git apply ${file}`)
      }
    })
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
