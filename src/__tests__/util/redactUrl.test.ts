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

  it('returns a URL with nothing secret unchanged', () => {
    const url = 'https://sell.moonpay.com/transaction_receipt?transactionId=a b'
    expect(redactUrl(url)).toBe(url)
  })
})
