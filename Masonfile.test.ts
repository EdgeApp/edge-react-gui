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
  runTests,
  secretDirectory,
  setAndroidVersion,
  setup,
  versionSuffix,
  writeSecrets
} from './Masonfile'
import { stampGradle } from './scripts/updateVersion'

type Call = [string, ...unknown[]]

/** A recording `Setup` for one branch. */
function recordSetup(branch: string): { calls: Call[]; m: any } {
  const calls: Call[] = []
  const m = {
    branch,
    apiVersion: (...args: unknown[]) => calls.push(['apiVersion', ...args]),
    buildNumber: (...args: unknown[]) => calls.push(['buildNumber', ...args]),
    stage: (...args: unknown[]) => calls.push(['stage', ...args]),
    parallel: (...args: unknown[]) => calls.push(['parallel', ...args])
  }
  return { calls, m }
}

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
    log: {
      section: async (title: string, body: () => Promise<unknown>) => {
        calls.push(['section', title])
        return await body()
      }
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
  it('tests first, then builds each platform with its tools', () => {
    for (const branch of [
      'develop',
      'beta',
      'coinhub',
      'airbitz',
      'yolo',
      'master',
      'feature/x'
    ]) {
      const { calls, m } = recordSetup(branch)
      setup(m)
      expect(calls.map(call => call[0])).toEqual([
        'apiVersion',
        'buildNumber',
        'stage',
        'parallel'
      ])
      expect(calls[1][2]).toEqual({
        format: 'YYMMDDCC',
        timeZone: 'America/Los_Angeles',
        block: branch === 'master' ? 3 : 1
      })

      // The node type is what starts a pool machine; Linux is asked first.
      const linux = { type: 'linux-x86', os: 'linux', arch: 'x64' }
      const mac = { type: 'macos-arm64', os: 'macos', arch: 'arm64' }
      const [, name, test] = calls[2] as [string, string, any]
      expect(name).toBe('test')
      expect(test.on).toEqual([linux, mac])
      expect(test.tools).toEqual({ node: '22' })
      expect(test.timeout).toBe('1h')
      expect(test.activityTimeout).toBe('30m')
      expect(test.secrets).toBeUndefined()
      expect(test.run).toBe(runTests)

      const [, group, stages, options] = calls[3] as [string, string, any, any]
      expect(group).toBe('build')
      expect(options).toEqual({ failFast: false })
      const configs = configsFor(branch)
      expect(stages.ios.tools).toEqual({
        node: '22',
        xcode: '>=26',
        cocoapods: '1.16.2'
      })
      expect(stages.ios.on).toEqual(mac)
      expect(stages.android.on).toEqual([linux, mac])
      // Until these builds ship, they upload nothing to Sentry.
      for (const stage of [stages.ios, stages.android]) {
        expect(stage.env).toEqual({ SENTRY_DISABLE_AUTO_UPLOAD: 'true' })
        expect([stage.timeout, stage.activityTimeout]).toEqual(['3h', '30m'])
      }
      expect(stages.ios.configs).toEqual(configs)
      expect(stages.ios.secrets).toContain('GoogleService-Info.plist')
      expect(stages.ios.publishes).toBeUndefined()
      expect(stages.ios.buildNumbers).toEqual(['co.edgesecure.app'])
      expect(stages.android.tools.androidLicenses).toBe('accept')
      expect(stages.android.tools.android).toEqual(
        expect.arrayContaining(['platforms;android-35', 'build-tools;35.0.0'])
      )
      expect(stages.android.configs).toEqual(configs)
      expect(stages.android.secrets).toContain('google-services.json')
      expect(stages.android.publishes).toEqual(['co.edgesecure.app'])
    }
  })

  it('runs the Jest suite after a clean install and prepare', async () => {
    const { calls, ctx } = recordStage('develop')
    await runTests(ctx)
    expect(commands(calls)).toEqual([
      'npm ci',
      'npm run prepare',
      'npm test -- --ci'
    ])
  })

  it('names each stage’s phases, in order, as Jenkins did', async () => {
    const sections = async (
      branch: string,
      stage: (ctx: any) => Promise<void>
    ): Promise<unknown[]> => {
      const { calls, ctx } = recordStage(branch)
      await stage(ctx)
      return calls.filter(([kind]) => kind === 'section').map(call => call[1])
    }
    expect(await sections('develop', runTests)).toEqual([
      'Install packages',
      'Prepare',
      'Jest'
    ])
    const prepared = ['Secret files', 'Install packages', 'Prepare']
    expect(await sections('develop', buildIos)).toEqual([
      ...prepared,
      'Version 4.53.0-d (26103001)',
      'CocoaPods',
      'Archive',
      'Save the archive'
    ])
    expect(await sections('develop', buildAndroid)).toEqual([
      ...prepared,
      'Version 4.53.0-d (26103001)',
      'Build the APK',
      'Publish'
    ])
    expect(await sections('master', buildAndroid)).toEqual([
      ...prepared,
      'Version 4.53.0 (26103001)',
      'Build the AAB and APKs',
      'Save the AAB',
      'Publish'
    ])
  })

  it('publishes master’s universal APK and its two ABI variants', async () => {
    const { calls, ctx, root } = recordStage('master')
    await buildAndroid(ctx)
    expect(commands(calls)).toEqual([
      'npm ci',
      'npm run prepare',
      './gradlew bundleRelease assembleRelease -PabiSplits'
    ])
    const gradle = readFileSync(join(root, 'android/app/build.gradle'), 'utf8')
    expect(gradle).toContain('versionCode 26103001')
    expect(gradle).toContain('versionName "4.53.0"')
    // Only those lines change: the split APKs' offsets stay as they are.
    const original = readFileSync(
      join(__dirname, 'android/app/build.gradle'),
      'utf8'
    )
    expect(gradle.split('\n').length).toBe(original.split('\n').length)
    expect(gradle).toContain("['armeabi-v7a': 1, 'arm64-v8a': 2]")
    expect(calls.filter(([kind]) => kind === 'save')).toEqual([
      ['save', 'android-aab', 'android/app/build/outputs/bundle/release/*.aab']
    ])
    const apks = 'android/app/build/outputs/apk/release'
    expect(
      calls.filter(([kind]) => kind === 'publish').map(call => call[1])
    ).toEqual([
      {
        app: 'co.edgesecure.app',
        platform: 'android',
        path: `${apks}/app-universal-release.apk`,
        changelog: 'master 4.53.0'
      },
      {
        app: 'co.edgesecure.app',
        platform: 'android',
        variant: 'armeabi-v7a',
        path: `${apks}/app-armeabi-v7a-release.apk`,
        changelog: 'master 4.53.0'
      },
      {
        app: 'co.edgesecure.app',
        platform: 'android',
        variant: 'arm64-v8a',
        path: `${apks}/app-arm64-v8a-release.apk`,
        changelog: 'master 4.53.0'
      }
    ])
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
  })

  it('publishes one APK on other branches', async () => {
    const { calls, ctx, root } = recordStage('develop')
    await buildAndroid(ctx)
    expect(commands(calls)).toContain('./gradlew assembleRelease')
    expect(calls.filter(([kind]) => kind === 'save')).toEqual([])
    expect(
      calls.filter(([kind]) => kind === 'publish').map(call => call[1])
    ).toEqual([
      {
        app: 'co.edgesecure.app',
        platform: 'android',
        path: 'android/app/build/outputs/apk/release/app-release.apk',
        changelog: 'develop 4.53.0-d'
      }
    ])
    expect(
      readFileSync(join(root, 'android/app/build.gradle'), 'utf8')
    ).toContain('versionName "4.53.0-d"')
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
    // CocoaPods runs without forced colour, so podspecs read plain output.
    expect(
      calls.find(
        ([kind, line]) => kind === 'sh' && line === 'npm run prepare.ios'
      )
    ).toEqual(['sh', 'npm run prepare.ios', { color: false }])
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
