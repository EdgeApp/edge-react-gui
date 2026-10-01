/**
 * Stages and publishes the CLI as its own npm package.
 *
 * Nothing about this needs the CLI to move out of this repository. Rollup has
 * already inlined every module it uses from `src/`, so the published package
 * is two bundles, an optional native addon, a README and a licence — the app's
 * sources are not part of it and the published manifest is not the app's.
 * That is also why the app's own `package.json` stays `private: true`: the
 * thing published here is assembled in a temporary directory and the app
 * itself can never be pushed to npm by accident.
 *
 * Usage:
 *
 *   npm run publish:cli -- --dry-run         # pack and report, publish nothing
 *   npm run publish:cli -- --out /tmp/pkg    # stage for inspection, then stop
 *   npm run publish:cli                      # publish
 *   npm run publish:cli -- --tag next        # publish under a dist-tag
 *
 * A build server needs `edgeKey.json` and nothing else: with it,
 * `build:cli:all` generates the XOR-split secret shards, compiles the Node
 * HMAC addon and rolls up both bundles. Without it the addon cannot be built
 * at all, so publishing then needs `--allow-unsigned` said out loud rather
 * than quietly shipping a CLI that cannot sign.
 */
import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { CLI_PACKAGE_META } from '../src/cli/npmMeta'

const ROOT = path.resolve(__dirname, '..')
const MANIFEST = path.join(ROOT, 'src/cli/generated/npmPackage.json')
const SIGNER = 'edge_api_signer.node'

const argv = process.argv.slice(2)
const has = (flag: string): boolean => argv.includes(flag)
const valueOf = (flag: string): string | undefined => {
  const i = argv.indexOf(flag)
  return i === -1 ? undefined : argv[i + 1]
}

const dryRun = has('--dry-run')
const stageOnly = valueOf('--out')
const allowUnsigned = has('--allow-unsigned')
const allowDirty = has('--allow-dirty')
const skipBuild = has('--no-build')
const tag = valueOf('--tag')

function run(command: string, args: string[], cwd = ROOT): void {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed (${result.status})`)
  }
}

function capture(command: string, args: string[]): string {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8' })
  return result.status === 0 ? result.stdout.trim() : ''
}

// ------------------------------------------------------------ preconditions

// A publish from a dirty tree cannot be reproduced from any commit, and the
// one artifact nobody can re-derive later is the one in the registry.
if (!allowDirty && capture('git', ['status', '--porcelain']) !== '') {
  throw new Error(
    'The working tree has uncommitted changes. Commit them, or pass ' +
      '--allow-dirty if this is deliberate.'
  )
}

// The manifest is generated and committed, so a stale one would publish the
// wrong dependency list. `--check` is the same gate CI runs.
run('node', [
  '-r',
  'sucrase/register',
  'scripts/buildCliManifest.ts',
  '--check'
])

const hasKey = fs.existsSync(path.join(ROOT, 'edgeKey.json'))
if (!skipBuild) {
  if (hasKey) {
    run('npm', ['run', 'build:cli:all'])
  } else {
    if (!allowUnsigned) {
      throw new Error(
        'edgeKey.json is absent, so the Node HMAC addon cannot be built and ' +
          'the published CLI could not sign info-server requests. Put the key ' +
          'in place, or pass --allow-unsigned to publish without it.'
      )
    }
    console.warn(
      '! edgeKey.json absent: building without the native signer. The ' +
        'published CLI will fall back to unsigned info-server requests.'
    )
    run('npm', ['run', 'build:cli'])
  }
}

// ----------------------------------------------------------------- staging

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) as Record<
  string,
  unknown
>
// The in-repo copy carries a "generated, do not edit" marker. Published
// manifests should not.
delete manifest.$comment

const stage =
  stageOnly ?? fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-publish-'))
fs.mkdirSync(stage, { recursive: true })

interface Staged {
  from: string
  to: string
  required: boolean
}
const files: Staged[] = [
  { from: 'lib/edgeCli.js', to: 'edgeCli.js', required: true },
  { from: 'lib/edgeEngine.js', to: 'edgeEngine.js', required: true },
  { from: `lib/${SIGNER}`, to: SIGNER, required: false },
  { from: 'LICENSE', to: 'LICENSE', required: true }
]

for (const file of files) {
  const source = path.join(ROOT, file.from)
  if (!fs.existsSync(source)) {
    if (file.required) {
      throw new Error(`${file.from} is missing. Run \`npm run build:cli\`.`)
    }
    continue
  }
  fs.copyFileSync(source, path.join(stage, file.to))
}

// The bin needs the execute bit. npm infers it from the shebang on install,
// but a packed tarball that already has it behaves the same way everywhere.
fs.chmodSync(path.join(stage, 'edgeCli.js'), 0o755)

const signed = fs.existsSync(path.join(stage, SIGNER))

// `docs/EDGE_CLI.md` is the CLI's documentation, so it is the README rather
// than a second description written to drift from it. The header is the part
// that only makes sense once the thing has a package name.
const header = [
  `# ${CLI_PACKAGE_META.name}`,
  '',
  CLI_PACKAGE_META.description,
  '',
  '```sh',
  `npm install -g ${CLI_PACKAGE_META.name}`,
  `${CLI_PACKAGE_META.binName} --help`,
  '```',
  '',
  'Or without installing:',
  '',
  '```sh',
  `npx ${CLI_PACKAGE_META.name} --help`,
  '```',
  '',
  signed
    ? ''
    : 'This build has no native HMAC signer, so it makes unsigned ' +
      'info-server requests and cannot read gated plugin keys.\n',
  '---',
  ''
].join('\n')
fs.writeFileSync(
  path.join(stage, 'README.md'),
  header + fs.readFileSync(path.join(ROOT, 'docs/EDGE_CLI.md'), 'utf8')
)

fs.writeFileSync(
  path.join(stage, 'package.json'),
  JSON.stringify(manifest, null, 2) + '\n'
)

// ----------------------------------------------------------------- report

const staged = fs.readdirSync(stage).sort()
console.log(`\nStaged ${manifest.name as string}@${manifest.version as string}`)
console.log(`  ${stage}`)
let total = 0
for (const name of staged) {
  const size = fs.statSync(path.join(stage, name)).size
  total += size
  console.log(`  ${(size / 1024).toFixed(0).padStart(7)} KB  ${name}`)
}
console.log(`  ${(total / 1024).toFixed(0).padStart(7)} KB  total (unpacked)`)
console.log(
  `  native signer: ${
    signed ? `included (${process.platform}-${process.arch})` : 'ABSENT'
  }`
)

if (stageOnly != null) {
  console.log('\n--out given, so stopping before publish.')
  process.exit(0)
}

// ---------------------------------------------------------------- publish

const publishArgs = ['publish']
// A scoped package is restricted unless this says otherwise, and the first
// publish is the one that decides.
publishArgs.push('--access', 'public')
if (tag != null) publishArgs.push('--tag', tag)
if (dryRun) publishArgs.push('--dry-run')
console.log(`\n$ npm ${publishArgs.join(' ')}\n`)
run('npm', publishArgs, stage)

if (dryRun) {
  console.log('\nDry run: nothing was published.')
} else {
  console.log(
    `\nPublished ${manifest.name as string}@${manifest.version as string}.`
  )
}
