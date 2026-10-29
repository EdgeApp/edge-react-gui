import { afterEach, describe, expect, it } from '@jest/globals'
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

import {
  buildAndroid,
  buildIos,
  configsFor,
  secretDirectory,
  setAndroidVersion,
  setup,
  versionSuffix,
  writeSecrets
} from './Masonfile'
import { stampGradle } from './scripts/updateVersion'

type Call = [string, ...unknown[]]

/** The temporary checkouts the tests made, removed after each test. */
const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true })
})

/** A checkout with package.json and build.gradle, and a recording `Stage` on it. */
function recordStage(branch: string): {
  calls: Call[]
  ctx: any
  root: string
} {
  const root = mkdtempSync(join(tmpdir(), 'masonfile-'))
  roots.push(root)
  mkdirSync(join(root, 'android/app'), { recursive: true })
  // The repository's own build.gradle, so the stamping follows its real lines.
  copyFileSync(
    join(__dirname, 'android/app/build.gradle'),
    join(root, 'android/app/build.gradle')
  )
  writeFileSync(join(root, 'package.json'), '{"version":"4.53.0"}')
  const calls: Call[] = []
  const ctx = {
    workspace: root,
    run: { branch },
    sh: async (...args: unknown[]) => calls.push(['sh', ...args]),
    exec: async (...args: unknown[]) => calls.push(['exec', ...args]),
    publish: async (...args: unknown[]) => calls.push(['publish', ...args]),
    writeSecretFile: async (...args: unknown[]) =>
      calls.push(['writeSecretFile', ...args]),
    getBuildNumber: (key: string) => {
      calls.push(['getBuildNumber', key])
      return '26103001'
    },
    artifacts: {
      save: async (...args: unknown[]) => calls.push(['save', ...args])
    },
    fs: {
      read: async (path: string) => readFileSync(join(root, path), 'utf8')
    }
  }
  return { calls, ctx, root }
}

const commands = (calls: Call[]): unknown[] =>
  calls.filter(([kind]) => kind === 'sh').map(call => call[1])

describe('Masonfile', () => {
  it('builds each platform side by side with its configs and secrets', () => {
    for (const branch of ['develop', 'beta', 'master', 'feature/x']) {
      const calls: unknown[][] = []
      const m = {
        branch,
        apiVersion: (...args: unknown[]) => calls.push(['apiVersion', ...args]),
        buildNumber: (...args: unknown[]) =>
          calls.push(['buildNumber', ...args]),
        parallel: (...args: unknown[]) => calls.push(['parallel', ...args])
      }
      setup(m as any)
      expect(calls.map(call => call[0])).toEqual([
        'apiVersion',
        'buildNumber',
        'parallel'
      ])
      const [, group, stages, options] = calls[2] as [string, string, any, any]
      expect(group).toBe('build')
      expect(options).toEqual({ failFast: false })
      expect(stages.ios.configs).toEqual(configsFor(branch))
      expect(stages.ios.secrets).toContain('GoogleService-Info.plist')
      expect(stages.android.secrets).toContain('google-services.json')
      expect(stages.ios.buildNumbers).toEqual(['co.edgesecure.app'])
      expect(stages.android.buildNumbers).toEqual(['co.edgesecure.app'])
    }
  })

  it('stamps build.gradle and builds the release APKs', async () => {
    const { calls, ctx, root } = recordStage('develop')
    await buildAndroid(ctx)
    expect(commands(calls)).toEqual([
      'npm ci',
      'npm run prepare',
      './gradlew assembleRelease'
    ])
    const gradle = readFileSync(join(root, 'android/app/build.gradle'), 'utf8')
    expect(gradle).toContain('versionCode 26103001')
    expect(gradle).toContain('versionName "4.53.0-d"')
    // Only those lines change: the split APKs' offsets stay as they are.
    const original = readFileSync(
      join(__dirname, 'android/app/build.gradle'),
      'utf8'
    )
    expect(gradle.split('\n').length).toBe(original.split('\n').length)
    expect(gradle).toContain("['armeabi-v7a': 1, 'arm64-v8a': 2]")
    // The Firebase config ships in the app, so it is readable; the rest stay owner-only.
    expect(calls.filter(([kind]) => kind === 'writeSecretFile')).toEqual([
      ['writeSecretFile', 'config.json', '.', {}],
      ['writeSecretFile', 'edgeKey.json', '.', {}],
      ['writeSecretFile', 'keys.json', '.', {}],
      [
        'writeSecretFile',
        'google-services.json',
        'android/app',
        { mode: 0o644 }
      ]
    ])
    expect(calls.at(-1)).toEqual([
      'save',
      'android-apks',
      'android/app/build/outputs/apk/release/*.apk'
    ])
  })

  it('stamps the iOS version with agvtool and archives', async () => {
    const { calls, ctx } = recordStage('yolo')
    await buildIos(ctx)
    expect(calls.filter(([kind]) => kind === 'exec').slice(-2)).toEqual([
      [
        'exec',
        'agvtool',
        ['new-marketing-version', '4.53.0-yolo'],
        { cwd: 'ios' }
      ],
      ['exec', 'agvtool', ['new-version', '-all', '26103001'], { cwd: 'ios' }]
    ])
    expect(calls.filter(([kind]) => kind === 'writeSecretFile')).toEqual([
      ['writeSecretFile', 'config.json', '.', {}],
      ['writeSecretFile', 'edgeKey.json', '.', {}],
      ['writeSecretFile', 'keys.json', '.', {}],
      [
        'writeSecretFile',
        'GoogleService-Info.plist',
        'ios/edge',
        { mode: 0o644 }
      ]
    ])
    const sh = commands(calls)
    expect(sh.slice(-2)[0]).toBe('npm run prepare.ios')
    expect(sh.at(-1)).toMatch(/^xcodebuild archive /)
    expect(calls.at(-1)).toEqual([
      'save',
      'ios-archive',
      'build/edge.xcarchive/**'
    ])
  })

  it('refuses a build.gradle missing its version name or code', async () => {
    const { root } = recordStage('develop')
    writeFileSync(
      join(root, 'android/app/build.gradle'),
      'versionName "1.0.0"\n'
    )
    await expect(setAndroidVersion(root, '1.2.3', '7')).rejects.toThrow(
      'android/app/build.gradle has no /versionCode [0-9]+/g'
    )
    writeFileSync(join(root, 'android/app/build.gradle'), 'versionCode 1\n')
    await expect(setAndroidVersion(root, '1.2.3', '7')).rejects.toThrow(
      'android/app/build.gradle has no /versionName "[^"]*"/g'
    )
  })

  it('knows where every secret file goes, by its file name', () => {
    expect(
      [
        'config.json',
        'edgeKey.json',
        'keys.json',
        'deploy-config.json',
        'GoogleService-Info.plist',
        'google-services.json',
        'edge-release-keystore.jks',
        'airbitzbd-keystore.jks',
        'master/config.json',
        'fastlane.json'
      ].map(secretDirectory)
    ).toEqual([
      '.',
      '.',
      '.',
      '.',
      'ios/edge',
      'android/app',
      'keystores',
      'keystores',
      undefined,
      undefined
    ])
  })

  it('refuses a secret file with no directory', async () => {
    const { ctx } = recordStage('develop')
    await expect(writeSecrets(ctx, ['fastlane.json'])).rejects.toThrow(
      'No directory for fastlane.json'
    )
  })

  it('stamps build.gradle exactly as scripts/updateVersion.ts does', async () => {
    const original = readFileSync(
      join(__dirname, 'android/app/build.gradle'),
      'utf8'
    )
    const { root } = recordStage('develop')
    await setAndroidVersion(root, '4.53.0-d', '26103001')
    expect(readFileSync(join(root, 'android/app/build.gradle'), 'utf8')).toBe(
      stampGradle(original, { version: '4.53.0-d', build: 26103001 })
    )
    // A file missing either line fails both the same way.
    for (const pattern of [/versionName "[^"]*"/, /versionCode [0-9]+/]) {
      const broken = original.replace(pattern, '')
      writeFileSync(join(root, 'android/app/build.gradle'), broken)
      let jenkins = ''
      try {
        stampGradle(broken, { version: '1.0.0', build: 1 })
      } catch (error: unknown) {
        jenkins = String(error)
      }
      expect(jenkins).toMatch(/has no/)
      await expect(setAndroidVersion(root, '1.0.0', '1')).rejects.toThrow(
        jenkins.replace(/^Error: /, '')
      )
    }
  })

  it('gives each branch its suffix and configs', () => {
    expect(versionSuffix('develop')).toBe('-d')
    expect(versionSuffix('master')).toBe('')
    expect(versionSuffix('test-feta')).toBe('-feta')
    expect(versionSuffix('')).toBe('')
    expect(versionSuffix('paul/some_thing')).toBe('-paul-some-thing')
    // Every branch Jenkins' gitVersionFile.ts names gets the same suffix here.
    const jenkins = readFileSync(
      join(__dirname, 'scripts/gitVersionFile.ts'),
      'utf8'
    )
    const table = /const specialBranches[^{]*\{([^}]*)\}/.exec(jenkins)?.[1]
    const entries = [...(table ?? '').matchAll(/'?([\w-]+)'?: '([^']*)'/g)]
    expect(entries.length).toBeGreaterThan(10)
    for (const [, branch, suffix] of entries)
      expect([branch, versionSuffix(branch!)]).toEqual([branch, suffix])
    expect(configsFor('beta')).toEqual(['beta'])
    expect(configsFor('master')).toEqual([])
  })
})
