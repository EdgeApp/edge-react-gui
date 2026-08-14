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
  const url = '/v1/getKeys?appId=edge'
  const body = ''
  const timestamp = '1723050000'
  const apiKey = 'test-api-key'
  const expectedSignatureBase64 = 's+MH1mrwnRIk0Hr2tzZ+QHaHIinvn11PUJnISWM7l3o='

  it('builds the signed request text', () => {
    expect(buildSignedRequestText(method, url, body, timestamp)).toBe(
      'GET\n/v1/getKeys?appId=edge\n\n1723050000'
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
