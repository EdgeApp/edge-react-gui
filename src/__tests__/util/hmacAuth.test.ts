import { describe, expect, it } from '@jest/globals'

import {
  buildSignedRequestText,
  hmacSha256,
  signHmacAuthorization
} from '../../util/hmacAuth'

describe('hmacAuth', () => {
  const secret = new Uint8Array(
    Buffer.from('0123456789abcdef0123456789abcdef', 'hex')
  )
  const method = 'GET'
  const url = '/v1/infoRollup/edge?os=ios&osVersion=18.0.0&appVersion=4.51.0'
  const body = ''
  const timestamp = '1723050000'
  const apiKey = 'test-api-key'
  const expectedSignatureBase64 = '81m1scHFo4b3NQytMq/oNMZNpegCG2y8+afEOJ67Vw4='

  it('builds the signed request text', () => {
    expect(buildSignedRequestText(method, url, body, timestamp)).toBe(
      'GET\n/v1/infoRollup/edge?os=ios&osVersion=18.0.0&appVersion=4.51.0\n\n1723050000'
    )
  })

  it('matches the shared HMAC-SHA256 fixture', () => {
    const signedText = buildSignedRequestText(method, url, body, timestamp)
    const digest = hmacSha256(signedText, secret)
    const signature = Buffer.from(digest).toString('base64')
    expect(signature).toBe(expectedSignatureBase64)
  })

  it('formats the Authorization header', () => {
    expect(
      signHmacAuthorization(method, url, body, timestamp, apiKey, secret)
    ).toBe(`HMAC ${apiKey} ${expectedSignatureBase64}`)
  })
})
