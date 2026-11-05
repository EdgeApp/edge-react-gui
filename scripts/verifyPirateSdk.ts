// This script gates the Pirate Chain (ARRR) native wallet packages.
//
// Run it as `node -r sucrase/register ./scripts/verifyPirateSdk.ts`
//
// The `react-native-pirate-wallet*` packages ship prebuilt native code
// (JNI libraries and xcframeworks) that links straight into the app process,
// next to the keys of every wallet. The lockfile only proves that the bytes
// did not change since somebody ran `npm install`, so this script also
// checks where those bytes came from.
//
// `pirateSdkPins.json` records, for every Pirate package in the lockfile,
// the exact version and integrity hash that a reviewer approved.
// Any lockfile drift fails this script until the pins are updated in the
// same PR, which puts the change in front of a human.
//
// Each pinned package is then checked by one of two methods:
//
// - `npm-attestation`: the registry's SLSA provenance must bind the
//   lockfile hash to the pinned upstream repository, workflow, tag, and commit.
// - `release-asset`: for a package published without provenance,
//   the downloaded tarball must match the pinned sha256, which is the hash
//   of the same file inside the upstream release's signed artifact bundle.
//
// Finally, `npm audit signatures` cryptographically verifies the registry
// signatures and attestations of the installed Pirate packages.
//
// To approve a new upstream release, update `pirateSdkPins.json`:
// 1. Take `tag` and `commit` from the provenance of the new version.
// 2. For `release-asset` packages, download the tarball from the release's
//    `react-native-pirate-wallet-plugin-artifacts` zip, confirm that zip is
//    listed in the release's `sha256sum` file, and verify that file with
//    `gpg --verify sha256sum-vX.Y.Z.txt.sig sha256sum-vX.Y.Z.txt`. The
//    release key must show fingerprint
//    E4FB2399AECCF9B9447DED472CE65343401553A6, which upstream publishes in
//    `release-signing/README`. Then pin the tarball's sha256.

import { execFileSync } from 'child_process'
import {
  asArray,
  asEither,
  asJSON,
  asMaybe,
  asObject,
  asString,
  asValue
} from 'cleaners'
import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import path from 'path'

const PACKAGE_PREFIX = 'react-native-pirate-wallet'
const LOCK_PREFIX = `node_modules/${PACKAGE_PREFIX}`
const SLSA_PREDICATE = 'https://slsa.dev/provenance/v1'

const asPin = asObject({
  version: asString,
  integrity: asString,
  provenance: asEither(asValue('npm-attestation'), asValue('release-asset')),
  sha256: asMaybe(asString)
})

const asPins = asJSON(
  asObject({
    repository: asString,
    workflow: asString,
    tag: asString,
    commit: asString,
    packages: asObject(asPin)
  })
)

const asLockfile = asJSON(
  asObject({
    packages: asObject(
      asObject({
        version: asMaybe(asString),
        resolved: asMaybe(asString),
        integrity: asMaybe(asString)
      })
    )
  })
)

const asAttestations = asObject({
  attestations: asArray(
    asObject({
      predicateType: asString,
      bundle: asObject({
        dsseEnvelope: asObject({ payload: asString })
      })
    })
  )
})

const asProvenance = asObject({
  subject: asArray(
    asObject({
      name: asString,
      digest: asObject({ sha512: asString })
    })
  ),
  predicate: asObject({
    buildDefinition: asObject({
      externalParameters: asObject({
        workflow: asObject({
          ref: asString,
          repository: asString,
          path: asString
        })
      }),
      resolvedDependencies: asArray(
        asObject({ digest: asObject({ gitCommit: asMaybe(asString) }) })
      )
    })
  })
})

const asProvenanceJson = asJSON(asProvenance)

const asExecError = asObject({ stdout: asString })

const asAuditResult = asJSON(
  asObject({
    invalid: asArray(asObject({ name: asString })),
    missing: asArray(asObject({ name: asString }))
  })
)

type Pins = ReturnType<typeof asPins>
type Pin = ReturnType<typeof asPin>

async function main(): Promise<void> {
  const root = path.join(__dirname, '..')
  const lockfile = asLockfile(
    readFileSync(path.join(root, 'package-lock.json'), 'utf8')
  )
  const pins = asPins(
    readFileSync(path.join(__dirname, 'pirateSdkPins.json'), 'utf8')
  )
  const errors: string[] = []

  const locked = Object.keys(lockfile.packages).filter(key =>
    key.startsWith(LOCK_PREFIX)
  )
  const lockedNames = locked.map(key => key.slice('node_modules/'.length))
  for (const name of Object.keys(pins.packages)) {
    if (!lockedNames.includes(name)) {
      errors.push(`${name}: pinned but missing from package-lock.json`)
    }
  }

  for (const key of locked) {
    const name = key.slice('node_modules/'.length)
    const entry = lockfile.packages[key]
    const pin = pins.packages[name]
    if (pin == null) {
      errors.push(`${name}: not listed in pirateSdkPins.json`)
      continue
    }
    if (entry.version !== pin.version || entry.integrity !== pin.integrity) {
      errors.push(
        `${name}: lockfile has ${entry.version} ${String(entry.integrity)}, ` +
          `pin has ${pin.version} ${pin.integrity}`
      )
      continue
    }
    const problems =
      pin.provenance === 'npm-attestation'
        ? await checkAttestation(name, pin, pins)
        : await checkReleaseAsset(name, pin, entry.resolved)
    for (const problem of problems) errors.push(`${name}: ${problem}`)
    if (problems.length === 0) console.log(`ok ${name}@${pin.version}`)
  }

  errors.push(...auditSignatures(root, lockedNames))

  if (errors.length > 0) {
    console.error(errors.map(error => `FAIL ${error}`).join('\n'))
    process.exit(1)
  }
}

/**
 * Checks that the registry's SLSA provenance binds this exact tarball
 * to the pinned upstream workflow run.
 */
async function checkAttestation(
  name: string,
  pin: Pin,
  pins: Pins
): Promise<string[]> {
  const url = `https://registry.npmjs.org/-/npm/v1/attestations/${name}@${pin.version}`
  const response = await fetch(url)
  if (!response.ok) return [`no attestations (HTTP ${response.status})`]
  const { attestations } = asAttestations(await response.json())
  const slsa = attestations.find(item => item.predicateType === SLSA_PREDICATE)
  if (slsa == null) return ['no SLSA provenance attestation']

  const payload = Buffer.from(slsa.bundle.dsseEnvelope.payload, 'base64')
  const statement = asProvenanceJson(payload.toString('utf8'))
  const { externalParameters, resolvedDependencies } =
    statement.predicate.buildDefinition
  const { workflow } = externalParameters

  const problems: string[] = []
  const lockHash = Buffer.from(pin.integrity.replace(/^sha512-/, ''), 'base64')
  const subject = statement.subject.find(
    item => item.name === `pkg:npm/${name}@${pin.version}`
  )
  if (subject == null || subject.digest.sha512 !== lockHash.toString('hex')) {
    problems.push('provenance subject does not match the lockfile hash')
  }
  if (workflow.repository !== pins.repository) {
    problems.push(`built from ${workflow.repository}`)
  }
  if (workflow.path !== pins.workflow) {
    problems.push(`built by workflow ${workflow.path}`)
  }
  if (workflow.ref !== `refs/tags/${pins.tag}`) {
    problems.push(`built from ref ${workflow.ref}`)
  }
  if (!resolvedDependencies.some(dep => dep.digest.gitCommit === pins.commit)) {
    problems.push(`built from a commit other than ${pins.commit}`)
  }
  return problems
}

/**
 * Checks a package that has no provenance by hashing the tarball itself.
 */
async function checkReleaseAsset(
  name: string,
  pin: Pin,
  resolved: string | undefined
): Promise<string[]> {
  if (pin.sha256 == null) return ['release-asset pin has no sha256']
  if (resolved == null) return ['lockfile entry has no resolved URL']
  const response = await fetch(resolved)
  if (!response.ok) return [`download failed (HTTP ${response.status})`]
  const bytes = Buffer.from(await response.arrayBuffer())

  const problems: string[] = []
  const sha512 = `sha512-${createHash('sha512').update(bytes).digest('base64')}`
  if (sha512 !== pin.integrity) {
    problems.push('downloaded tarball does not match the lockfile hash')
  }
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  if (sha256 !== pin.sha256) {
    problems.push(`tarball sha256 is ${sha256}, pin has ${pin.sha256}`)
  }
  return problems
}

/**
 * Runs `npm audit signatures`, which verifies the Sigstore bundles and
 * registry signatures of the installed packages, and keeps only the
 * Pirate packages from its report. Optional platform packages that npm
 * did not install on this machine are not covered here, but their
 * provenance is still bound to the lockfile by `checkAttestation`.
 */
function auditSignatures(root: string, names: string[]): string[] {
  let stdout: string
  try {
    stdout = execFileSync('npm', ['audit', 'signatures', '--json'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit']
    })
  } catch (error: unknown) {
    // npm exits non-zero when it finds invalid signatures, but still prints:
    const execError = asMaybe(asExecError)(error)
    if (execError == null) {
      return [`npm audit signatures failed: ${String(error)}`]
    }
    stdout = execError.stdout
  }
  const result = asAuditResult(stdout)
  return [...result.invalid, ...result.missing]
    .filter(item => names.includes(item.name))
    .map(item => `${item.name}: failed npm audit signatures`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
