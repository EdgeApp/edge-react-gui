import type { Setup, Stage } from '@mason/types'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

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
// archive is built without code signing until the master holds Edge's
// Apple team. Nothing is sent to the stores.
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
// This needs a Mason master with stage configs, ctx.writeSecretFile,
// build-number blocks, published variants, node selector lists, the
// cocoapods and androidLicenses tools, and the setup label (so the signing
// node, which lacks it, never runs a branch's setup).

const APP = 'co.edgesecure.app'

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
  m.buildNumber(APP, {
    format: 'YYMMDDCC',
    timeZone: 'America/Los_Angeles',
    block: m.branch === 'master' ? 3 : 1
  })

  // `npm run prepare` makes the config and API signer it needs without
  // secrets, so the tests run on any free machine.
  m.stage('test', {
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
  m.parallel(
    'build',
    {
      ios: {
        on: MAC,
        tools: { node: '22', xcode: '>=26', cocoapods: '1.16.2' },
        configs,
        secrets: IOS_SECRETS,
        env,
        ...limits,
        buildNumbers: [APP],
        run: buildIos
      },
      // Built on a pool machine, then signed on the local network.
      android: [
        {
          name: 'build',
          // Gradle and the Android SDK run on either; Linux is cheaper.
          on: [LINUX, MAC],
          tools: {
            node: '22',
            java: '17',
            // Library modules still compile against 35.
            android: [
              'platforms;android-36',
              'platforms;android-35',
              `build-tools;${BUILD_TOOLS}`,
              'build-tools;35.0.0',
              'ndk;27.1.12297006',
              'cmake;3.22.1'
            ],
            androidLicenses: 'accept'
          },
          configs,
          secrets: ANDROID_SECRETS,
          env,
          ...limits,
          buildNumbers: [APP],
          run: buildAndroid
        },
        {
          name: 'sign',
          on: ANDROID_SIGNER,
          // Only the stashed APKs: no repository on the signing node.
          checkout: false,
          tools: {
            java: '17',
            android: [`build-tools;${BUILD_TOOLS}`],
            androidLicenses: 'accept'
          },
          configs,
          secrets: SIGNING_SECRETS,
          timeout: '30m',
          activityTimeout: '10m',
          publishes: [APP],
          run: signAndroid
        }
      ]
    },
    { failFast: false }
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
async function prepare(ctx: Stage, secrets: string[]): Promise<void> {
  await ctx.log.section(
    'Secret files',
    async () => await writeSecrets(ctx, secrets)
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
  const build = ctx.getBuildNumber(APP)
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
  await stampVersion(
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
    async () =>
      await ctx.artifacts.save('ios-archive', 'build/edge.xcarchive/**')
  )
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
  await ctx.log.section(
    'Unstash the APKs',
    async () => await ctx.unstash(UNSIGNED_APKS)
  )
  const { version } = await ctx.output<{ version: string }>(
    'build/android/build'
  )
  const signing = androidSigning(
    JSON.parse(await readFile(ctx.secretFile('deploy-config.json'), 'utf8')),
    ctx.run.branch
  )
  const keystore = ctx.secretFile(signing.keystore)
  const apksigner = `"$ANDROID_HOME/build-tools/${BUILD_TOOLS}/apksigner"`
  const apks = androidApks(ctx.run.branch)
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
        app: APP,
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
