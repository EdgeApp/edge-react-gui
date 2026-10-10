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

import {
  CLI_PACKAGE_FILES,
  CLI_PACKAGE_META,
  CLI_SIGNER_FILE
} from '../src/cli/npmMeta'
import {
  type HeadState,
  headStateOf,
  isSignedPublish,
  packedFilesFor,
  parsePublishFlags,
  preBuildRefusal,
  stagedManifestRefusal,
  type TreeState,
  treeStateOf
} from './util/publishArgs'

const {
  KNOWN_MISSING,
  KNOWN_UNLOADABLE
} = require('./util/knownPluginBreakage')

const ROOT = path.resolve(__dirname, '..')
const MANIFEST = path.join(ROOT, 'src/cli/generated/npmPackage.json')
// From `npmMeta.ts`, which is where the decision lives. A second spelling
// here is what let the manifest and the staging directory disagree.
const SIGNER = CLI_SIGNER_FILE

const argv = process.argv.slice(2)

/**
 * Every flag, read by the module that owns the rules.
 *
 * The parsing, the `files` allowlist and the three refusals live in
 * `scripts/util/publishArgs.ts` so that they can be imported and run by a
 * test: this script does its work at module scope, so the only thing a test
 * could reach before was its source text, and a regex over source passes
 * for a reformat that breaks the logic. `--with-signer` is off by default
 * and refused without `--signer-secret-is-cli-only`, because the addon's
 * shards reconstruct the same `apiSecret` the mobile release builds use and
 * the runtime pad is a constant in this public repository — see the note in
 * `src/cli/npmMeta.ts`.
 */
const flags = parsePublishFlags(argv)
// Only the ones this shell still reads for itself; the rest are the
// refusals' business, and `flags` is passed to them whole.
const { dryRun, skipBuild, stageOnly, tag, withSigner } = flags

function run(command: string, args: string[], cwd = ROOT): void {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed (${result.status})`)
  }
}

/**
 * Ask git about the working tree, and say so when it could not be asked.
 *
 * The `capture` helper this replaces returned `''` for a child that exited
 * non-zero or failed to spawn, so `=== ''` read every git failure as a clean
 * tree — the dirty-tree refusal, on the one action this file says cannot be
 * undone, failed open. `treeStateOf` is the mapping, where a test runs it.
 */
function readTreeState(): TreeState {
  return treeStateOf(
    spawnSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' })
  )
}

/** HEAD, and whether a remote branch has it, for the pinned README links. */
function readHeadState(): HeadState {
  return headStateOf(
    spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }),
    spawnSync('git', ['branch', '-r', '--contains', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8'
    })
  )
}

// ------------------------------------------------------------ preconditions

// A publish from a dirty tree cannot be reproduced from any commit, and the
// one artifact nobody can re-derive later is the one in the registry. The
// three refusals before anything is built live in `publishArgs.ts`, where a
// test can run them: each one is irreversible once npm has the tarball.
const treeState = readTreeState()
const hasKey = fs.existsSync(path.join(ROOT, 'edgeKey.json'))
// Only what this phase actually judges: the tree, the key, and the flags.
// The allowlist check belongs to the manifest and is made below.
const headState = readHeadState()
const earlyRefusal = preBuildRefusal({
  flags,
  treeState,
  headState,
  hasKey,
  knownBrokenPlugins: [...KNOWN_MISSING, ...KNOWN_UNLOADABLE]
})
if (earlyRefusal != null) throw new Error(earlyRefusal)

if (!skipBuild) {
  if (hasKey) {
    run('npm', ['run', 'build:cli:all'])
  } else {
    console.warn(
      '! edgeKey.json absent: building without the native signer. The ' +
        'published CLI makes unsigned info-server requests, cannot read ' +
        'gated plugin keys, and needs an `edgeApiKey` of its own before it ' +
        'will start at all.'
    )
    run('npm', ['run', 'build:cli'])
  }
}

// After the build, not before it. The manifest is generated and committed, so
// a stale one would publish the wrong dependency list — and its one real
// check reads the *built* bundles for the packages they require. Run first,
// as it was, it inspected whatever `lib/` happened to hold: absent on a fresh
// clone, where the check silently skipped, or left over from an older build.
// `--require-bundles` makes an absent `lib/` a failure rather than a skip,
// which is only safe to demand here, after the build that creates it.
run('node', [
  '-r',
  'sucrase/register',
  'scripts/buildCliManifest.ts',
  '--check',
  '--require-bundles'
])

// ----------------------------------------------------------------- staging

// `files` in the generated manifest lists the unsigned set, and npm's
// `files` is an allowlist — so `--with-signer` has to add the addon to it,
// not merely copy the file into the stage. It did only the latter: a
// package.json with the unsigned four and an `edge_api_signer.node` beside
// the bundles packs the four and drops the addon, so the flag published a
// tarball that could not sign while the report said it had shipped.
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) as Record<
  string,
  unknown
>
manifest.files = packedFilesFor({
  withSigner,
  packageFiles: CLI_PACKAGE_FILES,
  signerFile: CLI_SIGNER_FILE
})
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
// Derived from the manifest's own `files`, so the staged directory and the
// allowlist npm packs by cannot name different sets. They did: this list
// was hand-written beside `CLI_PACKAGE_FILES` with the same four names, and
// `--with-signer` added the addon to this one only.
const STAGED_FROM: Record<string, string> = {
  'edgeCli.js': 'lib/edgeCli.js',
  'edgeEngine.js': 'lib/edgeEngine.js',
  LICENSE: 'LICENSE',
  // Written from `docs/EDGE_CLI.md` further down rather than copied.
  'README.md': '',
  [CLI_SIGNER_FILE]: `lib/${CLI_SIGNER_FILE}`
}
const files: Staged[] = (manifest.files as string[])
  .filter(to => STAGED_FROM[to] !== '')
  .map(to => ({
    from: STAGED_FROM[to],
    to,
    // The addon is the one entry whose absence is not fatal: `build:cli`
    // produces the bundles, `build:cli:native` the addon, and the
    // precondition above has already refused `--with-signer` without the
    // secret it needs.
    required: to !== CLI_SIGNER_FILE
  }))

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

// From the manifest the tarball will carry, not from a file's presence in
// a directory `--out` may have left behind: a reused stage with a stale
// addon made this true with no `--with-signer` at all, which suppressed
// the README's unsigned warning — the one paragraph that explains why the
// installed CLI refuses to start without an `edgeApiKey`.
const packedFiles = manifest.files as string[]
const signed = isSignedPublish({
  packedFiles,
  signerFile: SIGNER,
  signerStaged: fs.existsSync(path.join(stage, SIGNER))
})

// `docs/EDGE_CLI.md` is the CLI's documentation, so it is the README rather
// than a second description written to drift from it. The header is the part
// that only makes sense once the thing has a package name.
// `--omit=peer`, in the generated half as well as in the guide below it.
// `edge-currency-accountbased` declares four React Native modules as
// non-optional peers, so a plain `npm install -g` pulls React Native into a
// command-line tool — and the first code block on a registry page is the one
// a reader copies. The precondition below refuses a header that disagrees
// with the guide about this. `npx` resolves the same peers, so it takes the
// flag too — before the package name, which is where npm reads its own
// options rather than passing them to the command.
const INSTALL_FLAGS = '--omit=peer'
const header = [
  `# ${CLI_PACKAGE_META.name}`,
  '',
  CLI_PACKAGE_META.description,
  '',
  '```sh',
  `npm install -g ${CLI_PACKAGE_META.name} ${INSTALL_FLAGS}`,
  `${CLI_PACKAGE_META.binName} --help`,
  '```',
  '',
  'Commands are listed by `' +
    CLI_PACKAGE_META.binName +
    ' help`, and `' +
    CLI_PACKAGE_META.binName +
    ' help <command>` explains one: that is the installed reference. ' +
    'The HTML reference the guide below links to is a generated file, and ' +
    'GitHub shows it as source.',
  '',
  'Or without installing:',
  '',
  '```sh',
  `npx --omit=peer ${CLI_PACKAGE_META.name} --help`,
  '```',
  '',
  signed
    ? ''
    : 'This build carries no native HMAC signer, so it makes unsigned ' +
      'info-server requests and cannot read gated plugin keys. It needs an ' +
      '`edgeApiKey` of its own — in `./keys.json`, in ' +
      '`~/.edge-cli/keys.json`, or passed with `-k` — or the engine refuses ' +
      'to start. `--fake` needs none.\n',
  '---',
  ''
].join('\n')
/**
 * The guide, with its links rewritten for a registry page.
 *
 * npm resolves a README's relative links against `repository.url` plus
 * `repository.directory`, which is `src/cli` — so `](./api/dist/index.html)`
 * pointed at `tree/HEAD/src/cli/api/dist/index.html`, which does not exist,
 * and the installed package ships none of those files either. The first of
 * them is the document's own pointer at the generated reference.
 *
 * Pinned to the commit being published, not to `master`: the docs are not
 * on `master` until a release reaches it, and afterwards `master` is a
 * different version from the one installed. The tree is clean (or the
 * operator said otherwise), so HEAD is what the tarball was built from; and
 * `preBuildRefusal` stopped before the build unless HEAD is on a remote
 * branch, because GitHub serves `blob/<sha>` only for a commit it has.
 */
if (headState.kind === 'unknown') throw new Error(headState.reason)
const GITHUB_DOCS = `https://github.com/EdgeApp/edge-react-gui/blob/${headState.sha}/docs/`
const guide = fs
  .readFileSync(path.join(ROOT, 'docs/EDGE_CLI.md'), 'utf8')
  .replace(/\]\(\.\//g, `](${GITHUB_DOCS}`)

// Two preconditions over the text about to be staged, beside the dirty-tree
// and unsigned-build checks above.
//
// The links, because the rewrite above is one pass over prose and a new link
// spelled `](../x)` or `](docs/x)` would slip past it.
const leftoverLinks = [...guide.matchAll(/\]\((\.\.?\/|docs\/)[^)]*\)/g)]
if (leftoverLinks.length > 0) {
  throw new Error(
    'The staged README still has repository-relative links, which are dead ' +
      `on the registry page: ${leftoverLinks
        .map(m => m[0])
        .join(', ')}. Make them absolute in docs/EDGE_CLI.md.`
  )
}

// And the claim, because the README is the registry page: it used to say
// "Published (npm): not yet … there is nothing for `npx` to fetch", nine
// lines under a header telling the reader to `npm install -g` it.
const DENIALS = [
  'not yet',
  'Until a package is published',
  'it is not an npm package name'
]
// The install line the header writes has to be the one the guide endorses.
// 2.review-repo.4's `--omit=peer` landed on the appended half only, so the
// registry page's first code block was the one the document then called
// wrong.
const guideInstall = `npm install -g ${CLI_PACKAGE_META.name} ${INSTALL_FLAGS}`
if (!guide.includes(guideInstall)) {
  throw new Error(
    `The guide does not contain the install line the header writes ` +
      `("${guideInstall}"), so the staged README would contradict itself ` +
      'about installing. Make docs/EDGE_CLI.md and INSTALL_FLAGS agree.'
  )
}

const denial = DENIALS.find(text => guide.includes(text))
if (denial != null) {
  throw new Error(
    `The staged README says the package is not published ("${denial}"), ` +
      'which is the first thing a registry reader is there to find out. ' +
      'Fix docs/EDGE_CLI.md.'
  )
}

fs.writeFileSync(path.join(stage, 'README.md'), header + guide)

// Last check before the stage is final: `--with-signer` is the publish path
// the CLI is meant to use once it has a key pair of its own, and the way it
// failed was silent — the addon in the directory, absent from the tarball,
// and the report saying "included". `files` is npm's allowlist, so this is
// the one assertion that distinguishes the two.
const stageRefusal = stagedManifestRefusal({
  flags,
  packedFiles: manifest.files as string[],
  signerFile: CLI_SIGNER_FILE
})
if (stageRefusal != null) throw new Error(stageRefusal)

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
