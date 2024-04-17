import { describe, expect, test } from '@jest/globals'
import crypto from 'crypto'

import { sha512HashAndSign } from '../util/crypto'

const publicKey = `-----BEGIN RSA PUBLIC KEY-----
MIICCgKCAgEAut917lnm3PFcVqbqmVGu+GPHfk5jeebukMekdrrJEuJnQf4Slu6Q
+wwAneHDoJVEKa3ecyLjYp9D1wxXCL2m3Cu+Ev4ueOwIKaAFv+ZHl5naHV6T114h
C3dIXW31qT9t8n6WvYVz7aAdhRLZBry4eVe0HDabFujM7g+N2eS+XM38zhJvHO1w
5TZcK7EQP25NuLSzyp/QDG/3vb8f4ZrYAgbtmXRnDfu5b88iB2noPfTJcruJ/rr0
+/yic8ytUi5dzOfXGbpDtpcry8DeeJeG9efLsNL7IoTcFgrgTvhKtxbLy3QmPHgA
xKvGdP4jSWLJJfMAlIFz8jPuUSxuPKSoKocXZaHb+Zpt6PQl6qotwkHH4Acb/uha
jb1sBLbZBbqyjaOZyuWt7yMcdkdkbV14h3S6eaBsLXeeZ/kI+y3j2MKajDQ7k8kM
q8wY7Ypco+TAP04EIySuNlrwZlUhZaDpGO77i8yreUCrLerAqikyGygo9jcbsJ93
JsYkvWG5f7qb0+/JsZ0YdoIs19aA4H46rz/eWJT7HPsMk9P+eX4S6xSY/Xjj873v
nKHyFsg3Ovq3sb5ovtmJfbLXeWFlvtn/EWXjvyuyf6wJWQK8TAPg3bdpS3DyNm/D
Ru94PjdPAQ2mX86dz0D7OWqrhlXHdwn1vopiTjmKtBGdAoR4lsZKTy0CAwEAAQ==
-----END RSA PUBLIC KEY-----`

const privateKey = `-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----`

describe('Crypto', () => {
  test('sha512HashAndSign', () => {
    // Request body to sign
    const verifiableData =
      '{"cryptoWalletAddress":{"address":"valid_btc_crypto_wallet_address","currencyCode":"BTC"},"locale":"en","partnerUserId":"johnDoe1","email":"john.doe@example.com","quoteId":"7604aac0-7938-4e54-8a80-c3172a043c44"}'

    const signature = sha512HashAndSign(verifiableData, privateKey)

    const hash = crypto.createHash('sha512')
    const hashedData = hash.update(verifiableData, 'utf-8').digest('hex')

    const key = {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
    }

    const isVerified = crypto.verify('sha512', Buffer.from(hashedData), key, Buffer.from(signature, 'base64'))
    expect(isVerified).toBe(true)
  })
})
