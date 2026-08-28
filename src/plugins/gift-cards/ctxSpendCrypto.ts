import { secp256k1 } from '@noble/curves/secp256k1'
import { sha256 } from '@noble/hashes/sha2'
import { base16, base64url } from 'rfc4648'

/**
 * Pure implementation of the CTX spend-api pubkey auth protocol.
 *
 * Deliberately free of React Native imports so the wire format can be unit
 * tested in Node. Entropy and storage live in `ctxSpendAuth.ts`.
 *
 * Reference: https://github.com/CTX-com/spend-api-pubkey-auth-demo
 */

/** Length of a secp256k1 private key, in bytes. */
export const CTX_SPEND_PRIVATE_KEY_LENGTH = 32

/**
 * btcec's `RecoverCompact` reads the recovery id out of a leading header byte:
 * 27 marks the base, +4 marks a compressed public key.
 */
const RECOVERABLE_HEADER_BASE = 27
const RECOVERABLE_HEADER_COMPRESSED = 4

export const bytesToHex = (bytes: Uint8Array): string =>
  base16.stringify(bytes).toLowerCase()

export const hexToBytes = (hex: string): Uint8Array =>
  base16.parse(hex.toUpperCase())

/**
 * Encode a number as a big-endian uint64.
 *
 * Written against `number` rather than `BigInt` on purpose: Hermes falls back
 * to a `big-integer` shim when BigInt is missing, and `DataView.setBigUint64`
 * rejects that shim. Nonces are small counters, so `number` is exact here, but
 * the range is asserted rather than assumed.
 */
export const uint64BE = (value: number): Uint8Array => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`CTX login nonce out of range: ${value}`)
  }
  const bytes = new Uint8Array(8)
  let remaining = value
  for (let index = 7; index >= 0; index--) {
    bytes[index] = remaining % 256
    remaining = Math.floor(remaining / 256)
  }
  return bytes
}

/**
 * The digest the server expects a signature over: `sha256(uint64BE(nonce))`.
 */
export const makeLoginNonceHash = (nonce: number): Uint8Array =>
  sha256(uint64BE(nonce))

/** Compressed public key for a private key, hex encoded. */
export const getPublicKeyHex = (privateKey: Uint8Array): string =>
  bytesToHex(secp256k1.getPublicKey(privateKey, true))

/**
 * Sign a login nonce, producing the 65-byte recoverable signature the server
 * verifies: `[27 + recoveryId + 4] || R(32) || S(32)`, hex encoded.
 *
 * The server recovers the public key from this signature rather than being
 * told it, which is what makes the second `/login` leg prove key ownership.
 */
export const signLoginNonce = (
  privateKey: Uint8Array,
  nonce: number
): string => {
  const signature = secp256k1.sign(makeLoginNonceHash(nonce), privateKey)
  const recoverable = new Uint8Array(65)
  recoverable[0] =
    RECOVERABLE_HEADER_BASE + signature.recovery + RECOVERABLE_HEADER_COMPRESSED
  recoverable.set(signature.toBytes('compact'), 1)
  return bytesToHex(recoverable)
}

/**
 * Recover the signer's compressed public key from a signature produced by
 * `signLoginNonce`. This is the check the server performs; having it on the
 * client lets the wire format be verified without a network round trip.
 */
export const recoverLoginPublicKeyHex = (
  signatureHex: string,
  nonce: number
): string => {
  const raw = hexToBytes(signatureHex)
  if (raw.length !== 65) {
    throw new Error(`CTX login signature must be 65 bytes, got ${raw.length}`)
  }
  const recovery =
    raw[0] - RECOVERABLE_HEADER_BASE - RECOVERABLE_HEADER_COMPRESSED
  if (recovery < 0 || recovery > 3) {
    throw new Error(`CTX login signature has invalid header byte: ${raw[0]}`)
  }
  const signature = secp256k1.Signature.fromBytes(
    raw.slice(1),
    'compact'
  ).addRecoveryBit(recovery)
  // The standalone `secp256k1.recoverPublicKey` this deprecation points at
  // exists at runtime but is absent from the type definitions @noble/curves
  // 1.9.7 ships for this export, so reaching it would require an `any` cast.
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  return signature.recoverPublicKey(makeLoginNonceHash(nonce)).toHex(true)
}

/**
 * Read the expiry out of a JWT without verifying it. The signature is the
 * server's business; the client only needs to know when to refresh.
 *
 * Returns `undefined` for anything unparseable so a malformed token is treated
 * as already expired rather than throwing during a render.
 */
export const getJwtExpiryMs = (token: string): number | undefined => {
  const parts = token.split('.')
  if (parts.length !== 3) return undefined
  try {
    // JWT payloads are unpadded base64url ASCII JSON.
    const payload = base64url.parse(parts[1], { loose: true })
    let json = ''
    for (const byte of payload) json += String.fromCharCode(byte)
    const claims: unknown = JSON.parse(json)
    if (
      typeof claims !== 'object' ||
      claims == null ||
      !('exp' in claims) ||
      typeof claims.exp !== 'number'
    ) {
      return undefined
    }
    return claims.exp * 1000
  } catch {
    return undefined
  }
}

/** True when the private key is a valid secp256k1 scalar. */
export const isValidPrivateKey = (privateKey: Uint8Array): boolean =>
  privateKey.length === CTX_SPEND_PRIVATE_KEY_LENGTH &&
  secp256k1.utils.isValidSecretKey(privateKey)
