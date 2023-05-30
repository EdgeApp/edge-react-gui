import cac from 'cac'
import { execSync, ExecSyncOptions } from 'child_process'
import { asObject, asString } from 'cleaners'
import fs from 'fs'
import { join } from 'path'

const cwd = join(__dirname, '..')
const TESTER_CONFIG = 'testerConfig.json'
const maestroDir = join(cwd, 'maestro')

// const redANSII = '\x1b[31m'
const blueANSII = '\x1b[34m'
const resetANSII = '\x1b[0m'

// const error = console.error.bind(console, redANSII, 'ERROR:' + resetANSII)
// const warn = console.warn.bind(console, yellowANSII, 'WARN:' + resetANSII)
const info = console.info.bind(console, blueANSII, 'INFO:' + resetANSII)

const asTestConfig = asObject({
  env: asObject(asString)
})

const runMaestro = async (options: CLIOptions, env?: { [key: string]: string }): Promise<void> => {
  const { device, dryRun, excludeTags, includeTags, test } = options
  const group = test ?? maestroDir

  const dev = device == null ? '' : `--device ${device} `
  const inc = includeTags == null ? '' : `--include-tags ${includeTags} `
  const exc = excludeTags == null ? '' : `--exclude-tags ${includeTags} `

  const cmd = `maestro --no-ansi ${dev}${inc}${exc}test ${group}`
  if (!dryRun) {
    info(cmd)
    const execSyncOpts: ExecSyncOptions = { cwd, stdio: 'inherit', env: { ...process.env, ...env } }
    const result = execSync(cmd, execSyncOpts)
    const output = result != null ? result.toString() : 'No output result'
    info(output)
  } else {
    info(cmd)
  }
}

const cli = cac('Edge Maestro CLI')

interface CLIOptions {
  test?: string
  device?: string
  includeTags?: string
  excludeTags?: string
  dryRun?: boolean
}

cli
  .command('[param]', 'runMaestro.ts')
  .option('--test, -t [test]', 'Run specific test or group. Must specify the full path to test or directory relative to the repo working directory')
  .option('--device, -d [device]', 'Run test on specificied adb device id', { default: undefined })
  .option('--include-tags, --it [includeTag]', 'Comma-separated list of test tags to include', { default: undefined })
  .option('--exclude-tags, --et [excludeTags]', 'Comma-separated list of test tags to exclude', { default: undefined })
  .option('--dry-run, --dr', 'Print the list of tests that would be run, but do not run them', { default: false })
  .action((param: string, options: CLIOptions) => {
    if (param != null) {
      console.log(`Unknown param ${param}`)
      process.exit(-1)
    }
    let testerConfig
    if (fs.existsSync(TESTER_CONFIG)) {
      const testerConfigJson = fs.readFileSync(TESTER_CONFIG, { encoding: 'utf8' })
      testerConfig = asTestConfig(JSON.parse(testerConfigJson))
    }

    runMaestro(options, testerConfig?.env).catch(e => {
      console.error(e)
      process.exit(-1)
    })
  })

cli.help()
cli.parse()
