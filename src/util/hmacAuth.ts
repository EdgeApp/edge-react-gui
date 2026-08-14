import hashjs from 'hash.js'
import { base64 } from 'rfc4648'

export function hmacSha256(data: string, key: Uint8Array): Uint8Array {
  // hash.js HMAC typings reject Sha256Constructor; runtime accepts it.
  const hmac = (hashjs as any).hmac(hashjs.sha256, key) as {
    update: (s: string) => { digest: () => number[] }
  }
  const digest = hmac.update(data).digest()
  return new Uint8Array(digest)
}

export function buildSignedRequestText(
  method: string,
  url: string,
  body: string,
  timestamp: string
): string {
  return `${method}\n${url}\n${body}\n${timestamp}`
}

export function signHmacAuthorization(
  method: string,
  url: string,
  body: string,
  timestamp: string,
  apiKey: string,
  secret: Uint8Array
): string {
  const signedText = buildSignedRequestText(method, url, body, timestamp)
  const signature = base64.stringify(hmacSha256(signedText, secret))
  return `HMAC ${apiKey} ${signature}`
}
