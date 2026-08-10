import { describe, expect, test } from '@jest/globals'

import {
  bytesToHex,
  getJwtExpiryMs,
  getPublicKeyHex,
  hexToBytes,
  isValidPrivateKey,
  makeLoginNonceHash,
  recoverLoginPublicKeyHex,
  signLoginNonce,
  uint64BE
} from '../plugins/gift-cards/ctxSpendCrypto'

// A fixed key, so every expectation below is a reproducible vector rather than
// a property of whatever key the run happened to draw.
const PRIVATE_KEY_HEX =
  '0000000000000000000000000000000000000000000000000000000000000001'
const privateKey = hexToBytes(PRIVATE_KEY_HEX)

describe('uint64BE', () => {
  test('encodes big-endian across byte boundaries', () => {
    expect(bytesToHex(uint64BE(0))).toBe('0000000000000000')
    expect(bytesToHex(uint64BE(1))).toBe('0000000000000001')
    expect(bytesToHex(uint64BE(255))).toBe('00000000000000ff')
    expect(bytesToHex(uint64BE(256))).toBe('0000000000000100')
    expect(bytesToHex(uint64BE(4294967296))).toBe('0000000100000000')
    // Number.MAX_SAFE_INTEGER, the top of the exact-integer range.
    expect(bytesToHex(uint64BE(9007199254740991))).toBe('001fffffffffffff')
  })

  test('rejects values that cannot be represented exactly', () => {
    expect(() => uint64BE(-1)).toThrow()
    expect(() => uint64BE(1.5)).toThrow()
    expect(() => uint64BE(Number.MAX_SAFE_INTEGER + 2)).toThrow()
  })
})

describe('makeLoginNonceHash', () => {
  test('matches sha256 of the big-endian nonce', () => {
    // sha256(0000000000000002), independently computable from the spec.
    expect(bytesToHex(makeLoginNonceHash(2))).toBe(
      'cd04a4754498e06db5a13c5f371f1f04ff6d2470f24aa9bd886540e5dce77f70'
    )
  })
})

describe('signLoginNonce', () => {
  test('produces the 65-byte recoverable encoding the server expects', () => {
    const signature = hexToBytes(signLoginNonce(privateKey, 2))
    expect(signature.length).toBe(65)
    // [27 + recoveryId + 4], where +4 marks a compressed public key.
    expect(signature[0]).toBeGreaterThanOrEqual(31)
    expect(signature[0]).toBeLessThanOrEqual(34)
  })

  test('is deterministic for a given key and nonce', () => {
    expect(signLoginNonce(privateKey, 2)).toBe(signLoginNonce(privateKey, 2))
  })

  test('signs a different nonce differently', () => {
    expect(signLoginNonce(privateKey, 2)).not.toBe(
      signLoginNonce(privateKey, 3)
    )
  })

  test('recovers the signing public key, which is how the server authenticates', () => {
    const publicKeyHex = getPublicKeyHex(privateKey)
    for (const nonce of [1, 2, 42, 65536]) {
      const signature = signLoginNonce(privateKey, nonce)
      expect(recoverLoginPublicKeyHex(signature, nonce)).toBe(publicKeyHex)
    }
  })

  test('does not recover the signing key against the wrong nonce', () => {
    const signature = signLoginNonce(privateKey, 2)
    expect(recoverLoginPublicKeyHex(signature, 3)).not.toBe(
      getPublicKeyHex(privateKey)
    )
  })
})

describe('recoverLoginPublicKeyHex', () => {
  test('rejects a signature of the wrong length', () => {
    expect(() => recoverLoginPublicKeyHex('00'.repeat(64), 1)).toThrow()
  })

  test('rejects an out-of-range header byte', () => {
    const signature = hexToBytes(signLoginNonce(privateKey, 2))
    signature[0] = 99
    expect(() => recoverLoginPublicKeyHex(bytesToHex(signature), 2)).toThrow()
  })
})

describe('getJwtExpiryMs', () => {
  test('reads exp out of an unpadded base64url payload', () => {
    // {"exp":1786421416} — the base64url payload is unpadded, as JWTs are.
    const token = `header.eyJleHAiOjE3ODY0MjE0MTZ9.signature`
    expect(getJwtExpiryMs(token)).toBe(1786421416000)
  })

  test('returns undefined for malformed tokens, so they read as expired', () => {
    expect(getJwtExpiryMs('not-a-jwt')).toBeUndefined()
    expect(getJwtExpiryMs('a.b.c')).toBeUndefined()
    // Valid base64url JSON, but no exp claim.
    expect(
      getJwtExpiryMs('header.eyJmb28iOiJiYXIifQ.signature')
    ).toBeUndefined()
  })
})

describe('isValidPrivateKey', () => {
  test('accepts a valid scalar and rejects degenerate ones', () => {
    expect(isValidPrivateKey(privateKey)).toBe(true)
    expect(isValidPrivateKey(new Uint8Array(32))).toBe(false)
    expect(isValidPrivateKey(new Uint8Array(31))).toBe(false)
  })
})
