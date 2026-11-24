/**
 * Builds the CLI's release: for each platform a tarball that installs on a
 * machine with no Node.js, then `install.sh` and `SHA256SUMS` over them all.
 *
 * Each tarball holds three things under `edge-cli-<version>-<platform>/`:
 *
 *   - `node/`: the official Node.js runtime for that platform, npm included,
 *     checked against the release's SHASUMS256.txt from nodejs.org;
 *   - `package/`: the package `npm run publish:cli -- --out <dir>` staged,
 *     with a `package-lock.json` resolved here;
 *   - `bin/edge-cli`: a launcher that runs the package with that runtime.
 *
 * The dependencies are not in the tarball. `install.sh` installs them on the
 * machine with the runtime's own npm, `npm ci` against the lockfile, so every
 * install of a release gets the dependency tree this build resolved, with
 * the native prebuilds for that machine. The Node signer is a native addon
 * for the machine that built it, so only that platform's tarball carries
 * it; the rest run without one, as an npm install without a signer does.
 *
 * `scripts/buildCliRelease.ts [--package build/cli-package] [--out build/cli-release]
 *   [--platform <platform>]… [--node-version <version>]`
 */
import { execFile } from 'child_process'
import { createHash } from 'crypto'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const run = promisify(execFile)

/** The platforms `install.sh` installs on, as Node.js names its builds. */
export const PLATFORMS = [
  'darwin-arm64',
  'darwin-x64',
  'linux-x64',
  'linux-arm64'
] as const
export type CliPlatform = (typeof PLATFORMS)[number]

/** The signer's file in the staged package, from `src/cli/npmMeta.ts`. */
const SIGNER = 'edge_api_signer.node'

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

export const cliTarballName = (
  version: string,
  platform: CliPlatform
): string => `edge-cli-${version}-${platform}.tar.gz`

/**
 * The launcher every tarball carries. It runs the CLI with the runtime
 * beside it, through a symlink too, so the engine the CLI spawns
 * (`process.execPath`) is that runtime as well.
 */
export const LAUNCHER = `#!/bin/sh
# Runs the Edge CLI with the Node.js runtime that ships beside it.
dir=$(CDPATH= cd -- "$(dirname -- "$(readlink -f -- "$0" 2>/dev/null || echo "$0")")/.." && pwd)
exec "$dir/node/bin/node" "$dir/package/edgeCli.js" "$@"
`

export interface CliReleaseOptions {
  /** The package `publish:cli --out` staged. */
  packageDir: string
  out: string
  platforms?: readonly CliPlatform[]
  /** The Node.js each tarball carries; the builder's own by default. */
  nodeVersion?: string
  /** nodejs.org/dist, or a mirror. */
  nodeSource?: string
  /** The platform the staged signer was built for: this machine's by default. */
  signerPlatform?: string
  /** `install.sh`'s source: scripts/installCli.sh by default. */
  installer?: string
  /** Writes `package-lock.json` into a package directory. */
  lock?: (dir: string) => Promise<void>
  /** A URL's bytes. */
  download?: (url: string) => Promise<Buffer>
  log?: (text: string) => void
}

export const sha256 = (bytes: Buffer): string =>
  createHash('sha256').update(bytes).digest('hex')

/** The digest SHASUMS256.txt gives a file, or an error naming what is missing. */
export function digestOf(sums: string, file: string): string {
  for (const line of sums.split('\n')) {
    const [digest, name] = line.trim().split(/\s+/)
    if (name === file && /^[0-9a-f]{64}$/.test(digest ?? '')) return digest
  }
  throw new Error(`SHASUMS256.txt lists no ${file}`)
}

/** A URL's bytes, with two retries for a dropped connection. */
async function fetchBytes(url: string): Promise<Buffer> {
  let last: unknown
  for (let attempt = 0; attempt < 3; ++attempt) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
      return Buffer.from(await response.arrayBuffer())
    } catch (error: unknown) {
      last = error
    }
  }
  throw last
}

/**
 * The package's lockfile, resolved from the registry as `npm ci` will read
 * it. Peers are resolved too, as a lockfile records them, and installs then
 * leave them out with `--omit=peer`.
 */
async function npmLock(dir: string): Promise<void> {
  await run(
    'npm',
    [
      'install',
      '--package-lock-only',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund'
    ],
    { cwd: dir, maxBuffer: 64 * 1024 * 1024 }
  )
}

/** Builds the release into `options.out` and returns its files. */
export async function buildCliRelease(
  options: CliReleaseOptions
): Promise<string[]> {
  const log = options.log ?? (() => {})
  const download = options.download ?? fetchBytes
  const nodeVersion = options.nodeVersion ?? process.versions.node
  const nodeSource = options.nodeSource ?? 'https://nodejs.org/dist'
  const signerPlatform =
    options.signerPlatform ?? `${process.platform}-${process.arch}`
  const installer = options.installer ?? path.join(__dirname, 'installCli.sh')

  const { version } = JSON.parse(
    fs.readFileSync(path.join(options.packageDir, 'package.json'), 'utf8')
  ) as { version: string }
  if (!SEMVER.test(version)) {
    throw new Error(`The staged package's version ${version} is not semver`)
  }

  fs.mkdirSync(options.out, { recursive: true })
  const work = path.join(options.out, '.work')
  fs.rmSync(work, { recursive: true, force: true })
  fs.mkdirSync(work, { recursive: true })

  try {
    // The package and its lockfile, once for every platform.
    const staged = path.join(work, 'package')
    fs.cpSync(options.packageDir, staged, { recursive: true })
    log('Resolving the dependency tree into package-lock.json\n')
    await (options.lock ?? npmLock)(staged)
    if (!fs.existsSync(path.join(staged, 'package-lock.json'))) {
      throw new Error('No package-lock.json was written for the package')
    }

    const runtimes = `${nodeSource}/v${nodeVersion}`
    const sums = (await download(`${runtimes}/SHASUMS256.txt`)).toString('utf8')
    const files: string[] = []
    for (const platform of options.platforms ?? PLATFORMS) {
      const top = `edge-cli-${version}-${platform}`
      const root = path.join(work, platform, top)
      fs.mkdirSync(root, { recursive: true })

      const runtime = `node-v${nodeVersion}-${platform}.tar.gz`
      const expected = digestOf(sums, runtime)
      log(`Fetching ${runtime}\n`)
      const bytes = await download(`${runtimes}/${runtime}`)
      if (sha256(bytes) !== expected) {
        throw new Error(`${runtime} does not match SHASUMS256.txt`)
      }
      const archive = path.join(work, runtime)
      fs.writeFileSync(archive, bytes)
      const node = path.join(root, 'node')
      fs.mkdirSync(node)
      await run('tar', ['-xzf', archive, '-C', node, '--strip-components', '1'])
      // npm stays: install.sh installs the dependencies with it. The headers
      // and manuals do not, since no dependency is compiled on install.
      for (const extra of ['include', 'share', 'CHANGELOG.md', 'README.md']) {
        fs.rmSync(path.join(node, extra), { recursive: true, force: true })
      }

      fs.cpSync(staged, path.join(root, 'package'), { recursive: true })
      if (platform !== signerPlatform) {
        fs.rmSync(path.join(root, 'package', SIGNER), { force: true })
      }
      fs.mkdirSync(path.join(root, 'bin'))
      fs.writeFileSync(path.join(root, 'bin', 'edge-cli'), LAUNCHER, {
        mode: 0o755
      })

      const tarball = path.join(options.out, cliTarballName(version, platform))
      // No extended attributes, and on macOS no AppleDouble `._` files,
      // which Linux would unpack as real files beside each one.
      await run(
        'tar',
        ['--no-xattrs', '-czf', tarball, '-C', path.join(work, platform), top],
        { env: { ...process.env, COPYFILE_DISABLE: '1' } }
      )
      files.push(tarball)
      log(`Built ${path.basename(tarball)}\n`)
    }

    const script = path.join(options.out, 'install.sh')
    fs.copyFileSync(installer, script)
    fs.chmodSync(script, 0o755)
    files.push(script)

    const lines = files.map(
      file => `${sha256(fs.readFileSync(file))}  ${path.basename(file)}`
    )
    const sumsFile = path.join(options.out, 'SHA256SUMS')
    fs.writeFileSync(sumsFile, lines.join('\n') + '\n')
    return [...files, sumsFile]
  } finally {
    fs.rmSync(work, { recursive: true, force: true })
  }
}

async function main(argv: string[]): Promise<number> {
  const value = (flag: string): string | undefined => {
    const i = argv.indexOf(flag)
    return i < 0 ? undefined : argv[i + 1]
  }
  const platforms = argv.flatMap((arg, i) =>
    arg === '--platform' ? [argv[i + 1]] : []
  )
  for (const platform of platforms) {
    if (!(PLATFORMS as readonly string[]).includes(platform)) {
      console.error(
        `Unknown platform ${platform}: one of ${PLATFORMS.join(', ')}`
      )
      return 2
    }
  }
  const files = await buildCliRelease({
    packageDir: path.resolve(value('--package') ?? 'build/cli-package'),
    out: path.resolve(value('--out') ?? 'build/cli-release'),
    ...(platforms.length > 0 ? { platforms: platforms as CliPlatform[] } : {}),
    ...(value('--node-version') != null
      ? { nodeVersion: value('--node-version') }
      : {}),
    log: text => process.stdout.write(text)
  })
  for (const file of files) {
    const { size } = fs.statSync(file)
    console.log(
      `${(size / 1024 / 1024).toFixed(1).padStart(7)} MB  ${path.relative(
        process.cwd(),
        file
      )}`
    )
  }
  return 0
}

if (require.main === module) {
  main(process.argv.slice(2)).then(
    code => {
      process.exitCode = code
    },
    (error: unknown) => {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    }
  )
}
