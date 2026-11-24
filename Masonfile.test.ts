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
  signIos,
  appFor,
  MAESTRO_BRANCHES,
  buildIosMaestro,
  buildAndroidMaestro,
  signAndroidMaestro,
  setMaestroFlag,
  simulatorApp,
  appStoreVersion,
  uploadIos,
  uploadsToTestflight,
  versionSuffix,
  writeSecrets,
  buildCli,
  cliReleaseNotes,
  cliVersion,
  publishCliRelease,
  releaseCli
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
    parallel: (...args: unknown[]) => calls.push(['parallel', ...args]),
    // The workflow's stages are recorded as if declared on `m`.
    workflow: (name: string, options: unknown, declare: (w: any) => void) => {
      calls.push(['workflow', name, options])
      declare(m)
    }
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
      return { version: '4.53.0-d', build: '26103001' }
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

/** Where xcodebuild writes the iPhone Simulator app. */
const SIMULATOR_PRODUCTS =
  'build/derivedData/Build/Products/Release-iphonesimulator'

const commands = (calls: Call[]): unknown[] =>
  calls.filter(([kind]) => kind === 'sh').map(call => call[1])

/** One request the fake GitHub saw. */
interface GitHubRequest {
  method: string
  host: string
  path: string
  headers: Record<string, string>
  body: any
}

/**
 * A fake GitHub API for the CLI's releases: `releases` lists what is there
 * already, a new draft is release 7, and `status` makes every call fail.
 */
function fakeGitHub(
  releases: Array<{ id: number; tag_name: string; draft: boolean }>,
  status = 200
): {
  fetch: (url: string, init: any) => Promise<any>
  requests: GitHubRequest[]
  uploads: Array<{ name: string; body: string }>
} {
  const requests: GitHubRequest[] = []
  const uploads: Array<{ name: string; body: string }> = []
  const url = (tag: string): string =>
    `https://github.com/EdgeApp/edge-react-gui/releases/tag/${tag}`
  const respond = (code: number, json?: unknown) => ({
    ok: code < 300,
    status: code,
    json: async () => json,
    text: async () => JSON.stringify(json ?? { message: 'Bad credentials' })
  })
  const fetch = async (address: string, init: any) => {
    const parsed = new URL(address)
    const body =
      init.body instanceof Uint8Array
        ? Buffer.from(init.body).toString('utf8')
        : init.body
    requests.push({
      method: init.method,
      host: parsed.host,
      path: parsed.pathname + parsed.search,
      headers: init.headers,
      body
    })
    if (status >= 300) return respond(status)
    if (init.method === 'GET')
      return respond(
        200,
        releases.map(r => ({ ...r, html_url: url(r.tag_name) }))
      )
    if (init.method === 'DELETE') return respond(204)
    if (parsed.host === 'uploads.github.com') {
      uploads.push({ name: parsed.searchParams.get('name') ?? '', body })
      return respond(201, {})
    }
    if (init.method === 'POST') return respond(201, { id: 7 })
    return respond(200, { id: 7, html_url: url('cli-v4.53.0') })
  }
  return { fetch, requests, uploads }
}

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
        'workflow',
        'stage',
        'parallel',
        // The CLI's own workflow, which releases from master.
        'buildNumber',
        'workflow',
        'stage',
        ...(branch === 'master' ? ['stage'] : [])
      ])
      // Pushes to these branches build; any other branch on request.
      expect(calls[2]).toEqual([
        'workflow',
        'build',
        {
          triggers: [
            {
              push: true,
              branches: ['master', 'develop', 'staging', 'beta']
            },
            { request: true }
          ]
        }
      ])
      // Each branch numbers its own app ID's builds.
      expect(calls[1][1]).toBe(appFor(branch))
      expect(calls[1][2]).toEqual({
        format: 'YYMMDDCC',
        timeZone: 'America/Los_Angeles',
        block: branch === 'master' ? 3 : 1
      })

      // The node type is what starts a pool machine; Linux is asked first.
      const linux = { type: 'linux-x86', os: 'linux', arch: 'x64' }
      const mac = { type: 'macos-arm64', os: 'macos', arch: 'arm64' }
      const [, name, test] = calls[3] as [string, string, any]
      expect(name).toBe('test')
      expect(test.on).toEqual([linux, mac])
      expect(test.tools).toEqual({ node: '22' })
      expect(test.timeout).toBe('1h')
      expect(test.activityTimeout).toBe('30m')
      expect(test.secrets).toBeUndefined()
      expect(test.run).toBe(runTests)

      const [, group, stages, options] = calls[4] as [string, string, any, any]
      expect(group).toBe('build')
      expect(options).toEqual({ failFast: false })
      const configs = configsFor(branch)
      // iOS archives unsigned on a pool Mac, then signs for the App Store.
      const app = appFor(branch)
      const [ios, iosSign, iosUpload] = stages.ios
      expect(ios.name).toBe('build')
      expect(ios.tools).toEqual({
        node: '22',
        xcode: '>=26',
        cocoapods: '1.16.2'
      })
      expect(ios.on).toEqual(mac)
      expect(ios.run).toBe(buildIos)
      expect(iosSign).toEqual({
        name: 'sign',
        on: mac,
        checkout: false,
        apple: { distribution: 'adHoc', app },
        timeout: '2h',
        activityTimeout: '30m',
        publishes: [app],
        run: signIos
      })
      // Only master's build is signed for the App Store and sent to TestFlight.
      expect(stages.ios.length).toBe(uploadsToTestflight(branch) ? 3 : 2)
      if (uploadsToTestflight(branch))
        expect(iosUpload).toEqual({
          name: 'testflight',
          on: mac,
          checkout: false,
          apple: { distribution: 'appStore', app },
          timeout: '2h',
          activityTimeout: '30m',
          run: uploadIos
        })
      // Android builds on a pool machine, then signs on the signing node.
      const [build, sign] = stages.android
      expect(build.name).toBe('build')
      expect(build.on).toEqual([linux, mac])
      // Until these builds ship, they upload nothing to Sentry.
      for (const stage of [ios, build]) {
        expect(stage.env).toEqual({ SENTRY_DISABLE_AUTO_UPLOAD: 'true' })
        expect([stage.timeout, stage.activityTimeout]).toEqual(['3h', '30m'])
      }
      expect(ios.configs).toEqual(configs)
      expect(ios.secrets).toContain('GoogleService-Info.plist')
      expect(ios.publishes).toBeUndefined()
      expect(ios.buildNumbers).toEqual([app])
      expect(build.tools.androidLicenses).toBe('accept')
      expect(build.tools.android).toEqual(
        expect.arrayContaining(['platforms;android-35', 'build-tools;35.0.0'])
      )
      expect(build.configs).toEqual(configs)
      expect(build.secrets).toContain('google-services.json')
      expect(build.publishes).toBeUndefined()
      expect(build.buildNumbers).toEqual([app])
      expect(build.run).toBe(buildAndroid)
      // Only the sign stage, on the signing node and with no checkout, gets
      // the keystores and deploy-config.json; no other stage declares them.
      expect(sign).toMatchObject({
        name: 'sign',
        on: { labels: ['android-signing'] },
        checkout: false,
        configs,
        publishes: [app],
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
      for (const stage of [test, ios, iosSign, build])
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
      'Save the archive',
      'Stash the archive for signing'
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
          app: 'app.edge.develop',
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
    expect(await buildIos(ctx)).toEqual({
      version: '4.53.0-yolo',
      build: '26103001'
    })
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
    // The archive is kept, and stashed with the entitlements for signing.
    expect(calls.slice(-5)).toEqual([
      ['section', 'Save the archive'],
      ['save', 'ios-archive', 'build/edge.xcarchive/**'],
      ['section', 'Stash the archive for signing'],
      [
        'stash',
        'ios-build',
        ['build/edge.xcarchive/**', 'ios/edge/edge.entitlements']
      ],
      // Handed to the sign stage, which reserves no number of its own.
      ['getBuildNumber', 'co.edgesecure.app']
    ])
  })

  it('gives the App Store the numeric version without the branch suffix', () => {
    expect(appStoreVersion('4.53.0-d')).toBe('4.53.0')
    expect(appStoreVersion('4.53.0-paul-mason')).toBe('4.53.0')
    expect(appStoreVersion('4.53.0')).toBe('4.53.0')
  })

  it('builds each branch under its app ID: develop, beta and coinhub their own', () => {
    expect(appFor('develop')).toBe('app.edge.develop')
    expect(appFor('beta')).toBe('app.edge.beta')
    expect(appFor('coinhub')).toBe('app.coinhubatm.wallet')
    for (const branch of ['master', 'staging', 'feature/x'])
      expect(appFor(branch)).toBe('co.edgesecure.app')
  })

  it('signs the stashed archive ad hoc and publishes it under the branch’s app ID', async () => {
    for (const [branch, app] of [
      ['develop', 'app.edge.develop'],
      ['beta', 'app.edge.beta'],
      ['master', 'co.edgesecure.app']
    ]) {
      const { calls, ctx } = recordStage(branch)
      // Like Mason, a stage without buildNumbers has no build number.
      ctx.getBuildNumber = (key: string) => {
        throw new Error(`Stage build/ios/sign has no build number for ${key}`)
      }
      ctx.apple = {
        resign: async (...args: unknown[]) => {
          calls.push(['resign', ...args])
          return { ipa: 'build/edge-adhoc.ipa', bundles: [] }
        }
      }
      expect(await signIos(ctx)).toEqual({ version: '4.53.0-d' })
      expect(calls.filter(([kind]) => kind !== 'section')).toEqual([
        ['unstash', 'ios-build'],
        ['output', 'build/ios/build'],
        [
          'resign',
          {
            path: 'build/edge.xcarchive',
            output: 'build/edge-adhoc.ipa',
            entitlements: { [app]: 'ios/edge/edge.entitlements' }
          }
        ],
        [
          'publish',
          {
            app,
            platform: 'ios',
            path: 'build/edge-adhoc.ipa',
            changelog: `${branch} 4.53.0-d`
          }
        ]
      ])
    }
  })

  it('signs master’s archive for the App Store and uploads it to TestFlight', async () => {
    expect(uploadsToTestflight('master')).toBe(true)
    for (const branch of ['develop', 'beta', 'staging', 'feature/x'])
      expect(uploadsToTestflight(branch)).toBe(false)
    const { calls, ctx } = recordStage('master')
    ctx.run.commit = '0123456789abcdef'
    ctx.getBuildNumber = (key: string) => {
      throw new Error(
        `Stage build/ios/testflight has no build number for ${key}`
      )
    }
    ctx.apple = {
      resign: async (...args: unknown[]) => {
        calls.push(['resign', ...args])
        return { ipa: 'build/edge-appstore.ipa', bundles: [] }
      },
      testflight: async (...args: unknown[]) => {
        calls.push(['testflight', ...args])
        return { buildId: 'b', version: '4.53.0', buildNumber: '26103001' }
      }
    }
    expect(await uploadIos(ctx)).toEqual({
      version: '4.53.0-d',
      testflight: '26103001'
    })
    expect(calls.filter(([kind]) => kind !== 'section')).toEqual([
      ['unstash', 'ios-build'],
      ['output', 'build/ios/build'],
      [
        'resign',
        {
          path: 'build/edge.xcarchive',
          output: 'build/edge-appstore.ipa',
          entitlements: { 'co.edgesecure.app': 'ios/edge/edge.entitlements' },
          version: '4.53.0'
        }
      ],
      ['save', 'ios-appstore-ipa', 'build/edge-appstore.ipa'],
      [
        'testflight',
        {
          path: 'build/edge-appstore.ipa',
          usesNonExemptEncryption: false,
          whatToTest: 'master 4.53.0-d (26103001), 012345678'
        }
      ]
    ])
  })

  it('builds Maestro variants only on the Jenkinsfile’s Maestro branches', () => {
    const mac = { type: 'macos-arm64', os: 'macos', arch: 'arm64' }
    const linux = { type: 'linux-x86', os: 'linux', arch: 'x64' }
    for (const branch of [
      'develop',
      'staging',
      'master',
      'beta',
      'testMaestro',
      'yolo',
      'feature/x'
    ]) {
      const { calls, m } = recordSetup(branch)
      setup(m)
      const stages = calls[4][2] as any
      const maestro = MAESTRO_BRANCHES.includes(branch)
      expect(Object.keys(stages)).toEqual(
        maestro
          ? ['ios', 'android', 'ios-maestro', 'android-maestro']
          : ['ios', 'android']
      )
      if (!maestro) continue
      const app = appFor(branch)
      expect(stages['ios-maestro']).toMatchObject({
        on: mac,
        secrets: expect.arrayContaining(['config.json']),
        buildNumbers: [app],
        publishes: [app],
        run: buildIosMaestro
      })
      const [build, sign] = stages['android-maestro']
      expect(build).toMatchObject({
        name: 'build',
        on: [linux, mac],
        buildNumbers: [app],
        run: buildAndroidMaestro
      })
      expect(sign).toMatchObject({
        name: 'sign',
        on: { labels: ['android-signing'] },
        checkout: false,
        publishes: [app],
        run: signAndroidMaestro
      })
    }
  })

  it('sets the Maestro flag in config.json and keeps the rest', async () => {
    const { root } = recordStage('develop')
    writeFileSync(
      join(root, 'config.json'),
      '{"A":1,"ENABLE_MAESTRO_BUILD":false}'
    )
    await setMaestroFlag(root)
    expect(JSON.parse(readFileSync(join(root, 'config.json'), 'utf8'))).toEqual(
      {
        A: 1,
        ENABLE_MAESTRO_BUILD: true
      }
    )
  })

  it('builds the iOS Maestro variant for the iPhone Simulator and publishes the zipped app', async () => {
    const { calls, ctx, root } = recordStage('develop')
    writeFileSync(join(root, 'config.json'), '{"A":1}')
    // develop's deploy patch names the app Edge Develop, as xcodebuild writes it.
    mkdirSync(join(root, SIMULATOR_PRODUCTS, 'Edge Develop.app'), {
      recursive: true
    })
    mkdirSync(join(root, SIMULATOR_PRODUCTS, 'Edge Develop.app.dSYM'))
    expect(await buildIosMaestro(ctx)).toEqual({ version: '4.53.0-d' })
    expect(JSON.parse(readFileSync(join(root, 'config.json'), 'utf8'))).toEqual(
      {
        A: 1,
        ENABLE_MAESTRO_BUILD: true
      }
    )
    expect(commands(calls).slice(-2)).toEqual([
      'npm run prepare.ios',
      'xcodebuild build -workspace ios/edge.xcworkspace -scheme edge -sdk iphonesimulator -arch arm64 -configuration Release -derivedDataPath build/derivedData'
    ])
    expect(calls.filter(([kind]) => kind === 'exec').at(-1)).toEqual([
      'exec',
      'ditto',
      [
        '-c',
        '-k',
        '--keepParent',
        `${SIMULATOR_PRODUCTS}/Edge Develop.app`,
        'build/edge-maestro.zip'
      ]
    ])
    expect(calls.filter(([kind]) => kind === 'publish')).toEqual([
      [
        'publish',
        {
          app: 'app.edge.develop',
          platform: 'ios',
          variant: 'maestro',
          path: 'build/edge-maestro.zip',
          changelog: 'develop 4.53.0-d'
        }
      ]
    ])
  })

  it('zips the one simulator app the build wrote, whatever the branch names it', async () => {
    const { root } = recordStage('beta')
    const products = join(root, SIMULATOR_PRODUCTS)
    mkdirSync(products, { recursive: true })
    await expect(simulatorApp(root)).rejects.toThrow(
      `${SIMULATOR_PRODUCTS} should hold one app, but holds none`
    )
    mkdirSync(join(products, 'Edge Beta.app'))
    expect(await simulatorApp(root)).toBe(`${SIMULATOR_PRODUCTS}/Edge Beta.app`)
    mkdirSync(join(products, 'Edge.app'))
    await expect(simulatorApp(root)).rejects.toThrow(
      `${SIMULATOR_PRODUCTS} should hold one app, but holds `
    )
  })

  it('builds the Android Maestro APK with the flag and stashes it for signing', async () => {
    const { calls, ctx, root } = recordStage('master')
    writeFileSync(join(root, 'config.json'), '{}')
    expect(await buildAndroidMaestro(ctx)).toEqual({ version: '4.53.0' })
    expect(
      JSON.parse(readFileSync(join(root, 'config.json'), 'utf8'))
        .ENABLE_MAESTRO_BUILD
    ).toBe(true)
    // No split APKs: a Maestro build is the plain release APK.
    expect(commands(calls).at(-1)).toBe('./gradlew assembleRelease')
    expect(calls.filter(([kind]) => kind === 'stash')).toEqual([
      [
        'stash',
        'android-maestro-apk',
        ['android/app/build/outputs/apk/release/app-release.apk']
      ]
    ])
  })

  it('signs the Android Maestro APK with the branch’s keystore and publishes it as the maestro variant', async () => {
    const { calls, ctx, root } = recordStage('beta')
    mkdirSync(join(root, 'secrets'))
    writeFileSync(
      join(root, 'secrets', 'deploy-config.json'),
      JSON.stringify({
        edge: {
          androidKeyStore: 'edge-release-keystore.jks',
          androidKeyStoreAlias: 'edge',
          androidKeyStorePassword: 'release-pass',
          android: { beta: { androidKeyStore: 'edge-beta-keystore.jks' } }
        }
      })
    )
    await signAndroidMaestro(ctx)
    expect(calls[1]).toEqual(['unstash', 'android-maestro-apk'])
    expect(calls.filter(([kind]) => kind === 'output')).toEqual([
      ['output', 'build/android-maestro/build']
    ])
    expect(calls.filter(([kind]) => kind === 'secretFile')).toContainEqual([
      'secretFile',
      'edge-beta-keystore.jks'
    ])
    expect(calls.filter(([kind]) => kind === 'publish')).toEqual([
      [
        'publish',
        {
          app: 'app.edge.beta',
          platform: 'android',
          variant: 'maestro',
          path: 'signed/app-release.apk',
          changelog: 'beta 4.53.0-d'
        }
      ]
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

  it('builds the CLI in its own workflow, and releases it from master', () => {
    const mac = { type: 'macos-arm64', os: 'macos', arch: 'arm64' }
    for (const branch of ['master', 'develop', 'paul/cli']) {
      const { calls, m } = recordSetup(branch)
      setup(m)
      const cli = calls.slice(5)
      expect(cli[0]).toEqual([
        'buildNumber',
        'app.edge.cli',
        { format: 'YYMMDDCC', timeZone: 'America/Los_Angeles' }
      ])
      expect(cli[1]).toEqual([
        'workflow',
        'cli',
        { triggers: [{ push: true, branches: ['master'] }, { request: true }] }
      ])
      expect(cli[2]).toEqual([
        'stage',
        'package',
        {
          on: mac,
          tools: { node: '22', xcode: '>=26' },
          secrets: ['edgeCliKey.json'],
          buildNumbers: ['app.edge.cli'],
          timeout: '1h',
          activityTimeout: '30m',
          run: buildCli
        }
      ])
      if (branch === 'master')
        expect(cli[3]).toEqual([
          'stage',
          'release',
          {
            on: mac,
            checkout: false,
            secrets: ['CLI_RELEASE_GITHUB_TOKEN'],
            timeout: '30m',
            activityTimeout: '10m',
            run: releaseCli
          }
        ])
      else expect(cli).toHaveLength(3)
      // The token reaches master's release stage and no other.
      const declares = (name: string): unknown[] =>
        calls.filter(call => JSON.stringify(call).includes(name))
      expect(declares('CLI_RELEASE_GITHUB_TOKEN')).toHaveLength(
        branch === 'master' ? 1 : 0
      )
    }
    expect(secretDirectory('edgeCliKey.json')).toBe('.')
  })

  it('versions the CLI with package.json alone, whatever the branch', async () => {
    for (const branch of ['master', 'develop', 'paul/cli']) {
      const { ctx } = recordStage(branch)
      expect(await cliVersion(ctx)).toBe('4.53.0')
    }
  })

  it('builds, installs and tests the CLI release, and keeps it as app.edge.cli', async () => {
    for (const branch of ['paul/cli', 'master']) {
      const { calls, ctx } = recordStage(branch)
      const described: string[] = []
      ctx.describe = (text: string) => described.push(text)
      expect(await buildCli(ctx)).toEqual({
        version: '4.53.0',
        build: '26103001'
      })
      expect(described).toEqual(['Edge CLI 4.53.0 (26103001)'])
      expect(calls).toContainEqual(['getBuildNumber', 'app.edge.cli'])
      expect(calls).toContainEqual([
        'writeSecretFile',
        'edgeCliKey.json',
        '.',
        {}
      ])
      expect(commands(calls)).toEqual([
        'npm ci',
        'npm run prepare',
        'npm run test:cli:offline:built',
        'npm run publish:cli -- --out build/cli-package --with-signer --allow-dirty --allow-unpushed --allow-broken-plugins',
        'node -r sucrase/register scripts/buildCliRelease.ts --package build/cli-package --out build/cli-release',
        'rm -rf build/cli-install && EDGE_CLI_RELEASE_DIR="$PWD/build/cli-release" EDGE_CLI_PREFIX="$PWD/build/cli-install/app" EDGE_CLI_BINDIR="$PWD/build/cli-install/bin" bash build/cli-release/install.sh --user',
        'PATH="$PWD/build/cli-install/app/current/node/bin:$PATH" EDGE_CLI_BIN="$PWD/build/cli-install/app/current/package/edgeCli.js" npm run test:cli:offline'
      ])
      expect(
        calls.filter(([kind]) => kind === 'section').map(c => c[1])
      ).toEqual([
        'Secret files',
        'Install packages',
        'Prepare',
        'Offline suites',
        'Release 4.53.0 (26103001)',
        'Install and test',
        'Save'
      ])
      expect(calls).toContainEqual([
        'save',
        'app.edge.cli',
        'build/cli-release/*'
      ])
      // Only master's release goes on to the release stage.
      const stashes = calls.filter(([kind]) => kind === 'stash')
      expect(stashes).toEqual(
        branch === 'master'
          ? [['stash', 'cli-release', 'build/cli-release/*']]
          : []
      )
    }
  })

  it('publishes master’s stashed release with the token', async () => {
    const { calls, ctx, root } = recordStage('master')
    mkdirSync(join(root, 'build/cli-release'), { recursive: true })
    for (const name of [
      'SHA256SUMS',
      'install.sh',
      'edge-cli-4.53.0-darwin-arm64.tar.gz'
    ])
      writeFileSync(join(root, 'build/cli-release', name), name)
    ctx.run.commit = '0123456789abcdef'
    ctx.output = async (stage: string) => {
      calls.push(['output', stage])
      return { version: '4.53.0', build: '26112301' }
    }
    ctx.secret = (name: string) => {
      calls.push(['secret', name])
      return 'the-token'
    }
    const logged: string[] = []
    ctx.log.info = (text: string) => logged.push(text)
    const github = fakeGitHub([])
    const saved = globalThis.fetch
    globalThis.fetch = github.fetch as typeof fetch
    try {
      expect(await releaseCli(ctx)).toEqual({
        url: 'https://github.com/EdgeApp/edge-react-gui/releases/tag/cli-v4.53.0',
        published: true
      })
    } finally {
      globalThis.fetch = saved
    }
    expect(calls).toContainEqual(['output', 'package'])
    expect(calls).toContainEqual(['unstash', 'cli-release'])
    expect(calls).toContainEqual(['secret', 'CLI_RELEASE_GITHUB_TOKEN'])
    // Every file, in name order, under its own name.
    expect(github.uploads.map(upload => upload.name)).toEqual([
      'SHA256SUMS',
      'edge-cli-4.53.0-darwin-arm64.tar.gz',
      'install.sh'
    ])
    expect(github.uploads[0].body).toBe('SHA256SUMS')
    expect(logged).toEqual([
      'Published https://github.com/EdgeApp/edge-react-gui/releases/tag/cli-v4.53.0'
    ])
  })

  it('publishes a CLI release as a draft first, and never as the latest release', async () => {
    const root = mkdtempSync(join(tmpdir(), 'masonfile-'))
    roots.push(root)
    const file = join(root, 'SHA256SUMS')
    writeFileSync(file, 'sums')
    const github = fakeGitHub([])
    const result = await publishCliRelease({
      repository: 'EdgeApp/edge-react-gui',
      token: 'the-token',
      version: '4.53.0',
      build: '26112301',
      commit: '0123456789abcdef',
      files: [file],
      fetch: github.fetch as typeof fetch
    })
    expect(result.published).toBe(true)
    expect(github.requests.map(r => `${r.method} ${r.path}`)).toEqual([
      'GET /repos/EdgeApp/edge-react-gui/releases?per_page=100',
      'POST /repos/EdgeApp/edge-react-gui/releases',
      'POST /repos/EdgeApp/edge-react-gui/releases/7/assets?name=SHA256SUMS',
      'PATCH /repos/EdgeApp/edge-react-gui/releases/7'
    ])
    for (const r of github.requests)
      expect(r.headers.Authorization).toBe('Bearer the-token')
    expect(JSON.parse(github.requests[1].body)).toEqual({
      tag_name: 'cli-v4.53.0',
      target_commitish: '0123456789abcdef',
      name: 'Edge CLI 4.53.0',
      body: cliReleaseNotes('4.53.0', '26112301', '0123456789abcdef'),
      draft: true,
      make_latest: 'false'
    })
    expect(github.requests[2].headers['Content-Type']).toBe(
      'application/octet-stream'
    )
    expect(github.requests[2].host).toBe('uploads.github.com')
    expect(JSON.parse(github.requests[3].body)).toEqual({
      draft: false,
      make_latest: 'false'
    })
    expect(cliReleaseNotes('4.53.0', '26112301', '0123456789abcdef')).toContain(
      'curl -fsSL https://github.com/EdgeApp/edge-react-gui/releases/download/cli-v4.53.0/install.sh | bash -s -- --version 4.53.0'
    )
  })

  it('keeps a CLI release already published, and replaces a draft left behind', async () => {
    const options = {
      repository: 'EdgeApp/edge-react-gui',
      token: 'the-token',
      version: '4.53.0',
      build: '26112301',
      commit: '0123456789abcdef',
      files: []
    }
    const published = fakeGitHub([
      { id: 3, tag_name: 'v4.53.0', draft: false },
      { id: 5, tag_name: 'cli-v4.53.0', draft: false }
    ])
    expect(
      await publishCliRelease({
        ...options,
        fetch: published.fetch as typeof fetch
      })
    ).toEqual({
      url: 'https://github.com/EdgeApp/edge-react-gui/releases/tag/cli-v4.53.0',
      published: false
    })
    expect(published.requests.map(r => r.method)).toEqual(['GET'])

    const drafted = fakeGitHub([
      { id: 5, tag_name: 'cli-v4.53.0', draft: true }
    ])
    expect(
      (
        await publishCliRelease({
          ...options,
          fetch: drafted.fetch as typeof fetch
        })
      ).published
    ).toBe(true)
    expect(drafted.requests.map(r => `${r.method} ${r.path}`)).toEqual([
      'GET /repos/EdgeApp/edge-react-gui/releases?per_page=100',
      'DELETE /repos/EdgeApp/edge-react-gui/releases/5',
      'POST /repos/EdgeApp/edge-react-gui/releases',
      'PATCH /repos/EdgeApp/edge-react-gui/releases/7'
    ])

    const refusing = fakeGitHub([], 401)
    await expect(
      publishCliRelease({ ...options, fetch: refusing.fetch as typeof fetch })
    ).rejects.toThrow(
      /GET https:\/\/api\.github\.com\/repos\/EdgeApp\/edge-react-gui\/releases\?per_page=100 with 401/
    )
  })
})
