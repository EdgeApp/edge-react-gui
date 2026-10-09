import { afterEach, describe, expect, it, jest } from '@jest/globals'
import type { EdgeSwapConfig } from 'edge-core-js'

import { swapVerifyTerms } from '../../components/modals/SwapVerifyTermsModal'
import { Airship } from '../../components/services/AirshipInstance'

interface FakeSwapConfigOpts {
  agreedToTerms?: boolean
  enabled?: boolean
  pluginId?: string
}

// Only the fields `swapVerifyTerms` reads and the two writers it calls:
const fakeSwapConfig = (
  opts: FakeSwapConfigOpts = {}
): {
  changeEnabled: jest.Mock<EdgeSwapConfig['changeEnabled']>
  changeUserSettings: jest.Mock<EdgeSwapConfig['changeUserSettings']>
  swapConfig: EdgeSwapConfig
} => {
  const { agreedToTerms, enabled = true, pluginId = 'houdini' } = opts
  const changeEnabled = jest.fn<EdgeSwapConfig['changeEnabled']>(async () => {})
  const changeUserSettings = jest.fn<EdgeSwapConfig['changeUserSettings']>(
    async () => {}
  )
  const swapConfig = {
    enabled,
    swapInfo: { pluginId, displayName: 'Fake', supportEmail: '' },
    userSettings: agreedToTerms == null ? undefined : { agreedToTerms },
    changeEnabled,
    changeUserSettings
  } as unknown as EdgeSwapConfig
  return { changeEnabled, changeUserSettings, swapConfig }
}

/** Answers the terms modal without rendering it. */
const answerModal = (
  accept: boolean
): jest.SpiedFunction<typeof Airship.show> =>
  jest.spyOn(Airship, 'show').mockImplementation(async () => accept)

describe('swapVerifyTerms', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('passes a provider that has no terms to show', async () => {
    const show = answerModal(false)
    const { swapConfig } = fakeSwapConfig({ pluginId: 'thorchain' })

    expect(await swapVerifyTerms(swapConfig)).toBe(true)
    expect(show).not.toHaveBeenCalled()
  })

  it.each([true, false])(
    'never asks again once accepted, provider enabled: %s',
    async enabled => {
      const show = answerModal(false)
      const { changeEnabled, changeUserSettings, swapConfig } = fakeSwapConfig({
        agreedToTerms: true,
        enabled
      })

      expect(await swapVerifyTerms(swapConfig)).toBe(true)
      expect(
        await swapVerifyTerms(swapConfig, { declineIsCancelOnly: true })
      ).toBe(true)
      expect(show).not.toHaveBeenCalled()
      expect(changeEnabled).not.toHaveBeenCalled()
      expect(changeUserSettings).not.toHaveBeenCalled()
    }
  )

  it.each([true, false])(
    'saves an accept, declineIsCancelOnly: %s',
    async declineIsCancelOnly => {
      const show = answerModal(true)
      const { changeEnabled, changeUserSettings, swapConfig } = fakeSwapConfig()

      expect(await swapVerifyTerms(swapConfig, { declineIsCancelOnly })).toBe(
        true
      )
      expect(show).toHaveBeenCalledTimes(1)
      expect(changeUserSettings).toHaveBeenCalledWith({ agreedToTerms: true })
      expect(changeEnabled).not.toHaveBeenCalled()
    }
  )

  it('switches the provider off on a decline by default', async () => {
    answerModal(false)
    const { changeEnabled, changeUserSettings, swapConfig } = fakeSwapConfig()

    expect(await swapVerifyTerms(swapConfig)).toBe(false)
    expect(changeUserSettings).toHaveBeenCalledWith({ agreedToTerms: false })
    expect(changeEnabled).toHaveBeenCalledWith(false)
  })

  it('saves nothing on a cancel-only decline', async () => {
    // The Stealth Swap path: the request ignores the provider's exchange
    // setting, so switching it off would not stop the next quote, and the
    // user's own setting is not this modal's to change.
    answerModal(false)
    const { changeEnabled, changeUserSettings, swapConfig } = fakeSwapConfig()

    expect(
      await swapVerifyTerms(swapConfig, { declineIsCancelOnly: true })
    ).toBe(false)
    expect(changeUserSettings).not.toHaveBeenCalled()
    expect(changeEnabled).not.toHaveBeenCalled()
  })

  it('asks again on the next attempt after a cancel-only decline', async () => {
    const show = answerModal(false)
    const { swapConfig } = fakeSwapConfig()

    await swapVerifyTerms(swapConfig, { declineIsCancelOnly: true })
    await swapVerifyTerms(swapConfig, { declineIsCancelOnly: true })
    expect(show).toHaveBeenCalledTimes(2)
  })
})
