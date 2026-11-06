import { describe, expect, it } from '@jest/globals'

import type { AnchorEndpoints } from '../../../plugins/ramps/moneygram/moneygramTypes'
import {
  anchorPageUrl,
  checkInteractiveUrl,
  isAnchorUrl
} from '../../../plugins/ramps/moneygram/sep24Api'

const ANCHOR: AnchorEndpoints = {
  homeDomain: 'testanchor.stellar.org',
  signingKey: 'GCHLHDBOKG2JWMJQBTLSL5XG6NO7ESXI2TAQKZXCXWXB5WI2X6W233PR',
  transferServerSep24: 'https://testanchor.stellar.org/sep24',
  webAuthEndpoint: 'https://testanchor.stellar.org/auth'
}

describe('SEP-24 interactive URLs', () => {
  it('opens https pages on the anchor site', () => {
    for (const url of [
      'https://testanchor.stellar.org/sep24/transactions/deposit/webapp?token=t',
      'https://anchor-ref-ui-testanchor.stellar.org/?transaction_id=1&token=t'
    ]) {
      expect(() => {
        checkInteractiveUrl(url, ANCHOR)
      }).not.toThrow()
    }
  })

  it('refuses other schemes and hosts', () => {
    for (const url of [
      'http://testanchor.stellar.org/sep24/webapp',
      'https://evil.example.com/sep24/webapp',
      'https://testanchor.stellar.org.evil.example.com/webapp',
      'https://evilstellar.org/webapp',
      'https://stellar.org/webapp',
      'https://evil.stellar.org/?token=t',
      'javascript:alert(1)'
    ]) {
      expect(() => {
        checkInteractiveUrl(url, ANCHOR)
      }).toThrow('SEP-24 interactive URL is not on the anchor')
    }
  })
})

describe('SEP-24 anchor URLs', () => {
  it('accepts hosts under the home domain', () => {
    expect(isAnchorUrl('https://api.testanchor.stellar.org/x', ANCHOR)).toBe(
      true
    )
  })

  it('does not lend one anchor the UI hosts of another', () => {
    const other: AnchorEndpoints = { ...ANCHOR, homeDomain: 'example.com' }
    expect(
      isAnchorUrl('https://anchor-ref-ui-testanchor.stellar.org/', other)
    ).toBe(false)
  })
})

describe('SEP-24 status pages', () => {
  it('keeps a status page on the anchor site', () => {
    const url =
      'https://testanchor.stellar.org/sep24/transaction/more_info?id=1'
    expect(anchorPageUrl(url, ANCHOR)).toBe(url)
  })

  it('drops a missing or off-site status page', () => {
    expect(anchorPageUrl(undefined, ANCHOR)).toBeUndefined()
    expect(anchorPageUrl('edge://pay/bitcoin', ANCHOR)).toBeUndefined()
    expect(
      anchorPageUrl('https://evil.example.com/more_info', ANCHOR)
    ).toBeUndefined()
  })
})
