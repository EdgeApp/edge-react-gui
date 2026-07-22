import { describe, expect, it } from '@jest/globals'

import { isReturnUrl } from '../../../../plugins/gui/providers/common'

describe('isReturnUrl', () => {
  it('matches the claimed deep.edge.app host per kind', () => {
    expect(
      isReturnUrl('https://deep.edge.app/redirect/payment/', 'payment')
    ).toBe(true)
    expect(
      isReturnUrl('https://deep.edge.app/redirect/success/', 'success')
    ).toBe(true)
    expect(isReturnUrl('https://deep.edge.app/redirect/fail/', 'fail')).toBe(
      true
    )
    expect(
      isReturnUrl('https://deep.edge.app/redirect/cancel/', 'cancel')
    ).toBe(true)
  })

  it('also matches the legacy apex edge.app host so pre-switch orders still intercept', () => {
    expect(isReturnUrl('https://edge.app/redirect/payment/', 'payment')).toBe(
      true
    )
    expect(isReturnUrl('https://edge.app/redirect/success/', 'success')).toBe(
      true
    )
    expect(isReturnUrl('https://edge.app/redirect/fail/', 'fail')).toBe(true)
    expect(isReturnUrl('https://edge.app/redirect/cancel/', 'cancel')).toBe(
      true
    )
  })

  it('matches when the provider appends query params or path suffix (startsWith)', () => {
    expect(
      isReturnUrl(
        'https://deep.edge.app/redirect/payment/?orderId=abc',
        'payment'
      )
    ).toBe(true)
    expect(
      isReturnUrl('https://edge.app/redirect/success/?status=ok', 'success')
    ).toBe(true)
  })

  it('does not cross-match different kinds', () => {
    expect(
      isReturnUrl('https://deep.edge.app/redirect/success/', 'cancel')
    ).toBe(false)
    expect(
      isReturnUrl('https://deep.edge.app/redirect/cancel/', 'success')
    ).toBe(false)
  })

  it('rejects unrelated or look-alike hosts', () => {
    expect(
      isReturnUrl('https://evil.edge.app/redirect/payment/', 'payment')
    ).toBe(false)
    expect(
      isReturnUrl('https://deep.edge.app.evil.com/redirect/payment/', 'payment')
    ).toBe(false)
    expect(
      isReturnUrl('https://example.com/redirect/payment/', 'payment')
    ).toBe(false)
  })
})
