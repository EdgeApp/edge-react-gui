import { describe, expect, it, jest } from '@jest/globals'

import { RETURN_URL_PAYMENT } from '../../../../plugins/gui/providers/common'
import {
  makeSellPaymentRedirect,
  type SellPaymentRedirect
} from '../../../../plugins/ramps/utils/sellPaymentRedirect'

jest.mock('../../../../components/services/AirshipInstance', () => ({
  showError: jest.fn()
}))

const PAYMENT_URL = `${RETURN_URL_PAYMENT}?transactionId=abc`
const LEGACY_PAYMENT_URL =
  'https://edge.app/redirect/payment/?transactionId=abc'
const WIDGET_URL = 'https://widget.test/order/abc'

const makeRedirect = (): {
  redirect: SellPaymentRedirect
  pop: jest.Mock<() => void>
  onPaymentRedirect: jest.Mock<(url: string) => Promise<void>>
} => {
  const pop = jest.fn<() => void>()
  const onPaymentRedirect = jest.fn(async (url: string) => {})
  const redirect = makeSellPaymentRedirect({
    navigation: { pop },
    onPaymentRedirect
  })
  return { redirect, pop, onPaymentRedirect }
}

describe('makeSellPaymentRedirect', () => {
  it('allows loads other than the payment redirect', async () => {
    const { redirect, onPaymentRedirect } = makeRedirect()

    expect(redirect.onShouldStartLoad(WIDGET_URL)).toBe(true)
    await redirect.onUrlChange(WIDGET_URL)
    expect(onPaymentRedirect).not.toHaveBeenCalled()
  })

  it('refuses the redirect and opens the send scene', () => {
    const { redirect, onPaymentRedirect } = makeRedirect()

    expect(redirect.onShouldStartLoad(PAYMENT_URL)).toBe(false)
    expect(redirect.onShouldStartLoad(LEGACY_PAYMENT_URL)).toBe(false)
    expect(onPaymentRedirect).toHaveBeenCalledWith(PAYMENT_URL)
    expect(onPaymentRedirect).toHaveBeenCalledWith(LEGACY_PAYMENT_URL)
  })

  it('leaves the provider page open on Back after a refused redirect', () => {
    const { redirect, pop } = makeRedirect()

    redirect.onShouldStartLoad(PAYMENT_URL)
    redirect.closeRedirectPage()
    expect(pop).not.toHaveBeenCalled()
  })

  it('opens the send scene once for a redirect that loads anyway', async () => {
    const { redirect, onPaymentRedirect } = makeRedirect()

    await redirect.onUrlChange(PAYMENT_URL)
    await redirect.onUrlChange(PAYMENT_URL)
    await redirect.onUrlChange(PAYMENT_URL)
    expect(onPaymentRedirect).toHaveBeenCalledTimes(1)
  })

  it('closes only the loaded redirect page on Back', async () => {
    const { redirect, pop, onPaymentRedirect } = makeRedirect()

    await redirect.onUrlChange(PAYMENT_URL)
    redirect.closeRedirectPage()
    expect(pop).toHaveBeenCalledTimes(1)

    // A report that arrives after Back opens nothing:
    await redirect.onUrlChange(PAYMENT_URL)
    expect(onPaymentRedirect).toHaveBeenCalledTimes(1)
  })

  it('handles a fresh redirect after reset', async () => {
    const { redirect, pop, onPaymentRedirect } = makeRedirect()

    await redirect.onUrlChange(PAYMENT_URL)
    redirect.reset()

    redirect.closeRedirectPage()
    expect(pop).not.toHaveBeenCalled()
    await redirect.onUrlChange(PAYMENT_URL)
    expect(onPaymentRedirect).toHaveBeenCalledTimes(2)
  })
})
