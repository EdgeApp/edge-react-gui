import { describe, expect, it } from '@jest/globals'

import { redactUrl } from '../../util/redactUrl'

describe('redactUrl', () => {
  it('hides the sell order id and keeps the rest of the URL', () => {
    const url =
      'https://sell.moonpay.com/?apiKey=pk_live&externalTransactionId=3f2b9c1e-0000-4000-8000-000000000000&baseCurrencyCode=eth'

    const redacted = redactUrl(url)

    expect(redacted).not.toContain('3f2b9c1e')
    expect(redacted).toBe(
      'https://sell.moonpay.com/?apiKey=pk_live&externalTransactionId=redacted&baseCurrencyCode=eth'
    )
  })

  it('hides the login session and keeps the rest of the URL', () => {
    const url =
      'https://app.dfx.swiss/sell?session=eyJhbGciOiJIUzI1NiJ9.secret&redirect-uri=edge%3A%2F%2Fpay&blockchain=Bitcoin&amount-in=0.1'

    const redacted = redactUrl(url)

    expect(redacted).not.toContain('eyJhbGciOiJIUzI1NiJ9')
    expect(redacted).toBe(
      'https://app.dfx.swiss/sell?session=redacted&redirect-uri=edge%3A%2F%2Fpay&blockchain=Bitcoin&amount-in=0.1'
    )
  })

  it('hides every secret in the same URL', () => {
    const url =
      'https://example.com/?session=token123&externalTransactionId=order456&amount=1'

    const redacted = redactUrl(url)

    expect(redacted).not.toContain('token123')
    expect(redacted).not.toContain('order456')
    expect(redacted).toBe(
      'https://example.com/?session=redacted&externalTransactionId=redacted&amount=1'
    )
  })

  it('returns a URL with nothing secret unchanged', () => {
    const url = 'https://sell.moonpay.com/transaction_receipt?transactionId=a b'
    expect(redactUrl(url)).toBe(url)
  })

  it('hides a secret whose value cannot be decoded', () => {
    const url = 'https://example.com/?session=tok%E0en&amount=1'

    const redacted = redactUrl(url)

    expect(redacted).not.toContain('tok')
    expect(redacted).not.toContain('en&')
    expect(redacted).toContain('amount=1')
    expect(redacted).toBe('https://example.com/?session=redacted&amount=1')
  })

  it('hides a secret whose name has other capitals', () => {
    expect(redactUrl('https://example.com/?Session=abc')).toBe(
      'https://example.com/?Session=redacted'
    )
    expect(redactUrl('https://example.com/?SESSION=abc')).toBe(
      'https://example.com/?SESSION=redacted'
    )
  })

  it('hides a secret whose name is percent-encoded', () => {
    const url = 'https://example.com/?%53ession=abc'

    const redacted = redactUrl(url)

    expect(redacted).not.toContain('abc')
    expect(redacted).toBe('https://example.com/?%53ession=redacted')
  })

  it('hides a secret with an encoded name and an undecodable value', () => {
    const url = 'https://example.com/?sess%69on=tok%E0en'

    const redacted = redactUrl(url)

    expect(redacted).not.toContain('tok')
    expect(redacted).toBe('https://example.com/?sess%69on=redacted')
  })

  it('hides every copy of a repeated secret', () => {
    const url = 'https://example.com/?session=a1&x=1&session=b2'

    const redacted = redactUrl(url)

    expect(redacted).not.toContain('a1')
    expect(redacted).not.toContain('b2')
  })

  it('leaves a path that reads like a secret unchanged', () => {
    const url = 'https://example.com/session=abc/sell?amount=1'
    expect(redactUrl(url)).toBe(url)
  })
})
