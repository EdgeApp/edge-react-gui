import type { Setup, Stage } from '@mason/types'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// Builds Edge for iOS on a macOS arm64 machine and for Android on a Linux
// x86_64 machine. Both come from the master's temporary cloud pools: a
// stage's node type is what starts a pool machine, and its os and arch
// keep it on the right kind of machine.
//
// Each run has one build number, which both platforms stamp into their
// native projects themselves (setAndroidVersion, setIosVersion), with the
// version package.json and the branch give.
//
// These builds are not yet signed for distribution or uploaded: the iOS
// archive is built without code signing, and the Android release APKs carry
// the repository's test keystore (android/app/airbitz.keystore), as a plain
// `assembleRelease` does. Signing moves to the master once it holds Edge's
// Apple team and Android keystore.
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
// is not one: Mason replaces fastlane. deploy-config.json and the keystores
// are secrets on the master too, but no stage declares them until signing
// lands, on a signing node, so they never reach a pool machine for nothing.
// Both native builds embed the API key and secret from edgeKey.json and fail
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
// This needs a Mason master with stage configs and ctx.writeSecretFile.

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
/** Branches with their own variants of some secret files. */
const CONFIG_BRANCHES = ['develop', 'beta', 'coinhub', 'airbitz', 'yolo']

/** The build configs of a branch's stages. */
export function configsFor(branch: string): string[] {
  return CONFIG_BRANCHES.includes(branch) ? [branch] : []
}

/** The machines the pools make: Macs for Xcode, Linux for the rest. */
const MAC = { type: 'macos-arm64', os: 'macos', arch: 'arm64' } as const
const LINUX = { type: 'linux-x86', os: 'linux', arch: 'x64' } as const

export function setup(m: Setup) {
  m.apiVersion(1)
  // Date and a counter (26102901), stepping by 1; iOS and Android of one run
  // share the number. android/app/build.gradle gives the split APKs this
  // number +1 and +2 (Jenkins steps by 3 to leave room for them), so before
  // these Android builds go to Play, the split APKs need version codes that
  // cannot meet the next build's.
  m.buildNumber(APP, { format: 'YYMMDDCC', timeZone: 'America/Los_Angeles' })

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
        tools: { node: '22', xcode: '>=26', brew: ['cocoapods'] },
        configs,
        secrets: IOS_SECRETS,
        env,
        ...limits,
        buildNumbers: [APP],
        run: buildIos
      },
      android: {
        on: LINUX,
        tools: {
          node: '22',
          java: '17',
          android: [
            'platforms;android-36',
            'build-tools;36.1.0',
            'ndk;27.1.12297006',
            'cmake;3.22.1'
          ]
        },
        configs,
        secrets: ANDROID_SECRETS,
        env,
        ...limits,
        buildNumbers: [APP],
        run: buildAndroid
      }
    },
    { failFast: false }
  )
}

/**
 * Prepares the checkout as the Jenkinsfile does: the secret files, packages,
 * the branch's deploy patches and Sentry keys, then npm's `prepare` (config,
 * patched packages, generated signer and contract code). Each platform
 * stamps its own version.
 */
async function prepare(ctx: Stage, secrets: string[]): Promise<void> {
  await writeSecrets(ctx, secrets)
  // The repository's .npmrc turns install scripts off, so `prepare` runs below.
  await ctx.sh('npm ci')
  await ctx.exec('node', [
    '-r',
    'sucrase/register',
    './scripts/patchFiles.ts',
    'edge',
    ctx.run.branch
  ])
  await ctx.sh('npm run prepare')
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
  await setIosVersion(ctx, await versionOf(ctx), ctx.getBuildNumber(APP))
  await ctx.sh('npm run prepare.ios')
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
  await ctx.artifacts.save('ios-archive', 'build/edge.xcarchive/**')
}

export async function buildAndroid(ctx: Stage) {
  await prepare(ctx, ANDROID_SECRETS)
  await setAndroidVersion(
    ctx.workspace,
    await versionOf(ctx),
    ctx.getBuildNumber(APP)
  )
  await ctx.sh('./gradlew assembleRelease', { cwd: 'android' })
  await ctx.artifacts.save(
    'android-apks',
    'android/app/build/outputs/apk/release/*.apk'
  )
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
