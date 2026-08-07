/**
 * Generates XOR-split native C sources embedding apiKey / apiSecret from edgeKey.json.
 *
 * Bundle / application ID for the runtime XOR pad is read from the post-patch
 * project files (must match):
 *   - android/app/build.gradle → applicationId (not namespace)
 *   - ios/edge.xcodeproj/project.pbxproj → PRODUCT_BUNDLE_IDENTIFIER
 *
 * Outputs (gitignored):
 *   ios/EdgeApiSecret.c + ios/EdgeApiSecret.h
 *   android/app/src/main/cpp/edge_api_secret.c (+ header)
 *   native/edge-api-signer/node/edge_api_secret.c (+ header)
 *
 * Stub secret (`00`) only when EDGE_API_SIGNER_ALLOW_STUB=1 (used by prepare.sh
 * before Jenkins secretFiles). Native generate tasks omit the flag so missing
 * edgeKey.json fails closed.
 */

import { createHash, randomBytes } from 'crypto'
import fs from 'fs'
import path from 'path'

const ROOT = path.join(__dirname, '..')
const SHARD_COUNT = 6 // 5 random pads + 1 stored remainder (after runtime pad)
export const MAX_SECRET_LEN = 32
const STAMP_PATH = path.join(ROOT, '.edgeApiSigner.stamp')
const ANDROID_CPP = path.join(ROOT, 'android/app/src/main/cpp')
const NODE_CPP = path.join(ROOT, 'native/edge-api-signer/node')
const NODE_SOURCE = path.join(NODE_CPP, 'edge_api_secret.c')
const NODE_HEADER = path.join(NODE_CPP, 'edge_api_secret.h')
const OUTPUT_PATHS = {
  iosSource: path.join(ROOT, 'ios/EdgeApiSecret.c'),
  iosHeader: path.join(ROOT, 'ios/EdgeApiSecret.h'),
  androidSource: path.join(ANDROID_CPP, 'edge_api_secret.c'),
  androidHeader: path.join(ANDROID_CPP, 'edge_api_secret.h')
}
export const API_KEY_PLACEHOLDER =
  'Error: Set up edgeKey.json apiKey & re-run scripts/makeApiSigner.ts'
const MISSING_SECRET_MESSAGE =
  'edgeKey.json apiSecret missing. Copy edgeKey.example.json to edgeKey.json ' +
  'and fill in apiKey / apiSecret (Jenkins gets these from scripts/secretFiles.ts). ' +
  'To compile without working signing, set EDGE_API_SIGNER_ALLOW_STUB=1.'

function parseHexSecret(hex: string): Buffer {
  const cleaned = hex.replace(/^0x/i, '').trim()
  if (!/^[0-9a-fA-F]*$/.test(cleaned) || cleaned.length % 2 !== 0) {
    throw new Error('apiSecret must be even-length hex')
  }
  const buf = Buffer.from(cleaned, 'hex')
  if (buf.length === 0 || buf.length > MAX_SECRET_LEN) {
    throw new Error(
      `apiSecret length must be 1..${MAX_SECRET_LEN} bytes (got ${buf.length})`
    )
  }
  return buf
}

function cByteArray(name: string, bytes: Buffer): string {
  const body = Array.from(bytes)
    .map(b => `0x${b.toString(16).padStart(2, '0')}`)
    .join(', ')
  return `static const unsigned char ${name}[${bytes.length}] = { ${body} };\n`
}

/**
 * Read Android applicationId (not namespace) from build.gradle.
 */
export function readAndroidApplicationId(gradlePath: string): string {
  const text = fs.readFileSync(gradlePath, 'utf8')
  const match = /applicationId\s+"([^"]+)"/.exec(text)
  if (match == null) {
    throw new Error(`applicationId not found in ${gradlePath}`)
  }
  return match[1]
}

/**
 * Read PRODUCT_BUNDLE_IDENTIFIER from Xcode project.pbxproj.
 * All Debug/Release entries must agree.
 */
export function readIosBundleId(pbxPath: string): string {
  const text = fs.readFileSync(pbxPath, 'utf8')
  const matches = [
    ...text.matchAll(/PRODUCT_BUNDLE_IDENTIFIER\s*=\s*([^;]+);/g)
  ].map(m => m[1].trim().replace(/^"|"$/g, ''))
  if (matches.length === 0) {
    throw new Error(`PRODUCT_BUNDLE_IDENTIFIER not found in ${pbxPath}`)
  }
  const unique = [...new Set(matches)]
  if (unique.length !== 1) {
    throw new Error(
      `Conflicting PRODUCT_BUNDLE_IDENTIFIER values in ${pbxPath}: ${unique.join(
        ', '
      )}`
    )
  }
  return unique[0]
}

/**
 * Canonical app id after any deployPatches: Android applicationId and iOS
 * PRODUCT_BUNDLE_IDENTIFIER must match.
 */
export function readBundleId(root: string = ROOT): string {
  const androidId = readAndroidApplicationId(
    path.join(root, 'android/app/build.gradle')
  )
  const iosId = readIosBundleId(
    path.join(root, 'ios/edge.xcodeproj/project.pbxproj')
  )
  if (androidId !== iosId) {
    throw new Error(
      `Bundle ID mismatch: Android applicationId="${androidId}" vs iOS PRODUCT_BUNDLE_IDENTIFIER="${iosId}"`
    )
  }
  return androidId
}

function makeSource(apiKey: string, secret: Buffer, bundleId: string): string {
  const len = secret.length
  const runtimePad = createHash('sha256')
    .update(bundleId, 'utf8')
    .digest()
    .subarray(0, len)

  // P1..P5 random; stored = S xor P1..P5 xor runtimePad
  const pads: Buffer[] = []
  for (let i = 0; i < SHARD_COUNT - 1; i++) {
    pads.push(randomBytes(len))
  }
  const stored = Buffer.alloc(len)
  for (let i = 0; i < len; i++) {
    let v = secret[i] ^ runtimePad[i]
    for (const p of pads) v ^= p[i]
    stored[i] = v
  }
  pads.push(stored)

  // Decoy arrays (same shape); touched below so -O2 cannot DCE them.
  const decoys = [randomBytes(len), randomBytes(len), randomBytes(len)]

  const shardNames = ['ea_s0', 'ea_s1', 'ea_s2', 'ea_s3', 'ea_s4', 'ea_s5']
  const decoyNames = ['ea_d0', 'ea_d1', 'ea_d2']

  // JSON.stringify doubles as a C string escaper only while the key stays
  // printable ASCII: \uXXXX escapes are not valid C.
  if (!/^[\x20-\x7e]+$/.test(apiKey)) {
    throw new Error('apiKey must be printable ASCII')
  }

  let out = `/* auto-generated by scripts/makeApiSigner.ts — do not edit */
#include <stddef.h>
#include <stdint.h>
#include <string.h>
#include "edge_hmac.h"
#include "edge_api_sign.h"

#define EDGE_API_SECRET_LEN ${len}

`
  for (let i = 0; i < shardNames.length; i++) {
    out += cByteArray(shardNames[i], pads[i])
    if (i < decoyNames.length) {
      out += cByteArray(decoyNames[i], decoys[i])
    }
  }

  out += `
static const char ea_api_key[] = ${JSON.stringify(apiKey)};

const char *edge_api_key(void) {
  return ea_api_key;
}

/* Opaque accessors so the arrays are not one contiguous blob in .rodata order alone. */
static void ea_load0(uint8_t *o) { memcpy(o, ea_s0, EDGE_API_SECRET_LEN); }
static void ea_load1(uint8_t *o) { memcpy(o, ea_s1, EDGE_API_SECRET_LEN); }
static void ea_load2(uint8_t *o) { memcpy(o, ea_s2, EDGE_API_SECRET_LEN); }
static void ea_load3(uint8_t *o) { memcpy(o, ea_s3, EDGE_API_SECRET_LEN); }
static void ea_load4(uint8_t *o) { memcpy(o, ea_s4, EDGE_API_SECRET_LEN); }
static void ea_load5(uint8_t *o) { memcpy(o, ea_s5, EDGE_API_SECRET_LEN); }

int edge_api_hmac_sign(
  const uint8_t *message,
  size_t message_len,
  const char *bundle_id,
  uint8_t signature_out[32]
) {
  uint8_t secret[EDGE_API_SECRET_LEN];
  uint8_t tmp[EDGE_API_SECRET_LEN];
  uint8_t runtime_pad[32];
  edge_sha256_ctx sha;
  size_t i;
  size_t pad_len;
  volatile uint8_t decoy_sink;

  if (message == NULL || signature_out == NULL || bundle_id == NULL) {
    return 1;
  }

  /* Keep decoy symbols live under -O2 / LTO. */
  decoy_sink = (uint8_t)(ea_d0[0] ^ ea_d1[0] ^ ea_d2[0]);
  (void)decoy_sink;

  memset(secret, 0, sizeof(secret));
  ea_load0(tmp); for (i = 0; i < EDGE_API_SECRET_LEN; ++i) secret[i] ^= tmp[i];
  ea_load1(tmp); for (i = 0; i < EDGE_API_SECRET_LEN; ++i) secret[i] ^= tmp[i];
  ea_load2(tmp); for (i = 0; i < EDGE_API_SECRET_LEN; ++i) secret[i] ^= tmp[i];
  ea_load3(tmp); for (i = 0; i < EDGE_API_SECRET_LEN; ++i) secret[i] ^= tmp[i];
  ea_load4(tmp); for (i = 0; i < EDGE_API_SECRET_LEN; ++i) secret[i] ^= tmp[i];
  ea_load5(tmp); for (i = 0; i < EDGE_API_SECRET_LEN; ++i) secret[i] ^= tmp[i];

  edge_sha256_init(&sha);
  edge_sha256_update(&sha, (const uint8_t *)bundle_id, strlen(bundle_id));
  edge_sha256_final(&sha, runtime_pad);
  pad_len = EDGE_API_SECRET_LEN < 32 ? EDGE_API_SECRET_LEN : 32;
  for (i = 0; i < pad_len; ++i) secret[i] ^= runtime_pad[i];

  edge_hmac_sha256(secret, EDGE_API_SECRET_LEN, message, message_len, signature_out);

  edge_secure_wipe(secret, sizeof(secret));
  edge_secure_wipe(tmp, sizeof(tmp));
  edge_secure_wipe(runtime_pad, sizeof(runtime_pad));
  edge_secure_wipe(&sha, sizeof(sha));
  return 0;
}
`
  return out
}

/**
 * Declares nothing itself: consumers include edge_api_sign.h directly. It
 * exists so the Xcode phase has a stable output path to track alongside the
 * generated source.
 */
function makeHeader(): string {
  return `/* auto-generated by scripts/makeApiSigner.ts — do not edit */
#ifndef EDGE_API_SECRET_GEN_H
#define EDGE_API_SECRET_GEN_H
#include "edge_api_sign.h"
#endif
`
}

/**
 * Write through a temp file so a concurrent Gradle and Xcode generate cannot
 * leave a half-written source for the compiler to read.
 */
function writeFile(filePath: string, contents: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const tempPath = `${filePath}.${process.pid}.tmp`
  fs.writeFileSync(tempPath, contents)
  fs.renameSync(tempPath, filePath)
  console.log('wrote', path.relative(ROOT, filePath))
}

function anyOutputsExist(): boolean {
  return Object.values(OUTPUT_PATHS).some(p => fs.existsSync(p))
}

/** True when all four generated secret sources exist (complete tree). */
export function signerOutputsExist(): boolean {
  return Object.values(OUTPUT_PATHS).every(p => fs.existsSync(p))
}

function outputsExist(): boolean {
  return signerOutputsExist()
}

function readStampBundleId(): string | undefined {
  if (!fs.existsSync(STAMP_PATH)) return undefined
  const lines = fs.readFileSync(STAMP_PATH, 'utf8').split('\n')
  // stamp format: <sha256>\n<bundleId>\n (older stamps had only the hash)
  return lines.length >= 2 && lines[1] !== '' ? lines[1] : undefined
}

/**
 * Read the public apiKey embedded in a generated secret source so EdgeApiKey
 * can stay in lockstep when edgeKey.json is incomplete.
 */
export function readEmbeddedSignerApiKey(): string | undefined {
  for (const filePath of [OUTPUT_PATHS.iosSource, OUTPUT_PATHS.androidSource]) {
    if (!fs.existsSync(filePath)) continue
    const text = fs.readFileSync(filePath, 'utf8')
    const match =
      /static const char ea_api_key\[\] = ("(?:\\.|[^"\\])*");/.exec(text)
    if (match == null) continue
    try {
      const value = JSON.parse(match[1])
      if (typeof value === 'string' && value !== '') return value
    } catch {
      // fall through
    }
  }
  return undefined
}

function main(): void {
  const mobileBundleId = readBundleId()
  const nodeBundleId = 'co.edgesecure.app'
  console.log('bundleId', mobileBundleId)
  console.log('nodeBundleId', nodeBundleId)

  let apiKey = API_KEY_PLACEHOLDER
  let secretHex = ''
  try {
    const edgeKey = require('../edgeKey.json')
    if (typeof edgeKey.apiKey === 'string' && edgeKey.apiKey !== '') {
      apiKey = edgeKey.apiKey
    }
    if (typeof edgeKey.apiSecret === 'string' && edgeKey.apiSecret !== '') {
      secretHex = edgeKey.apiSecret
    }
  } catch (e: unknown) {
    // A malformed edgeKey.json must not look like a missing one.
    console.log(
      'warn: could not read edgeKey.json:',
      e instanceof Error ? e.message : String(e)
    )
  }

  let missingSecret = false
  if (secretHex === '') {
    if (process.env.EDGE_API_SIGNER_ALLOW_STUB !== '1') {
      throw new Error(MISSING_SECRET_MESSAGE)
    }
    missingSecret = true
    for (const output of [NODE_SOURCE, NODE_HEADER]) {
      if (fs.existsSync(output)) fs.unlinkSync(output)
    }
    // Keep a complete existing tree only when its stamp still matches this
    // bundleId — deployPatches can rewrite applicationId after a prior stub.
    if (outputsExist() && readStampBundleId() === mobileBundleId) {
      console.log(
        'warn: apiSecret missing; keeping existing EdgeApiSecret outputs'
      )
      return
    }
    if (outputsExist()) {
      console.log(
        'warn: apiSecret missing; bundleId changed since last generate — regenerating stub'
      )
    } else if (anyOutputsExist()) {
      console.log(
        'warn: apiSecret missing; regenerating incomplete EdgeApiSecret outputs as stub'
      )
    }
    // First-time compile stub only — do not pair a real apiKey with secret 00.
    apiKey = API_KEY_PLACEHOLDER
    secretHex = '00'
    console.log(
      'warn: apiSecret missing; emitting mobile stub and skipping Node signer'
    )
  } else if (apiKey === API_KEY_PLACEHOLDER) {
    // A real secret with no apiKey would sign correctly while advertising the
    // placeholder in Authorization / getApiKey — refuse that pairing.
    throw new Error(
      'edgeKey.json apiKey missing while apiSecret is present. ' +
        'Copy edgeKey.example.json to edgeKey.json and fill in both fields.'
    )
  }

  // Skip rewrite when inputs unchanged so random shards do not force native rebuilds.
  // The generator's own source is an input: editing the emitted C must
  // invalidate outputs that are otherwise byte-identical in their inputs.
  const inputStamp = createHash('sha256')
    .update(apiKey, 'utf8')
    .update('\0')
    .update(secretHex, 'utf8')
    .update('\0')
    .update(mobileBundleId, 'utf8')
    .update('\0')
    .update(fs.readFileSync(__filename))
    .digest('hex')
  if (
    outputsExist() &&
    (missingSecret ||
      (fs.existsSync(NODE_SOURCE) && fs.existsSync(NODE_HEADER))) &&
    fs.existsSync(STAMP_PATH) &&
    fs.readFileSync(STAMP_PATH, 'utf8').split('\n')[0].trim() === inputStamp
  ) {
    console.log('makeApiSigner: inputs unchanged, skipping rewrite')
    return
  }

  const secret = parseHexSecret(secretHex)
  const mobileSource = makeSource(apiKey, secret, mobileBundleId)
  const nodeSource = makeSource(apiKey, secret, nodeBundleId)
  const header = makeHeader()

  writeFile(OUTPUT_PATHS.iosSource, mobileSource)
  writeFile(OUTPUT_PATHS.iosHeader, header)
  writeFile(OUTPUT_PATHS.androidSource, mobileSource)
  writeFile(OUTPUT_PATHS.androidHeader, header)

  if (!missingSecret) {
    writeFile(NODE_SOURCE, nodeSource)
    writeFile(NODE_HEADER, header)
  }

  fs.writeFileSync(STAMP_PATH, `${inputStamp}\n${mobileBundleId}\n`)

  // Stub embeds the placeholder apiKey; rewrite EdgeApiKey immediately so a
  // later makeNativeHeaders keep-existing pass cannot leave a prior real key.
  if (apiKey === API_KEY_PLACEHOLDER) {
    // Dynamic require avoids a load-time cycle (makeNativeHeaders imports us).
    require('./makeNativeHeaders').writeStubEdgeApiKeyHeaders()
  }
}

// Importing this module (secretFiles.ts reuses MAX_SECRET_LEN) must not
// generate anything.
if (require.main === module) {
  try {
    main()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}
