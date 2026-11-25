import { afterEach, describe, expect, it } from '@jest/globals'
import { execFile, execFileSync } from 'child_process'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'
import { promisify } from 'util'

import {
  buildCliRelease,
  type CliPlatform,
  cliTarballName,
  hostPlatform,
  PLATFORMS,
  sha256
} from '../../../scripts/buildCliRelease'

const run = promisify(execFile)

const ROOT = path.resolve(__dirname, '../../..')
const INSTALLER = path.join(ROOT, 'scripts/installCli.sh')
const NODE = '9.9.9'
const SOURCE = 'https://nodejs.example/dist'

/**
 * A stand-in Node.js. As npm's ci it records its arguments beside the
 * install and makes the package's node_modules; as the CLI it echoes its
 * arguments, so a test sees which file the launcher ran.
 */
const FAKE_NODE = `#!/bin/sh
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
case "$1" in
  */npm-cli.js)
    shift
    echo "$@" > "$here/../../npm-args"
    while [ $# -gt 0 ]; do
      if [ "$1" = --prefix ]; then mkdir -p "$2/node_modules"; fi
      shift
    done ;;
  */edgeCli.js)
    shift
    echo "cli $*" ;;
esac
`

const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0))
    fs.rmSync(dir, { recursive: true, force: true })
})
const tempDir = (): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-release-'))
  dirs.push(dir)
  return dir
}

/** nodejs.org/dist for `NODE`, as files, with its SHASUMS256.txt. */
function fakeNodeSource(dir: string): Map<string, Buffer> {
  const files = new Map<string, Buffer>()
  const sums: string[] = []
  for (const platform of PLATFORMS) {
    const top = `node-v${NODE}-${platform}`
    const tree = path.join(dir, 'trees', top)
    fs.mkdirSync(path.join(tree, 'bin'), { recursive: true })
    fs.writeFileSync(path.join(tree, 'bin/node'), FAKE_NODE, { mode: 0o755 })
    fs.mkdirSync(path.join(tree, 'lib/node_modules/npm/bin'), {
      recursive: true
    })
    fs.writeFileSync(path.join(tree, 'lib/node_modules/npm/bin/npm-cli.js'), '')
    fs.mkdirSync(path.join(tree, 'include/node'), { recursive: true })
    fs.writeFileSync(path.join(tree, 'include/node/node.h'), '')
    fs.mkdirSync(path.join(tree, 'share/doc'), { recursive: true })
    fs.writeFileSync(path.join(tree, 'README.md'), '')
    fs.writeFileSync(path.join(tree, 'LICENSE'), 'MIT')
    const archive = path.join(dir, `${top}.tar.gz`)
    execFileSync('tar', ['-czf', archive, '-C', path.join(dir, 'trees'), top])
    const bytes = fs.readFileSync(archive)
    files.set(`${SOURCE}/v${NODE}/${top}.tar.gz`, bytes)
    sums.push(`${sha256(bytes)}  ${top}.tar.gz`)
  }
  files.set(`${SOURCE}/v${NODE}/SHASUMS256.txt`, Buffer.from(sums.join('\n')))
  return files
}

/** A package as `publish:cli --out` stages it. */
function stagedPackage(dir: string, version = '1.2.3'): string {
  const pkg = path.join(dir, 'staged')
  fs.mkdirSync(pkg, { recursive: true })
  fs.writeFileSync(
    path.join(pkg, 'package.json'),
    JSON.stringify({
      name: '@edgeapp/cli',
      version,
      bin: { 'edge-cli': 'edgeCli.js' }
    })
  )
  fs.writeFileSync(path.join(pkg, 'edgeCli.js'), '// the client')
  fs.writeFileSync(path.join(pkg, 'edgeEngine.js'), '// the engine')
  fs.writeFileSync(path.join(pkg, 'edge_api_signer.node'), 'darwin-arm64 addon')
  return pkg
}

async function build(
  dir: string,
  options: {
    platforms?: CliPlatform[]
    files?: Map<string, Buffer>
    version?: string
  } = {}
): Promise<{ out: string; files: string[] }> {
  const source = options.files ?? fakeNodeSource(dir)
  const out = path.join(dir, 'release')
  const files = await buildCliRelease({
    packageDir: stagedPackage(dir, options.version),
    out,
    platforms: options.platforms ?? ['darwin-arm64', 'linux-x64'],
    nodeVersion: NODE,
    nodeSource: SOURCE,
    signerPlatform: 'darwin-arm64',
    lock: async pkg => {
      fs.writeFileSync(
        path.join(pkg, 'package-lock.json'),
        '{"lockfileVersion":3}'
      )
    },
    download: async url => {
      const bytes = source.get(url)
      if (bytes == null) throw new Error(`404 ${url}`)
      return bytes
    }
  })
  return { out, files }
}

const entries = async (tarball: string): Promise<string[]> =>
  (await run('tar', ['-tzf', tarball])).stdout
    .split('\n')
    .filter(line => line !== '')
    .map(line => line.replace(/\/$/, ''))

/** This machine's platform, as the installer and Node.js name it. */
const here = `${process.platform}-${process.arch}`
const installable = (PLATFORMS as readonly string[]).includes(here)
const itInstalls = installable ? it : it.skip

async function install(
  args: string[],
  env: Record<string, string>
): Promise<{ code: number; out: string }> {
  try {
    const { stdout, stderr } = await run('bash', [INSTALLER, ...args], {
      env: { NODE_ENV: 'test', PATH: '/usr/bin:/bin:/usr/sbin:/sbin', ...env }
    })
    return { code: 0, out: stdout + stderr }
  } catch (error: any) {
    return {
      code: error.code ?? -1,
      out: `${error.stdout ?? ''}${error.stderr ?? ''}`
    }
  }
}

describe('buildCliRelease', () => {
  it('builds a tarball per platform: the runtime with npm, the package and a launcher', async () => {
    const dir = tempDir()
    const { out, files } = await build(dir)
    expect(files.map(file => path.basename(file))).toEqual([
      'edge-cli-1.2.3-darwin-arm64.tar.gz',
      'edge-cli-1.2.3-linux-x64.tar.gz',
      'install.sh',
      'SHA256SUMS'
    ])
    expect(fs.readdirSync(out).sort()).toEqual([
      'SHA256SUMS',
      'edge-cli-1.2.3-darwin-arm64.tar.gz',
      'edge-cli-1.2.3-linux-x64.tar.gz',
      'install.sh'
    ])
    for (const platform of ['darwin-arm64', 'linux-x64'] as const) {
      const top = `edge-cli-1.2.3-${platform}`
      const listed = await entries(
        path.join(out, cliTarballName('1.2.3', platform))
      )
      expect(
        listed.every(entry => entry === top || entry.startsWith(`${top}/`))
      ).toBe(true)
      expect(listed).toEqual(
        expect.arrayContaining([
          `${top}/bin/edge-cli`,
          `${top}/node/bin/node`,
          `${top}/node/lib/node_modules/npm/bin/npm-cli.js`,
          `${top}/node/LICENSE`,
          `${top}/package/package.json`,
          `${top}/package/package-lock.json`,
          `${top}/package/edgeCli.js`,
          `${top}/package/edgeEngine.js`
        ])
      )
      // Headers and manuals stay out; nothing is compiled on install.
      for (const gone of ['include', 'share', 'README.md'])
        expect(
          listed.some(entry => entry.startsWith(`${top}/node/${gone}`))
        ).toBe(false)
      // The signer is built for one platform, and only its tarball has it.
      expect(listed.includes(`${top}/package/edge_api_signer.node`)).toBe(
        platform === 'darwin-arm64'
      )
    }
    expect(fs.readFileSync(path.join(out, 'install.sh'), 'utf8')).toBe(
      fs.readFileSync(INSTALLER, 'utf8')
    )
    expect(fs.statSync(path.join(out, 'install.sh')).mode & 0o111).not.toBe(0)
    // No work directory is left beside the release.
    expect(fs.existsSync(path.join(out, '.work'))).toBe(false)
  })

  it('lists every file in SHA256SUMS with its digest', async () => {
    const dir = tempDir()
    const { out } = await build(dir)
    const lines = fs
      .readFileSync(path.join(out, 'SHA256SUMS'), 'utf8')
      .trim()
      .split('\n')
    expect(lines).toHaveLength(3)
    for (const line of lines) {
      const [digest, name] = line.split('  ')
      expect(sha256(fs.readFileSync(path.join(out, name)))).toBe(digest)
    }
  })

  it('runs the CLI with the runtime beside it, through a symlink too', async () => {
    const dir = tempDir()
    const { out } = await build(dir, { platforms: ['linux-x64'] })
    const unpacked = path.join(dir, 'unpacked')
    fs.mkdirSync(unpacked)
    await run('tar', [
      '-xzf',
      path.join(out, 'edge-cli-1.2.3-linux-x64.tar.gz'),
      '-C',
      unpacked
    ])
    const launcher = path.join(
      unpacked,
      'edge-cli-1.2.3-linux-x64/bin/edge-cli'
    )
    expect(fs.statSync(launcher).mode & 0o111).not.toBe(0)
    const link = path.join(dir, 'edge-cli')
    fs.symlinkSync(launcher, link)
    for (const file of [launcher, link])
      expect((await run(file, ['--version'])).stdout).toBe('cli --version\n')
  })

  it('refuses a runtime that does not match its published digest', async () => {
    const dir = tempDir()
    const files = fakeNodeSource(dir)
    files.set(
      `${SOURCE}/v${NODE}/node-v${NODE}-linux-x64.tar.gz`,
      Buffer.from('tampered')
    )
    await expect(
      build(dir, { files, platforms: ['linux-x64'] })
    ).rejects.toThrow(
      `node-v${NODE}-linux-x64.tar.gz does not match SHASUMS256.txt`
    )
  })

  it('refuses a platform the Node.js release does not publish', async () => {
    const dir = tempDir()
    const files = fakeNodeSource(dir)
    files.set(`${SOURCE}/v${NODE}/SHASUMS256.txt`, Buffer.from(''))
    await expect(
      build(dir, { files, platforms: ['linux-arm64'] })
    ).rejects.toThrow(
      `SHASUMS256.txt lists no node-v${NODE}-linux-arm64.tar.gz`
    )
  })

  it('builds this machine’s platform when it is given none', () => {
    if (installable) expect(hostPlatform()).toBe(here)
    else
      expect(() => hostPlatform()).toThrow(
        `No CLI release is built for ${here}`
      )
  })

  it('refuses a package whose version is not semver', async () => {
    const dir = tempDir()
    await expect(build(dir, { version: 'next' })).rejects.toThrow(
      'is not semver'
    )
  })
})

describe('installCli.sh', () => {
  /** A release for this machine, and a place to install it. */
  async function setUp(): Promise<{
    dir: string
    release: string
    env: Record<string, string>
    prefix: string
    bindir: string
  }> {
    const dir = tempDir()
    const { out } = await build(dir, { platforms: [here as CliPlatform] })
    const prefix = path.join(dir, 'app')
    const bindir = path.join(dir, 'bin')
    return {
      dir,
      release: out,
      prefix,
      bindir,
      env: {
        HOME: path.join(dir, 'home'),
        TMPDIR: dir,
        EDGE_CLI_PREFIX: prefix,
        EDGE_CLI_BINDIR: bindir,
        // Never a real token, even to a local server.
        GITHUB_TOKEN: 'test-token'
      }
    }
  }

  itInstalls(
    'installs a release, installs its dependencies with its own npm, and links edge-cli',
    async () => {
      const { release, env, prefix, bindir } = await setUp()
      const result = await install(['--user'], {
        ...env,
        EDGE_CLI_RELEASE_DIR: release
      })
      expect(result.out).toContain('Installed the Edge CLI 1.2.3')
      expect(result.code).toBe(0)

      expect(fs.readlinkSync(path.join(prefix, 'current'))).toBe('1.2.3')
      expect(fs.readlinkSync(path.join(bindir, 'edge-cli'))).toBe(
        path.join(prefix, 'current/bin/edge-cli')
      )
      const dest = path.join(prefix, '1.2.3')
      const tarball = fs.readFileSync(
        path.join(release, cliTarballName('1.2.3', here as CliPlatform))
      )
      expect(
        fs.readFileSync(path.join(dest, '.installed'), 'utf8').trim()
      ).toBe(sha256(tarball))
      expect(fs.readFileSync(path.join(dest, 'npm-args'), 'utf8').trim()).toBe(
        [
          'ci',
          '--prefix',
          `${dest}.partial/package`,
          '--cache',
          `${dest}.partial/.npm-cache`,
          '--omit=dev',
          '--omit=peer',
          '--ignore-scripts',
          '--no-audit',
          '--no-fund',
          '--loglevel=error'
        ].join(' ')
      )
      expect(fs.existsSync(path.join(dest, 'package/node_modules'))).toBe(true)
      expect(fs.existsSync(path.join(dest, '.npm-cache'))).toBe(false)
      expect(fs.existsSync(`${dest}.partial`)).toBe(false)
      expect(
        (await run(path.join(bindir, 'edge-cli'), ['--version'])).stdout
      ).toBe('cli --version\n')

      // The same release again changes nothing.
      const again = await install(['--user'], {
        ...env,
        EDGE_CLI_RELEASE_DIR: release
      })
      expect(again.code).toBe(0)
      expect(again.out).toContain('The Edge CLI 1.2.3 is already installed')

      // Uninstalling removes the program; the CLI's data directory is not its.
      const removed = await install(['--user', 'uninstall'], env)
      expect(removed.code).toBe(0)
      expect(fs.existsSync(prefix)).toBe(false)
      expect(fs.existsSync(path.join(bindir, 'edge-cli'))).toBe(false)
    }
  )

  itInstalls(
    'refuses a tarball whose digest is not the release’s',
    async () => {
      const { release, env, prefix } = await setUp()
      const sums = path.join(release, 'SHA256SUMS')
      fs.writeFileSync(
        sums,
        fs.readFileSync(sums, 'utf8').replace(/^[0-9a-f]{64}/, '0'.repeat(64))
      )
      const result = await install(['--user'], {
        ...env,
        EDGE_CLI_RELEASE_DIR: release
      })
      expect(result.code).not.toBe(0)
      expect(result.out).toContain('checksum mismatch')
      expect(fs.existsSync(path.join(prefix, 'current'))).toBe(false)
    }
  )

  itInstalls(
    'refuses a release that is not the version asked for',
    async () => {
      const { release, env } = await setUp()
      const result = await install(['--user', '--version', '9.9.9'], {
        ...env,
        EDGE_CLI_RELEASE_DIR: release
      })
      expect(result.code).not.toBe(0)
      expect(result.out).toContain('asked for 9.9.9 but the release is 1.2.3')
    }
  )

  itInstalls(
    'installs the newest cli-v release among the app’s releases on GitHub',
    async () => {
      const { release, env, prefix } = await setUp()
      const files = fs.readdirSync(release)
      const seen: string[] = []
      const server = http.createServer((req, res) => {
        seen.push(`${req.url} ${req.headers.authorization ?? ''}`)
        const base = `http://127.0.0.1:${
          (server.address() as any).port
        }/repos/EdgeApp/edge-react-gui`
        const json = (body: unknown): void => {
          res.setHeader('Content-Type', 'application/json')
          // Pretty-printed, as GitHub answers.
          res.end(JSON.stringify(body, null, 2))
        }
        if (req.url === '/repos/EdgeApp/edge-react-gui/releases?per_page=100') {
          json(
            ['v4.54.0', 'cli-v1.2.3', 'cli-v1.2.2', 'v4.53.0'].map(
              (tag, id) => ({
                id,
                tag_name: tag,
                draft: false
              })
            )
          )
          return
        }
        if (
          req.url === '/repos/EdgeApp/edge-react-gui/releases/tags/cli-v1.2.3'
        ) {
          json({
            url: `${base}/releases/1`,
            tag_name: 'cli-v1.2.3',
            assets: files.map((name, id) => ({
              url: `${base}/releases/assets/${id + 10}`,
              id: id + 10,
              name,
              uploader: { login: 'mason' }
            }))
          })
          return
        }
        const asset = /\/releases\/assets\/(\d+)$/.exec(req.url ?? '')
        if (
          asset != null &&
          req.headers.accept === 'application/octet-stream'
        ) {
          res.end(
            fs.readFileSync(path.join(release, files[Number(asset[1]) - 10]))
          )
          return
        }
        res.statusCode = 404
        res.end('{}')
      })
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
      try {
        const port = (server.address() as any).port
        const result = await install(['--user'], {
          ...env,
          EDGE_CLI_GITHUB_API: `http://127.0.0.1:${port}`
        })
        expect(result.out).toContain('Installed the Edge CLI 1.2.3')
        expect(result.code).toBe(0)
      } finally {
        server.close()
      }
      expect(fs.readlinkSync(path.join(prefix, 'current'))).toBe('1.2.3')
      expect(seen[0]).toBe(
        '/repos/EdgeApp/edge-react-gui/releases?per_page=100 Bearer test-token'
      )
      expect(seen[1]).toBe(
        '/repos/EdgeApp/edge-react-gui/releases/tags/cli-v1.2.3 Bearer test-token'
      )
      expect(
        seen.slice(2).every(line => line.includes('/releases/assets/'))
      ).toBe(true)
    }
  )
})
