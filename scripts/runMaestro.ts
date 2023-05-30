import cac from 'cac'
import { execSync, ExecSyncOptions } from 'child_process'
import { asObject, asString } from 'cleaners'
import { table } from 'console'
import glob from 'fast-glob'
import fs from 'fs'
import path, { basename } from 'path'

const cwd = path.join(__dirname, '..')
const execSyncOpts: ExecSyncOptions = { cwd, stdio: 'inherit' }
const TESTER_CONFIG = 'testerConfig.json'

const SELECTOR_REGEX = /(?<rawGroup>[\w+-]+):(?<rawTag>[\w+-]+)/
const YAML_TAG_REGEX = /tags:\n(?:- \w+\n)+/

const redANSII = '\x1b[31m'
const yellowANSII = '\x1b[33m'
const blueANSII = '\x1b[34m'
const resetANSII = '\x1b[0m'

const error = console.error.bind(console, redANSII, 'ERROR:' + resetANSII)
const warn = console.warn.bind(console, yellowANSII, 'WARN:' + resetANSII)
const info = console.info.bind(console, blueANSII, 'INFO:' + resetANSII)

interface MaestroOptions {
  device?: string
  testSelectors: string
  skipSelectors: string
  skipTestIds: number[]
  dryRun: boolean
  runAll: boolean
}

type RegexMap = Map<RegExp, RegExp>

interface EdgeTest {
  id: number
  path: string
  groups: string[]
  tags: string[]
}

const asTestConfig = asObject({
  stringReplacement: asObject(asString)
})

const compileRegex = (tag: string): RegExp => (tag?.length === 0 ? /''/ : new RegExp(tag.replace('+', '.*?')))

const extractTags = (testSelectors: string): RegexMap => {
  const tags = testSelectors.split(',')
  const regexps = tags.map(tag => {
    const { rawGroup = '', rawTag = '' } = SELECTOR_REGEX.exec(tag)?.groups || {}
    if (rawGroup.length === 0 || rawTag.length === 0) {
      error(`Invalid tag selector: ${rawGroup}:${rawTag} from tag: (${tag})`)
      process.exit(1)
    }
    const groupRegex = compileRegex(rawGroup)
    const tagRegex = compileRegex(rawTag)
    return [groupRegex, tagRegex]
  })
  return regexps.reduce((map: RegexMap, [groupRegex, tagRegex]: RegExp[]) => {
    map.set(groupRegex, tagRegex)
    return map
  }, new Map<RegExp, RegExp>())
}
const hasWildcardMatch = (regexpMap: RegexMap, groupTags: string[], testTags: string[]): boolean => {
  for (const [groupRegex, tagRegex] of regexpMap.entries()) {
    const groupMatchFound = groupTags.some(groupTag => groupRegex.test(groupTag))
    const tagMatchFound = testTags.length > 0 ? testTags.some(testTag => tagRegex.test(testTag)) : true

    if (groupMatchFound && tagMatchFound) {
      return true
    }
  }
  return false
}

const extractTagsFromYaml = (file: string): string[] => {
  const yamlDataRaw = fs.readFileSync(file, 'utf8')
  const yamlData = yamlDataRaw.match(YAML_TAG_REGEX)

  if (!yamlData) return []

  return yamlData.flatMap((match: string) =>
    match
      .split('\n')
      .slice(1, -1)
      .map((line: string) => line.trim().substring(2))
  )
}

const runTests = (edgeTests: EdgeTest[], options: MaestroOptions): void => {
  const { device } = options
  for (const { path } of edgeTests) {
    const cmd = device == null ? `maestro test ${path}` : `maestro --device ${device} test ${path}`
    const result = execSync(cmd, execSyncOpts)
    info(result.toString())
  }
}

const findTests = async (
  includedTags: RegexMap,
  excludedTags: RegexMap | undefined,
  skipTestIDs: number[],
  runAll: boolean
): Promise<EdgeTest[] | undefined> => {
  const tests: EdgeTest[] = []
  const skipTestIDsSet = new Set<number>(skipTestIDs)

  for await (const file of glob.stream(`${cwd}/maestro/**/C*.yaml`)) {
    const [groupIdentifiers, testId] = [
      path
        .dirname(file as string)
        .split('-')
        .slice(1),
      Number(
        path
          .basename(file as string, '.yaml')
          .split('-')[0]
          .substring(1)
      )
    ]
    const flowTags = extractTagsFromYaml(file as string)
    const edgeTest = {
      id: testId,
      tags: flowTags,
      groups: groupIdentifiers,
      path: file as string
    }
    const included = hasWildcardMatch(includedTags, groupIdentifiers, flowTags)
    const excluded = excludedTags != null && hasWildcardMatch(excludedTags, groupIdentifiers, flowTags)
    if (runAll || (included && !excluded && !skipTestIDsSet.has(testId))) {
      tests.push(edgeTest)
    }
  }

  return tests
}

const runMaestro = async (options: MaestroOptions): Promise<void> => {
  const { testSelectors, skipSelectors, skipTestIds, dryRun, runAll } = options
  const includedTags = extractTags(testSelectors)
  const excludedTags = skipSelectors.length === 0 ? undefined : extractTags(skipSelectors)
  const edgeTests = await findTests(includedTags, excludedTags, skipTestIds, runAll)
  if (edgeTests == null || edgeTests.length === 0) {
    warn('No tests found.')
    return
  }

  const header = ['ID', 'File', 'Groups', 'Tags']
  const tableData = edgeTests.map(({ id, path, tags, groups }: EdgeTest) => ({
    ID: id,
    File: basename(path),
    Tags: tags.join(', '),
    Groups: groups.join(', ')
  }))

  console.log(table(tableData, header))
  if (!dryRun) runTests(edgeTests, options)
  else info('Dry run, no tests were run.')
}

const cli = cac('Edge Maestro CLI')

interface CLIOptions {
  device?: string
  skip?: string
  skipIds?: string | number
  dryRun?: boolean
}

const replaceStrings = (filePath: string, replacements: { [key: string]: string }) => {
  const fileContent = fs.readFileSync(filePath, 'utf8')

  let newContent = fileContent
  for (const key in replacements) {
    const value = replacements[key]
    const regex = new RegExp(key, 'g')
    newContent = newContent.replace(regex, value)
  }

  // Write new content to file
  fs.writeFileSync(filePath, newContent)
}

const recursiveSearchReplace = (directoryPath: string, replacements: { [key: string]: string }) => {
  // Iterate over directory
  const files = fs.readdirSync(directoryPath)

  files.forEach(file => {
    const filePath = path.join(directoryPath, file)

    if (fs.statSync(filePath).isDirectory()) {
      // If file is a directory, recursively search in this directory
      recursiveSearchReplace(filePath, replacements)
    } else if (path.extname(filePath) === '.yaml') {
      // Replace strings in file
      replaceStrings(filePath, replacements)
    }
  })
}

cli
  .command('[includeTestSelectors]', 'Comma-separated list of test selectors to include')
  .option('-d [device]', 'Run test on specificied adb device id', { default: undefined })
  .option('--skip [skipSelectors]', 'Comma-separated list of test selectors to exclude', { default: '' })
  .option('--skip-ids [test IDs]', 'Comma-separated list of test IDs to exclude', { default: '0' })
  .option('--dry-run', 'Print the list of tests that would be run, but do not run them', { default: false })
  .action((includeTestSelectors: string, options: CLIOptions) => {
    const { device, skip = '', skipIds = '', dryRun = false } = options

    const testSelectors = includeTestSelectors == null ? '+:+' : includeTestSelectors
    let skipTestIds: number[] = []
    if (typeof skipIds === 'number') {
      skipTestIds = [skipIds]
    } else if (typeof skipIds === 'string') {
      skipTestIds = skipIds
        .split(',')
        .filter((s: string) => s !== '')
        .map((s: string) => parseInt(s, 10))
        .filter((n: number) => !isNaN(n) && n > 0 && n < 1000000)
    } else {
      error(`Invalid skip-ids option: "${skipIds}". Must be a comma-separated list of integers.`)
      process.exit(1)
    }

    if (fs.existsSync(TESTER_CONFIG)) {
      const testerConfigJson = fs.readFileSync(TESTER_CONFIG, { encoding: 'utf8' })
      const testerConfig = asTestConfig(JSON.parse(testerConfigJson))
      recursiveSearchReplace('maestro', testerConfig.stringReplacement)
    }

    const skipSelectors = skip
      .split(',')
      .filter((s: string) => s !== '')
      .join(',')
    const opts: MaestroOptions = {
      device,
      testSelectors,
      skipSelectors,
      skipTestIds,
      dryRun,
      runAll: false
    }
    runMaestro(opts).catch(e => console.error(e))
  })

cli.help()
cli.parse()
