import type { Setup, Stage, Tools } from '@mason/types'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

// Runs the Jest suite, then builds Edge for iOS on a macOS arm64 machine and
// for Android on a Linux x86_64 machine, or on a Mac when no Linux machine is
// free. All come from the master's temporary cloud pools: a stage's node type
// is what starts a pool machine, and its os and arch keep it on the right
// kind of machine. The tests take whichever of the two is free, Linux first,
// and a failure stops the builds.
//
// Every tool the builds use is in the stages' tools. Node, Java, the Android
// SDK (its licences accepted here) and CocoaPods install on demand, so a
// fresh pool machine needs no setup for them; Xcode >=26 comes with the
// macOS pool's image (NoMac's has Xcode 27 alone, and no helper to install
// another), or through the helper on a Mac that runs one. Under Xcode 27,
// patches/expo-modules-jsi builds Expo SDK 57's ExpoModulesJSI without
// warnings, which Xcode 27 would report as a failure (expo/expo#50279).
//
// Each run has one build number, which both platforms stamp into their
// native projects themselves (setAndroidVersion, setIosVersion), with the
// version package.json and the branch give. On master, the only branch that
// builds the per-ABI APKs, a run reserves three numbers (Jenkins steps every
// branch by three for the same reason): the universal APK is N, and the
// per-ABI APKs android/app/build.gradle gives N+1 and N+2 are published as
// variants of the same build. The AAB is kept as the run's artifact.
//
// Android is built on a pool machine and signed on the local network: the
// build stage stashes its APKs, which go over its link to the master, and
// the sign stage, on the node labelled android-signing (Jack3's own worker),
// takes them without a checkout, signs each with the branch's release
// keystore and publishes the signed APKs to Mason's install page. Only that
// stage declares the keystores and deploy-config.json, which holds their
// aliases and passwords, so they reach no other node. The AAB, kept as the
// run's artifact, still carries the repository's test keystore
// (android/app/airbitz.keystore), as a plain Gradle build signs it. The iOS
// archive is built without code signing and signed afterwards on a Mac: ad
// hoc under the branch's app ID on every branch, published to Mason's install
// page, and on master also for the App Store, which master's run uploads to
// TestFlight. develop and beta are never signed for distribution.
//
// Of the files scripts/secretFiles.ts copies in from Jenkins' secret folders,
// those a build reads are project secret files on the Mason master, one name
// each, with variants by build config: the default variant is master's file,
// and a branch with its own Jenkins folder (develop, beta, coinhub, airbitz)
// has its own variant where its folder had its own file. The per-branch
// overrides scripts/deploy.ts merges into config.json from deploy-config.json
// are merged into config.json variants too (beta's feature flags, yolo's
// login). Each stage's configs are its branch when the branch has variants,
// so it gets that branch's files and the defaults for the rest. fastlane.json
// is not one: Mason replaces fastlane. Both native builds embed the API key and secret from edgeKey.json and fail
// without it (scripts/makeApiSigner.ts).
//
// keys.json carries Edge's Sentry upload token, which scripts/patchFiles.ts
// writes into sentry.properties and build.gradle. Until these builds are the
// ones that ship, they upload nothing to Sentry: SENTRY_DISABLE_AUTO_UPLOAD
// turns off the JS source maps on both platforms (@sentry/react-native), the
// dSYMs on iOS, and on Android the native symbols, ProGuard mapping and
// source bundle (android/app/build.gradle's sentry block). A release they
// share with a shipped Jenkins build would otherwise symbolicate its crashes
// against these files.
//
// Every run also builds the CLI, as app.edge.cli, in a group of its own
// beside the app's builds, after the tests: on a Mac for macOS (arm64) and on
// a Linux machine for Linux (x64), so each compiles its own platform's Node
// signer. Each builds a release (scripts/buildCliRelease.ts): a tarball
// holding a Node.js runtime and the CLI's package, whose dependencies
// install.sh then installs with that runtime's npm, so a machine needs no
// Node.js of its own; and install.sh and SHA256SUMS. Each installs its
// tarball as `curl … | bash` would and runs the offline suites against it,
// then keeps the release as the run's app.edge.cli.<platform> artifact. On
// master a release stage publishes both on GitHub as cli-v<version>,
// package.json's version, never marked latest, since the repository's latest
// release is the app's. That stage alone declares CLI_RELEASE_GITHUB_TOKEN,
// and it has no checkout, so nothing an npm install brought in runs beside
// the token.
//
// This needs a Mason master with stage configs, ctx.writeSecretFile,
// build-number blocks, published variants, node selector lists, the
// cocoapods and androidLicenses tools, and the setup label (so the signing
// node, which lacks it, never runs a branch's setup).

const APP = 'co.edgesecure.app'

/**
 * The app ID a branch builds: develop and beta have their own, as their
 * deploy patches set, and coinhub builds CoinHub's wallet, whose project
 * sets its own bundle ID (and Apple team).
 */
export function appFor(branch: string): string {
  if (branch === 'develop') return 'app.edge.develop'
  if (branch === 'beta') return 'app.edge.beta'
  if (branch === 'coinhub') return 'app.coinhubatm.wallet'
  return APP
}

// The app bundles the Firebase configs as resources, which must be readable
// on the device, so they are written 0644; the rest stay owner-only.
const SHIPPED = ['GoogleService-Info.plist', 'google-services.json']
/**
 * Each secret file and the checkout directory it is written to, where
 * scripts/secretFiles.ts puts it. The master names each by its file name.
 */
const SECRET_DIRECTORIES: Record<string, string> = {
  'config.json': '.',
  'edgeKey.json': '.',
  'edgeCliKey.json': '.',
  'keys.json': '.',
  'deploy-config.json': '.',
  'GoogleService-Info.plist': 'ios/edge',
  'google-services.json': 'android/app'
}
/** The Android keystores go in keystores/, as each branch folder's keystores/ is copied. */
const KEYSTORES = 'keystores'

/** Where a secret file is written in the checkout, if it is one the builds know. */
export function secretDirectory(name: string): string | undefined {
  if (Object.hasOwn(SECRET_DIRECTORIES, name)) return SECRET_DIRECTORIES[name]
  if (/^[A-Za-z0-9_.-]+\.jks$/.test(name)) return KEYSTORES
}
/** What each platform's build reads: the shared files and its own Firebase config. */
const SHARED_SECRETS = ['config.json', 'edgeKey.json', 'keys.json']
const IOS_SECRETS = [...SHARED_SECRETS, 'GoogleService-Info.plist']
const ANDROID_SECRETS = [...SHARED_SECRETS, 'google-services.json']
/** What the CLI's package reads: the key pair its Node signer is built from. */
const CLI_SECRETS = ['edgeCliKey.json']
/** The CLI's builds: their build-number sequence, and their run artifacts' name. */
const CLI_APP = 'app.edge.cli'
/** The cli group's stages, one per platform, which master's release gathers. */
const CLI_STAGES = ['cli/mac', 'cli/linux']
/**
 * The repository whose releases carry the CLI, and the value secret holding
 * a token that publishes them there (contents: write). Only master's release
 * stage declares it.
 */
const CLI_REPOSITORY = 'EdgeApp/edge-react-gui'
const CLI_RELEASE_TOKEN = 'CLI_RELEASE_GITHUB_TOKEN'
/** Where publish:cli stages the package, the release built from it, and a test install of it. */
const CLI_STAGE = 'build/cli-package'
const CLI_RELEASE = 'build/cli-release'
const CLI_INSTALL = 'build/cli-install'
/** Each platform's release, from its stage to master's release stage, which unpacks them here. */
const CLI_RELEASE_STASH = 'cli-release'
const CLI_PARTS = 'build/cli-parts'
/**
 * What signing an Android build reads, on the signing node only: each
 * branch's keystore, alias and password are in deploy-config.json, and the
 * keystore it names is one of these.
 */
const SIGNING_SECRETS = [
  'deploy-config.json',
  'edge-release-keystore.jks',
  'edge-beta-keystore.jks',
  'edge-develop-keystore.jks',
  'coinhub-keystore.jks',
  'airbitzbd-keystore.jks'
]
/** The Android build-tools whose apksigner signs the APKs. */
const BUILD_TOOLS = '36.1.0'
/** The stash the iOS build leaves its unsigned archive and entitlements in. */
const UNSIGNED_IOS = 'ios-build'
const IOS_ARCHIVE = 'build/edge.xcarchive'
const IOS_ENTITLEMENTS = 'ios/edge/edge.entitlements'
/** What the Android build installs. Library modules still compile against 35. */
const ANDROID_TOOLS: Tools = {
  node: '22',
  java: '17',
  android: [
    'platforms;android-36',
    'platforms;android-35',
    `build-tools;${BUILD_TOOLS}`,
    'build-tools;35.0.0',
    'ndk;27.1.12297006',
    'cmake;3.22.1'
  ],
  androidLicenses: 'accept'
}
/** What signing an Android build installs: apksigner. */
const SIGNING_TOOLS: Tools = {
  java: '17',
  android: [`build-tools;${BUILD_TOOLS}`],
  androidLicenses: 'accept'
}
/** The branches whose builds also have a Maestro variant, as the Jenkinsfile's buildMaestro. */
export const MAESTRO_BRANCHES = [
  'develop',
  'staging',
  'master',
  'beta',
  'testMaestro'
]
/** The stash the Android Maestro build leaves its unsigned APK in. */
const UNSIGNED_MAESTRO_APK = 'android-maestro-apk'
/** Where the iOS Maestro build's iPhone Simulator app lands, and the zip it publishes. */
const SIMULATOR_PRODUCTS =
  'build/derivedData/Build/Products/Release-iphonesimulator'
const MAESTRO_ZIP = 'build/edge-maestro.zip'
/** The stash the Android build leaves its unsigned-for-release APKs in. */
const UNSIGNED_APKS = 'android-apks'
const APK_DIR = 'android/app/build/outputs/apk/release'
/** Branches with their own variants of some secret files. */
const CONFIG_BRANCHES = ['develop', 'beta', 'coinhub', 'airbitz', 'yolo']

/** The build configs of a branch's stages. */
export function configsFor(branch: string): string[] {
  return CONFIG_BRANCHES.includes(branch) ? [branch] : []
}

/** The machines the pools make: Macs for Xcode, Linux for the rest. */
const MAC = { type: 'macos-arm64', os: 'macos', arch: 'arm64' } as const
const LINUX = { type: 'linux-x86', os: 'linux', arch: 'x64' } as const
/** The node that signs Android builds, on the local network. */
const ANDROID_SIGNER = { labels: ['android-signing'] }

/** The per-ABI APKs a master build publishes; build.gradle numbers them N+1 and N+2. */
const ABI_SPLITS = ['armeabi-v7a', 'arm64-v8a']

export function setup(m: Setup) {
  m.apiVersion(1)
  // Date and a counter (26102901); iOS and Android of one run share the
  // number. A master run takes three (26102901 to 26102903), leaving room
  // for the per-ABI APKs' version codes; other branches take one.
  const app = appFor(m.branch)
  m.buildNumber(app, {
    format: 'YYMMDDCC',
    timeZone: 'America/Los_Angeles',
    block: m.branch === 'master' ? 3 : 1
  })
  // The CLI's builds count on their own, as app.edge.cli.
  m.buildNumber(CLI_APP, {
    format: 'YYMMDDCC',
    timeZone: 'America/Los_Angeles'
  })

  // As the Jenkinsfile's branches did: these build on every push, and any
  // other branch on request. The master's rule (`*` automatic) is the ceiling.
  m.workflow(
    'build',
    {
      triggers: [
        { push: true, branches: ['master', 'develop', 'staging', 'beta'] },
        { request: true }
      ]
    },
    w => {
      // `npm run prepare` makes the config and API signer it needs without
      // secrets, so the tests run on any free machine.
      const test = w.stage('test', {
        on: [LINUX, MAC],
        tools: { node: '22' },
        timeout: '1h',
        activityTimeout: '30m',
        run: runTests
      })

      const configs = configsFor(m.branch)
      // A cold pool machine installs, pods and archives within this; a hung step
      // (a pod repo update, a Gradle daemon) stops printing long before.
      const limits = { timeout: '3h', activityTimeout: '30m' } as const
      const env = { SENTRY_DISABLE_AUTO_UPLOAD: 'true' }
      // Each platform reports its own result, as the Jenkinsfile's parallel did.
      w.parallel(
        'build',
        {
          // Archived unsigned, then signed ad hoc and published for testers;
          // master's is also signed for the App Store and sent to TestFlight.
          ios: [
            {
              name: 'build',
              on: MAC,
              tools: { node: '22', xcode: '>=26', cocoapods: '1.16.2' },
              configs,
              secrets: IOS_SECRETS,
              env,
              ...limits,
              buildNumbers: [app],
              run: buildIos
            },
            {
              name: 'sign',
              on: MAC,
              // Only the stashed archive: no repository on the signing Mac.
              checkout: false,
              apple: { distribution: 'adHoc', app },
              timeout: '2h',
              activityTimeout: '30m',
              publishes: [app],
              run: signIos
            },
            ...(uploadsToTestflight(m.branch)
              ? [
                  {
                    name: 'testflight',
                    on: MAC,
                    checkout: false,
                    apple: { distribution: 'appStore', app },
                    timeout: '2h',
                    activityTimeout: '30m',
                    run: uploadIos
                  } as const
                ]
              : [])
          ],
          // Built on a pool machine, then signed on the local network.
          android: [
            {
              name: 'build',
              // Gradle and the Android SDK run on either; Linux is cheaper.
              on: [LINUX, MAC],
              tools: ANDROID_TOOLS,
              configs,
              secrets: ANDROID_SECRETS,
              env,
              ...limits,
              buildNumbers: [app],
              run: buildAndroid
            },
            {
              name: 'sign',
              on: ANDROID_SIGNER,
              // Only the stashed APKs: no repository on the signing node.
              checkout: false,
              tools: SIGNING_TOOLS,
              configs,
              secrets: SIGNING_SECRETS,
              timeout: '30m',
              activityTimeout: '10m',
              publishes: [app],
              run: signAndroid
            }
          ],
          // Maestro variants of the same app, with the Maestro flag set: an
          // iPhone Simulator build, and an APK signed as the branch's is.
          ...(MAESTRO_BRANCHES.includes(m.branch)
            ? {
                'ios-maestro': {
                  on: MAC,
                  tools: { node: '22', xcode: '>=26', cocoapods: '1.16.2' },
                  configs,
                  secrets: IOS_SECRETS,
                  env,
                  ...limits,
                  buildNumbers: [app],
                  publishes: [app],
                  run: buildIosMaestro
                },
                'android-maestro': [
                  {
                    name: 'build',
                    on: [LINUX, MAC],
                    tools: ANDROID_TOOLS,
                    configs,
                    secrets: ANDROID_SECRETS,
                    env,
                    ...limits,
                    buildNumbers: [app],
                    run: buildAndroidMaestro
                  },
                  {
                    name: 'sign',
                    on: ANDROID_SIGNER,
                    checkout: false,
                    tools: SIGNING_TOOLS,
                    configs,
                    secrets: SIGNING_SECRETS,
                    timeout: '30m',
                    activityTimeout: '10m',
                    publishes: [app],
                    run: signAndroidMaestro
                  }
                ]
              }
            : {})
        },
        { failFast: false }
      )

      // The CLI, as app.edge.cli: its own group beside the app's builds,
      // after the tests. Each platform builds on its own OS, which compiles
      // that platform's Node signer.
      const cliLimits = { timeout: '1h', activityTimeout: '30m' } as const
      const cli = w.parallel(
        'cli',
        {
          mac: {
            on: MAC,
            tools: { node: '22', xcode: '>=26' },
            secrets: CLI_SECRETS,
            buildNumbers: [CLI_APP],
            ...cliLimits,
            run: buildCli
          },
          linux: {
            on: LINUX,
            tools: { node: '22' },
            secrets: CLI_SECRETS,
            buildNumbers: [CLI_APP],
            ...cliLimits,
            run: buildCli
          }
        },
        { needs: [test], failFast: false }
      )
      // Master's release, from both platforms' stashes. It has no checkout,
      // so nothing an npm install brought in runs where the token is.
      if (m.branch === 'master')
        w.stage('cli-release', {
          on: [LINUX, MAC],
          needs: [cli],
          checkout: false,
          secrets: [CLI_RELEASE_TOKEN],
          timeout: '30m',
          activityTimeout: '10m',
          run: releaseCli
        })
    }
  )
}

/** The Jest suite, prepared as the Jenkinsfile's preTest runs it. */
export async function runTests(ctx: Stage) {
  await ctx.log.section('Install packages', async () => await ctx.sh('npm ci'))
  // The repository's .npmrc turns install scripts off, so `prepare` runs here.
  await ctx.log.section('Prepare', async () => await ctx.sh('npm run prepare'))
  await ctx.log.section('Jest', async () => await ctx.sh('npm test -- --ci'))
}

/**
 * Prepares the checkout as the Jenkinsfile does: the secret files, packages,
 * the branch's deploy patches and Sentry keys, then npm's `prepare` (config,
 * patched packages, generated signer and contract code). Each platform
 * stamps its own version.
 */
async function prepare(
  ctx: Stage,
  secrets: string[],
  options: { maestro?: boolean } = {}
): Promise<void> {
  await ctx.log.section(
    'Secret files',
    async () => await writeSecrets(ctx, secrets)
  )
  if (options.maestro === true)
    await ctx.log.section(
      'Maestro',
      async () => await setMaestroFlag(ctx.workspace)
    )
  // The repository's .npmrc turns install scripts off, so `prepare` runs below.
  await ctx.log.section('Install packages', async () => await ctx.sh('npm ci'))
  await ctx.log.section('Prepare', async () => {
    await ctx.exec('node', [
      '-r',
      'sucrase/register',
      './scripts/patchFiles.ts',
      'edge',
      ctx.run.branch
    ])
    await ctx.sh('npm run prepare')
  })
}

/** Stamps the run's version and build number, under a section that names them. */
async function stampVersion(
  ctx: Stage,
  stamp: (version: string, build: string) => Promise<void>
): Promise<string> {
  const version = await versionOf(ctx)
  const build = ctx.getBuildNumber(appFor(ctx.run.branch))
  await ctx.log.section(
    `Version ${version} (${build})`,
    async () => await stamp(version, build)
  )
  return version
}

/** The run's version: package.json's, with the branch's suffix. */
async function versionOf(ctx: Stage): Promise<string> {
  const { version } = JSON.parse(await ctx.fs.read('package.json'))
  return `${version}${versionSuffix(ctx.run.branch)}`
}

/** Writes the version and build number into android/app/build.gradle. */
export async function setAndroidVersion(
  root: string,
  version: string,
  build: string
): Promise<void> {
  const file = join(root, 'android/app/build.gradle')
  let gradle = await readFile(file, 'utf8')
  // A pattern that no longer matches would leave the old version in place:
  const replace = (pattern: RegExp, text: string): void => {
    if (gradle.search(pattern) < 0) {
      throw new Error(`android/app/build.gradle has no ${String(pattern)}`)
    }
    gradle = gradle.replace(pattern, text)
  }
  replace(/versionName "[^"]*"/g, `versionName "${version}"`)
  replace(/versionCode [0-9]+/g, `versionCode ${build}`)
  await writeFile(file, gradle)
}

/** Writes the version and build number into the iOS project with agvtool. */
export async function setIosVersion(
  ctx: Stage,
  version: string,
  build: string
): Promise<void> {
  await ctx.exec('agvtool', ['new-marketing-version', version], { cwd: 'ios' })
  await ctx.exec('agvtool', ['new-version', '-all', build], { cwd: 'ios' })
}

/** Writes each secret file the stage declared into its directory. */
export async function writeSecrets(
  ctx: Stage,
  secrets: string[]
): Promise<void> {
  for (const name of secrets) {
    const directory = secretDirectory(name)
    if (directory == null) throw new Error(`No directory for ${name}`)
    await ctx.writeSecretFile(
      name,
      directory,
      SHIPPED.includes(name) ? { mode: 0o644 } : {}
    )
  }
}

export async function buildIos(ctx: Stage) {
  await prepare(ctx, IOS_SECRETS)
  const version = await stampVersion(
    ctx,
    async (version, build) => await setIosVersion(ctx, version, build)
  )
  // Without colour: VisionCamera's podspec reads `node --print` output, and
  // forced colour wraps its `undefined` in escapes, which it takes for a path.
  await ctx.log.section(
    'CocoaPods',
    async () => await ctx.sh('npm run prepare.ios', { color: false })
  )
  await ctx.log.section(
    'Archive',
    async () =>
      await ctx.sh(
        [
          'xcodebuild archive',
          '-workspace ios/edge.xcworkspace',
          '-scheme edge',
          '-configuration Release',
          "-destination 'generic/platform=iOS'",
          '-archivePath build/edge.xcarchive',
          'CODE_SIGNING_ALLOWED=NO'
        ].join(' ')
      )
  )
  await ctx.log.section(
    'Save the archive',
    async () => await ctx.artifacts.save('ios-archive', `${IOS_ARCHIVE}/**`)
  )
  await ctx.log.section(
    'Stash the archive for signing',
    async () =>
      await ctx.stash(UNSIGNED_IOS, [`${IOS_ARCHIVE}/**`, IOS_ENTITLEMENTS])
  )
  // The sign stage reserves no number of its own, so it names the build by this.
  return { version, build: ctx.getBuildNumber(appFor(ctx.run.branch)) }
}

/**
 * Signs the stashed archive ad hoc with the stage's distribution certificate
 * and ad hoc profile, so the devices registered on the host can install it,
 * and publishes it. The unsigned archive carries no entitlements, so the
 * project's are given; the profile decides aps-environment.
 */
export async function signIos(ctx: Stage) {
  const app = appFor(ctx.run.branch)
  await ctx.log.section(
    'Unstash the archive',
    async () => await ctx.unstash(UNSIGNED_IOS)
  )
  const { version } = await ctx.output<{ version: string }>('build/ios/build')
  const { ipa } = await ctx.apple.resign({
    path: IOS_ARCHIVE,
    output: 'build/edge-adhoc.ipa',
    entitlements: { [app]: IOS_ENTITLEMENTS }
  })
  await ctx.log.section(
    'Publish',
    async () =>
      await ctx.publish({
        app,
        platform: 'ios',
        path: ipa,
        changelog: `${ctx.run.branch} ${version}`
      })
  )
  return { version }
}

/**
 * Signs the stashed archive for the App Store and uploads it to TestFlight,
 * on the branches that upload (master). App Store Connect takes only a
 * numeric version, without the branch's suffix.
 */
export async function uploadIos(ctx: Stage) {
  const app = appFor(ctx.run.branch)
  await ctx.log.section(
    'Unstash the archive',
    async () => await ctx.unstash(UNSIGNED_IOS)
  )
  const { version, build } = await ctx.output<{
    version: string
    build: string
  }>('build/ios/build')
  const { ipa } = await ctx.apple.resign({
    path: IOS_ARCHIVE,
    output: 'build/edge-appstore.ipa',
    entitlements: { [app]: IOS_ENTITLEMENTS },
    version: appStoreVersion(version)
  })
  await ctx.log.section(
    'Save the IPA',
    async () => await ctx.artifacts.save('ios-appstore-ipa', ipa)
  )
  const uploaded = await ctx.log.section(
    'Upload to TestFlight',
    async () =>
      await ctx.apple.testflight({
        path: ipa,
        // As every Edge build in App Store Connect answers export compliance.
        usesNonExemptEncryption: false,
        whatToTest: `${
          ctx.run.branch
        } ${version} (${build}), ${ctx.run.commit.slice(0, 9)}`
      })
  )
  return { version, testflight: uploaded.buildNumber }
}

/** The App Store's version of a branch's version: its numeric part, 4.53.0 of 4.53.0-d. */
export function appStoreVersion(version: string): string {
  return version.replace(/-.*$/, '')
}

/** Only master's builds go to TestFlight. */
export function uploadsToTestflight(branch: string): boolean {
  return branch === 'master'
}

/**
 * Builds the release APK. On master, as Jenkins does, it also builds the AAB
 * and the per-ABI APKs: the universal APK is the build's default variant and
 * each ABI's APK is a variant with its own version code.
 */
export async function buildAndroid(ctx: Stage) {
  await prepare(ctx, ANDROID_SECRETS)
  const version = await stampVersion(
    ctx,
    async (version, build) =>
      await setAndroidVersion(ctx.workspace, version, build)
  )
  if (ctx.run.branch !== 'master') {
    await ctx.log.section(
      'Build the APK',
      async () => await ctx.sh('./gradlew assembleRelease', { cwd: 'android' })
    )
  } else {
    await ctx.log.section('Build the AAB and APKs', async () => {
      await ctx.sh('./gradlew bundleRelease assembleRelease -PabiSplits', {
        cwd: 'android'
      })
    })
    await ctx.log.section(
      'Save the AAB',
      async () =>
        await ctx.artifacts.save(
          'android-aab',
          'android/app/build/outputs/bundle/release/*.aab'
        )
    )
  }
  await ctx.log.section(
    'Stash the APKs for signing',
    async () =>
      await ctx.stash(
        UNSIGNED_APKS,
        androidApks(ctx.run.branch).map(apk => `${APK_DIR}/${apk.file}`)
      )
  )
  return { version }
}

/** Sets the Maestro flag in config.json, as scripts/deploy.ts does for a Maestro build. */
export async function setMaestroFlag(root: string): Promise<void> {
  const file = join(root, 'config.json')
  const config = JSON.parse(await readFile(file, 'utf8'))
  await writeFile(
    file,
    JSON.stringify({ ...config, ENABLE_MAESTRO_BUILD: true }, null, 2)
  )
}

/**
 * The one app the iPhone Simulator build wrote, as a path in the checkout.
 * Its name is the branch's product name, which the deploy patches change
 * (Edge Develop, Edge Beta), so it is found rather than named.
 */
export async function simulatorApp(root: string): Promise<string> {
  const apps = (await readdir(join(root, SIMULATOR_PRODUCTS))).filter(name =>
    name.endsWith('.app')
  )
  if (apps.length !== 1)
    throw new Error(
      `${SIMULATOR_PRODUCTS} should hold one app, but holds ${
        apps.length === 0 ? 'none' : apps.join(', ')
      }`
    )
  return `${SIMULATOR_PRODUCTS}/${apps[0]}`
}

/**
 * Builds the iOS Maestro variant as the Jenkinsfile does: the app with the
 * Maestro flag, for the iPhone Simulator, zipped and published as the
 * branch app's maestro variant (a download, never installed on a phone).
 */
export async function buildIosMaestro(ctx: Stage) {
  await prepare(ctx, IOS_SECRETS, { maestro: true })
  const version = await stampVersion(
    ctx,
    async (version, build) => await setIosVersion(ctx, version, build)
  )
  await ctx.log.section(
    'CocoaPods',
    async () => await ctx.sh('npm run prepare.ios', { color: false })
  )
  await ctx.log.section(
    'Build for the iPhone Simulator',
    async () =>
      await ctx.sh(
        [
          'xcodebuild build',
          '-workspace ios/edge.xcworkspace',
          '-scheme edge',
          '-sdk iphonesimulator',
          // Apple silicon only, as scripts/deploy.ts builds it: zcash-native
          // ships no x86_64 simulator slice.
          '-arch arm64',
          '-configuration Release',
          '-derivedDataPath build/derivedData'
        ].join(' ')
      )
  )
  await ctx.log.section(
    'Zip the app',
    async () =>
      await ctx.exec('ditto', [
        '-c',
        '-k',
        '--keepParent',
        await simulatorApp(ctx.workspace),
        MAESTRO_ZIP
      ])
  )
  await ctx.log.section(
    'Publish',
    async () =>
      await ctx.publish({
        app: appFor(ctx.run.branch),
        platform: 'ios',
        variant: 'maestro',
        path: MAESTRO_ZIP,
        changelog: `${ctx.run.branch} ${version}`
      })
  )
  return { version }
}

/** Builds the Android Maestro variant: the release APK with the Maestro flag, signed on the signing node. */
export async function buildAndroidMaestro(ctx: Stage) {
  await prepare(ctx, ANDROID_SECRETS, { maestro: true })
  const version = await stampVersion(
    ctx,
    async (version, build) =>
      await setAndroidVersion(ctx.workspace, version, build)
  )
  await ctx.log.section(
    'Build the APK',
    async () => await ctx.sh('./gradlew assembleRelease', { cwd: 'android' })
  )
  await ctx.log.section(
    'Stash the APK for signing',
    async () =>
      await ctx.stash(UNSIGNED_MAESTRO_APK, [`${APK_DIR}/app-release.apk`])
  )
  return { version }
}

/**
 * The APKs a branch's build makes and publishes: the release APK, or on
 * master the universal APK as the default variant and each ABI's APK as a
 * variant with its own version code.
 */
export function androidApks(
  branch: string
): Array<{ file: string; variant?: string }> {
  if (branch !== 'master') return [{ file: 'app-release.apk' }]
  return [
    { file: 'app-universal-release.apk' },
    ...ABI_SPLITS.map(abi => ({ file: `app-${abi}-release.apk`, variant: abi }))
  ]
}

/**
 * The keystore file, key alias and password deploy-config.json gives a
 * branch's Android build, merged as scripts/deploy.ts merges them: the edge
 * entry, then its android entry, then the branch's.
 */
export function androidSigning(
  config: unknown,
  branch: string
): { keystore: string; alias: string; password: string } {
  const at = (value: unknown, key: string): Record<string, unknown> => {
    const out =
      value != null && typeof value === 'object'
        ? (value as Record<string, unknown>)[key]
        : undefined
    return out != null && typeof out === 'object'
      ? (out as Record<string, unknown>)
      : {}
  }
  const edge = at(config, 'edge')
  const android = at(edge, 'android')
  const merged = { ...edge, ...android, ...at(android, branch) }
  const text = (key: string): string => {
    const value = merged[key]
    if (typeof value !== 'string' || value === '')
      throw new Error(`deploy-config.json has no ${key} for ${branch}`)
    return value
  }
  return {
    keystore: text('androidKeyStore'),
    alias: text('androidKeyStoreAlias'),
    password: text('androidKeyStorePassword')
  }
}

/**
 * Signs the stashed APKs with the branch's release keystore on the signing
 * node and publishes them. apksigner replaces the test keystore's signature
 * Gradle gave them; the password reaches it through its environment.
 */
export async function signAndroid(ctx: Stage) {
  await signApks(ctx, {
    stash: UNSIGNED_APKS,
    built: 'build/android/build',
    apks: androidApks(ctx.run.branch)
  })
}

/** Signs the Android Maestro build's APK as the branch's own and publishes it as the maestro variant. */
export async function signAndroidMaestro(ctx: Stage) {
  await signApks(ctx, {
    stash: UNSIGNED_MAESTRO_APK,
    built: 'build/android-maestro/build',
    apks: [{ file: 'app-release.apk', variant: 'maestro' }]
  })
}

/** Signs a stash's APKs with the branch's keystore from deploy-config.json and publishes them. */
async function signApks(
  ctx: Stage,
  options: {
    stash: string
    built: string
    apks: Array<{ file: string; variant?: string }>
  }
): Promise<void> {
  await ctx.log.section(
    'Unstash the APKs',
    async () => await ctx.unstash(options.stash)
  )
  const { version } = await ctx.output<{ version: string }>(options.built)
  const signing = androidSigning(
    JSON.parse(await readFile(ctx.secretFile('deploy-config.json'), 'utf8')),
    ctx.run.branch
  )
  const keystore = ctx.secretFile(signing.keystore)
  const apksigner = `"$ANDROID_HOME/build-tools/${BUILD_TOOLS}/apksigner"`
  const { apks } = options
  await ctx.log.section(`Sign with ${signing.keystore}`, async () => {
    await ctx.sh('mkdir -p signed')
    for (const apk of apks) {
      await ctx.sh(
        `${apksigner} sign --ks "${keystore}" --ks-key-alias "$KEY_ALIAS" --ks-pass env:KEY_PASSWORD --key-pass env:KEY_PASSWORD --out signed/${apk.file} ${APK_DIR}/${apk.file}`,
        { env: { KEY_ALIAS: signing.alias, KEY_PASSWORD: signing.password } }
      )
      await ctx.sh(`${apksigner} verify signed/${apk.file}`)
    }
  })
  const changelog = `${ctx.run.branch} ${version}`
  await ctx.log.section('Publish', async () => {
    for (const apk of apks)
      await ctx.publish({
        app: appFor(ctx.run.branch),
        platform: 'android',
        ...(apk.variant == null ? {} : { variant: apk.variant }),
        path: `signed/${apk.file}`,
        changelog
      })
  })
}

/** The version suffix scripts/gitVersionFile.ts gives a branch. */
export function versionSuffix(branch: string): string {
  const special: Record<string, string> = {
    develop: '-d',
    master: '',
    beta: '',
    coinhub: '',
    staging: '-rc',
    test: '-t',
    yolo: '-yolo',
    'test-cheddar': '-cheddar',
    'test-feta': '-feta',
    'test-gouda': '-gouda',
    'test-halloumi': '-halloumi',
    'test-paneer': '-paneer',
    'test-kraft': '-kraft',
    'test-colby': '-colby',
    'test-string': '-string',
    'test-parm': '-parm',
    'test-swiss': '-swiss'
  }
  if (branch === '') return ''
  if (Object.prototype.hasOwnProperty.call(special, branch))
    return special[branch]!
  return '-' + branch.replace(/[^0-9a-zA-Z]+/g, '-')
}

/**
 * The CLI's version: package.json's, which `edge-cli --version` reports. It
 * takes no branch suffix, unlike the app's: master's release is tagged
 * cli-v<version>.
 */
export async function cliVersion(ctx: Stage): Promise<string> {
  const { version } = JSON.parse(await ctx.fs.read('package.json'))
  return version
}

/** The platform a node is, as Node.js and the CLI's tarballs name it: darwin-arm64, linux-x64. */
export function cliPlatform(node: { os: string; arch: string }): string {
  return `${node.os === 'macos' ? 'darwin' : node.os}-${node.arch}`
}

/**
 * Builds the CLI's release for the platform this stage runs on, and keeps it
 * as the run's app.edge.cli.<platform> artifact: the platform's tarball,
 * install.sh and SHA256SUMS.
 *
 * The package is staged as `npm run publish:cli` stages one, once the
 * offline suites pass against the rollup bundle, with the Node signer
 * compiled here from edgeCliKey.json, the key pair issued for the CLI;
 * publish:cli checks that the staged addon signs with that key.
 * scripts/buildCliRelease.ts then puts this platform's Node.js runtime beside
 * the package. Before anything is kept, install.sh installs the tarball from
 * the release, as `curl … | bash` would from GitHub, and the offline suites
 * run again against the installed CLI. On master the release is also stashed
 * for the release stage.
 */
export async function buildCli(ctx: Stage) {
  await ctx.log.section(
    'Secret files',
    async () => await writeSecrets(ctx, CLI_SECRETS)
  )
  const platform = cliPlatform(ctx.node)
  const version = await cliVersion(ctx)
  const build = ctx.getBuildNumber(CLI_APP)
  await ctx.log.section('Install packages', async () => await ctx.sh('npm ci'))
  await ctx.log.section('Prepare', async () => await ctx.sh('npm run prepare'))
  await ctx.log.section(
    'Offline suites',
    async () => await ctx.sh('npm run test:cli:offline:built')
  )
  await ctx.log.section(
    `Release ${version} (${build}) for ${platform}`,
    async () => {
      await ctx.sh(
        `npm run publish:cli -- --out ${CLI_STAGE} --with-signer --allow-dirty --allow-unpushed --allow-broken-plugins`
      )
      await ctx.sh(
        `node -r sucrase/register scripts/buildCliRelease.ts --package ${CLI_STAGE} --out ${CLI_RELEASE} --platform ${platform}`
      )
    }
  )
  await ctx.log.section('Install and test', async () => {
    await ctx.sh(
      `rm -rf ${CLI_INSTALL} && EDGE_CLI_RELEASE_DIR="$PWD/${CLI_RELEASE}" EDGE_CLI_PREFIX="$PWD/${CLI_INSTALL}/app" EDGE_CLI_BINDIR="$PWD/${CLI_INSTALL}/bin" bash ${CLI_RELEASE}/install.sh --user`
    )
    await ctx.sh(
      `PATH="$PWD/${CLI_INSTALL}/app/current/node/bin:$PATH" EDGE_CLI_BIN="$PWD/${CLI_INSTALL}/app/current/package/edgeCli.js" npm run test:cli:offline`
    )
  })
  await ctx.log.section('Save', async () => {
    await ctx.artifacts.save(`${CLI_APP}.${platform}`, `${CLI_RELEASE}/*`)
    if (ctx.run.branch === 'master')
      await ctx.stash(`${CLI_RELEASE_STASH}-${platform}`, `${CLI_RELEASE}/*`)
  })
  return { version, build, platform }
}

/**
 * Publishes master's CLI release to GitHub as cli-v<version>: each
 * platform's tarball from its stage's stash, install.sh, and one SHA256SUMS
 * over them all.
 */
export async function releaseCli(ctx: Stage) {
  const builds = await Promise.all(
    CLI_STAGES.map(
      async stage =>
        await ctx.output<{ version: string; build: string; platform: string }>(
          stage
        )
    )
  )
  const { version, build } = builds[0]
  if (builds.some(b => b.version !== version || b.build !== build))
    throw new Error(
      `The platforms built different releases: ${builds
        .map(b => `${b.platform} ${b.version} (${b.build})`)
        .join(', ')}`
    )

  const dir = join(ctx.workspace, CLI_RELEASE)
  await mkdir(dir, { recursive: true })
  let installer: Buffer | undefined
  const names: string[] = []
  for (const { platform } of builds) {
    const into = `${CLI_PARTS}/${platform}`
    await ctx.log.section(
      `Unstash ${platform}`,
      async () =>
        await ctx.unstash(`${CLI_RELEASE_STASH}-${platform}`, { into })
    )
    const part = join(ctx.workspace, into, CLI_RELEASE)
    const tarball = `edge-cli-${version}-${platform}.tar.gz`
    await copyFile(join(part, tarball), join(dir, tarball))
    names.push(tarball)
    // Every platform ships the same installer, from the same commit.
    const script = await readFile(join(part, 'install.sh'))
    if (installer != null && !installer.equals(script))
      throw new Error('The platforms built different install.sh files')
    installer = script
  }
  if (installer == null) throw new Error('No platform built the CLI')
  await writeFile(join(dir, 'install.sh'), installer, { mode: 0o755 })
  names.push('install.sh')
  const sums: string[] = []
  for (const name of names) {
    const digest = createHash('sha256')
      .update(await readFile(join(dir, name)))
      .digest('hex')
    sums.push(`${digest}  ${name}`)
  }
  await writeFile(join(dir, 'SHA256SUMS'), sums.join('\n') + '\n')
  const files = [...names, 'SHA256SUMS'].sort().map(name => join(dir, name))

  const { url, published } = await ctx.log.section(
    `GitHub release cli-v${version}`,
    async () =>
      await publishCliRelease({
        repository: CLI_REPOSITORY,
        token: ctx.secret(CLI_RELEASE_TOKEN),
        version,
        build,
        commit: ctx.run.commit,
        files
      })
  )
  ctx.log.info(
    published ? `Published ${url}` : `${url} was already published; kept it`
  )
  return { url, published }
}

/**
 * Publishes the release files as cli-v<version>, which is never marked
 * latest: the repository's latest release is the app's, and install.sh
 * finds the newest cli-v release itself. The files go up to a draft, which
 * is published only once all of them are there, so a release is never seen
 * without its files. A release already published for the version is kept as
 * it is, and a draft an earlier attempt left behind is replaced.
 */
export async function publishCliRelease(options: {
  repository: string
  token: string
  version: string
  build: string
  commit: string
  files: string[]
  fetch?: typeof fetch
}): Promise<{ url: string; published: boolean }> {
  const call = options.fetch ?? fetch
  const tag = `cli-v${options.version}`
  const api = `https://api.github.com/repos/${options.repository}`
  const request = async (
    method: string,
    url: string,
    body?: string | Uint8Array,
    type = 'application/json'
  ): Promise<any> => {
    const response = await call(url, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${options.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body != null ? { 'Content-Type': type } : {})
      },
      ...(body != null ? { body } : {})
    })
    if (!response.ok)
      throw new Error(
        `GitHub answered ${method} ${url} with ${
          response.status
        }: ${await response.text()}`
      )
    return response.status === 204 ? undefined : await response.json()
  }

  const releases: Array<{
    id: number
    tag_name: string
    draft: boolean
    html_url: string
  }> = await request('GET', `${api}/releases?per_page=100`)
  for (const release of releases.filter(r => r.tag_name === tag)) {
    if (!release.draft) return { url: release.html_url, published: false }
    await request('DELETE', `${api}/releases/${release.id}`)
  }

  const draft = await request(
    'POST',
    `${api}/releases`,
    JSON.stringify({
      tag_name: tag,
      target_commitish: options.commit,
      name: `Edge CLI ${options.version}`,
      body: cliReleaseNotes(options.version, options.build, options.commit),
      draft: true,
      make_latest: 'false'
    })
  )
  for (const file of options.files)
    await request(
      'POST',
      `https://uploads.github.com/repos/${options.repository}/releases/${
        draft.id
      }/assets?name=${encodeURIComponent(basename(file))}`,
      await readFile(file),
      'application/octet-stream'
    )
  const release = await request(
    'PATCH',
    `${api}/releases/${draft.id}`,
    JSON.stringify({ draft: false, make_latest: 'false' })
  )
  return { url: release.html_url, published: true }
}

/** The release's notes: what it is, and how to install it. */
export function cliReleaseNotes(
  version: string,
  build: string,
  commit: string
): string {
  return [
    `The Edge CLI ${version}, Mason build ${build}, from ${commit.slice(
      0,
      9
    )}.`,
    '',
    'Install it on macOS or Linux, arm64 or x64; it brings its own Node.js:',
    '',
    '```sh',
    `curl -fsSL https://github.com/${CLI_REPOSITORY}/releases/download/cli-v${version}/install.sh | bash -s -- --version ${version}`,
    '```',
    '',
    'Add `--user` to install under ~/.edge-cli/app and ~/.local/bin without sudo, or `uninstall` to remove it. See docs/EDGE_CLI.md for the rest.'
  ].join('\n')
}
