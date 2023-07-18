import { execSync, ExecSyncOptions } from 'child_process'
import { asObject, asString } from 'cleaners'
import fs from 'fs'
import { join } from 'path'

const asTestConfig = asObject({
  env: asObject(asString)
})

const cwd = join(__dirname, '..')
const TESTER_CONFIG = 'testerConfig.json'

let env
if (fs.existsSync(TESTER_CONFIG)) {
  const testerConfigJson = fs.readFileSync(TESTER_CONFIG, { encoding: 'utf8' })
  env = asTestConfig(JSON.parse(testerConfigJson)).env
}

const execSyncOpts: ExecSyncOptions = { cwd, stdio: 'inherit', env: { ...process.env, ...env } }
const args = process.argv.slice(2).join(' ')
const cmd = `maestro ${args}`
execSync(cmd, execSyncOpts)
