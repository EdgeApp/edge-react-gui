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
  androidApks,
  androidSigning,
  buildAndroid,
  buildIos,
  configsFor,
  runTests,
  secretDirectory,
  setAndroidVersion,
  setup,
  signAndroid,
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
    stash: async (...args: unknown[]) => calls.push(['stash', ...args]),
    unstash: async (...args: unknown[]) => calls.push(['unstash', ...args]),
    // A declared secret file, written where the worker would keep it.
    secretFile: (name: string) => {
      calls.push(['secretFile', name])
      return join(root, 'secrets', name)
    },
    output: async (stage: string) => {
      calls.push(['output', stage])
      return { version: '4.53.0-d' }
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
      // Android builds on a pool machine, then signs on the signing node.
      const [build, sign] = stages.android
      expect(build.name).toBe('build')
      expect(build.on).toEqual([linux, mac])
      // Until these builds ship, they upload nothing to Sentry.
      for (const stage of [stages.ios, build]) {
        expect(stage.env).toEqual({ SENTRY_DISABLE_AUTO_UPLOAD: 'true' })
        expect([stage.timeout, stage.activityTimeout]).toEqual(['3h', '30m'])
      }
      expect(stages.ios.configs).toEqual(configs)
      expect(stages.ios.secrets).toContain('GoogleService-Info.plist')
      expect(stages.ios.publishes).toBeUndefined()
      expect(stages.ios.buildNumbers).toEqual(['co.edgesecure.app'])
      expect(build.tools.androidLicenses).toBe('accept')
      expect(build.tools.android).toEqual(
        expect.arrayContaining(['platforms;android-35', 'build-tools;35.0.0'])
      )
      expect(build.configs).toEqual(configs)
      expect(build.secrets).toContain('google-services.json')
      expect(build.publishes).toBeUndefined()
      expect(build.buildNumbers).toEqual(['co.edgesecure.app'])
      expect(build.run).toBe(buildAndroid)
      // Only the sign stage, on the signing node and with no checkout, gets
      // the keystores and deploy-config.json; no other stage declares them.
      expect(sign).toMatchObject({
        name: 'sign',
        on: { labels: ['android-signing'] },
        checkout: false,
        configs,
        publishes: ['co.edgesecure.app'],
        run: signAndroid
      })
      expect(sign.secrets).toEqual([
        'deploy-config.json',
        'edge-release-keystore.jks',
        'edge-beta-keystore.jks',
        'edge-develop-keystore.jks',
        'coinhub-keystore.jks',
        'airbitzbd-keystore.jks'
      ])
      expect(sign.tools).toEqual({
        java: '17',
        android: ['build-tools;36.1.0'],
        androidLicenses: 'accept'
      })
      for (const stage of [test, stages.ios, build])
        expect(
          (stage.secrets ?? []).some(
            (name: string) =>
              name.endsWith('.jks') || name === 'deploy-config.json'
          )
        ).toBe(false)
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
      stage: (ctx: any) => Promise<unknown>
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
      'Stash the APKs for signing'
    ])
    expect(await sections('master', buildAndroid)).toEqual([
      ...prepared,
      'Version 4.53.0 (26103001)',
      'Build the AAB and APKs',
      'Save the AAB',
      'Stash the APKs for signing'
    ])
  })

  it('builds master’s universal APK and its two ABI APKs, and stashes them for signing', async () => {
    const { calls, ctx, root } = recordStage('master')
    expect(await buildAndroid(ctx)).toEqual({ version: '4.53.0' })
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
    // Nothing is published from the pool machine: the APKs go to signing.
    expect(calls.filter(([kind]) => kind === 'publish')).toEqual([])
    const apks = 'android/app/build/outputs/apk/release'
    expect(calls.filter(([kind]) => kind === 'stash')).toEqual([
      [
        'stash',
        'android-apks',
        [
          `${apks}/app-universal-release.apk`,
          `${apks}/app-armeabi-v7a-release.apk`,
          `${apks}/app-arm64-v8a-release.apk`
        ]
      ]
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

  it('builds one APK on other branches and stashes it', async () => {
    const { calls, ctx, root } = recordStage('develop')
    expect(await buildAndroid(ctx)).toEqual({ version: '4.53.0-d' })
    expect(commands(calls)).toContain('./gradlew assembleRelease')
    expect(calls.filter(([kind]) => kind === 'save')).toEqual([])
    expect(calls.filter(([kind]) => kind === 'stash')).toEqual([
      [
        'stash',
        'android-apks',
        ['android/app/build/outputs/apk/release/app-release.apk']
      ]
    ])
    expect(
      readFileSync(join(root, 'android/app/build.gradle'), 'utf8')
    ).toContain('versionName "4.53.0-d"')
  })

  it('signs the stashed APKs with the branch’s keystore and publishes them', async () => {
    const deployConfig = {
      edge: {
        androidKeyStore: 'edge-release-keystore.jks',
        androidKeyStoreAlias: 'edge',
        androidKeyStorePassword: 'release-pass',
        android: {
          develop: {
            androidKeyStore: 'edge-develop-keystore.jks',
            androidKeyStorePassword: 'develop-pass'
          }
        }
      }
    }
    const sign = async (branch: string) => {
      const { calls, ctx, root } = recordStage(branch)
      mkdirSync(join(root, 'secrets'))
      writeFileSync(
        join(root, 'secrets', 'deploy-config.json'),
        JSON.stringify(deployConfig)
      )
      await signAndroid(ctx)
      return { calls, root }
    }
    const { calls, root } = await sign('develop')
    expect(calls[0]).toEqual(['section', 'Unstash the APKs'])
    expect(calls[1]).toEqual(['unstash', 'android-apks'])
    expect(calls.filter(([kind]) => kind === 'output')).toEqual([
      ['output', 'build/android/build']
    ])
    expect(calls.filter(([kind]) => kind === 'secretFile')).toEqual([
      ['secretFile', 'deploy-config.json'],
      ['secretFile', 'edge-develop-keystore.jks']
    ])
    const keystore = join(root, 'secrets', 'edge-develop-keystore.jks')
    const apksigner = '"$ANDROID_HOME/build-tools/36.1.0/apksigner"'
    // The password and alias reach apksigner by its environment, never its arguments.
    expect(calls.filter(([kind]) => kind === 'sh')).toEqual([
      ['sh', 'mkdir -p signed'],
      [
        'sh',
        `${apksigner} sign --ks "${keystore}" --ks-key-alias "$KEY_ALIAS" --ks-pass env:KEY_PASSWORD --key-pass env:KEY_PASSWORD --out signed/app-release.apk android/app/build/outputs/apk/release/app-release.apk`,
        { env: { KEY_ALIAS: 'edge', KEY_PASSWORD: 'develop-pass' } }
      ],
      ['sh', `${apksigner} verify signed/app-release.apk`]
    ])
    expect(calls.filter(([kind]) => kind === 'publish')).toEqual([
      [
        'publish',
        {
          app: 'co.edgesecure.app',
          platform: 'android',
          path: 'signed/app-release.apk',
          changelog: 'develop 4.53.0-d'
        }
      ]
    ])
    expect(
      calls.filter(([kind]) => kind === 'section').map(call => call[1])
    ).toEqual([
      'Unstash the APKs',
      'Sign with edge-develop-keystore.jks',
      'Publish'
    ])
    // master signs and publishes the universal APK and each ABI's as a variant.
    const master = await sign('master')
    expect(
      master.calls.filter(([kind]) => kind === 'publish').map(call => call[1])
    ).toEqual([
      expect.objectContaining({ path: 'signed/app-universal-release.apk' }),
      expect.objectContaining({
        variant: 'armeabi-v7a',
        path: 'signed/app-armeabi-v7a-release.apk'
      }),
      expect.objectContaining({
        variant: 'arm64-v8a',
        path: 'signed/app-arm64-v8a-release.apk'
      })
    ])
    expect(
      master.calls.find(
        ([kind, line]) => kind === 'sh' && String(line).includes(' sign ')
      )![2]
    ).toEqual({ env: { KEY_ALIAS: 'edge', KEY_PASSWORD: 'release-pass' } })
  })

  it('merges a branch’s Android signing as scripts/deploy.ts does, and refuses a gap', () => {
    const config = {
      edge: {
        androidKeyStore: 'a.jks',
        androidKeyStoreAlias: 'top',
        android: {
          androidKeyStorePassword: 'android-pass',
          beta: { androidKeyStore: 'b.jks' }
        }
      }
    }
    expect(androidSigning(config, 'beta')).toEqual({
      keystore: 'b.jks',
      alias: 'top',
      password: 'android-pass'
    })
    expect(androidSigning(config, 'feature/x').keystore).toBe('a.jks')
    expect(() => androidSigning({}, 'develop')).toThrow(
      'deploy-config.json has no androidKeyStore for develop'
    )
    expect(() => androidSigning(null, 'develop')).toThrow(
      'deploy-config.json has no androidKeyStore for develop'
    )
    expect(androidApks('develop')).toEqual([{ file: 'app-release.apk' }])
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
