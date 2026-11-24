import { describe, expect, it, jest } from '@jest/globals'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import type { PluginViewParams } from '../../../components/scenes/GuiPluginViewScene'
import type {
  RampPluginConfig,
  RampQuoteRequest
} from '../../../plugins/ramps/rampPluginTypes'
import {
  createExternalRampPlugin,
  type DirectionSupportData
} from '../../../plugins/ramps/utils/createExternalRampPlugin'
import type { GuiPlugin } from '../../../types/GuiPluginTypes'

jest.mock('../../../components/services/AirshipInstance', () => ({
  showToastSpinner: async (message: string, promise: Promise<unknown>) =>
    await promise
}))

const GUI_PLUGIN: GuiPlugin = {
  pluginId: 'test-ramp',
  storeId: 'test.ramp',
  baseUri: 'https://ramp.example',
  displayName: 'Test Ramp'
} as unknown as GuiPlugin

const REQUEST: RampQuoteRequest = {
  wallet: {
    currencyInfo: { pluginId: 'bitcoin' }
  } as unknown as EdgeCurrencyWallet,
  tokenId: null,
  displayCurrencyCode: 'BTC',
  amountQuery: { exchangeAmount: '500' },
  fiatCurrencyCode: 'iso:EUR',
  amountType: 'fiat',
  direction: 'buy',
  regionCode: { countryCode: 'DE' }
}

/** Approves the plugin's first quote and returns the navigation it made. */
async function approve(
  resolveDeepQuery: DirectionSupportData['resolveDeepQuery'],
  launchQuote?: DirectionSupportData['launchQuote']
): Promise<jest.Mock> {
  const navigate = jest.fn()
  const plugin = createExternalRampPlugin(
    'test-ramp',
    {
      partnerIcon: 'icon.png',
      guiPlugin: GUI_PLUGIN,
      buy: {
        paymentTypes: ['sepa'],
        countries: ['DE'],
        cryptoAssets: [{ pluginId: 'bitcoin', tokenId: null }],
        settlementRange: {
          min: { value: 1, unit: 'days' },
          max: { value: 3, unit: 'days' }
        },
        deepPath: '/buy',
        deepQuery: { wallet: 'Edge', lang: 'en' },
        resolveDeepQuery,
        launchQuote
      }
    },
    { navigation: { navigate } } as unknown as RampPluginConfig
  )

  const [quote] = await plugin.fetchQuotes(REQUEST)
  await quote.approveQuote({ coreWallet: REQUEST.wallet })
  return navigate
}

/** Approves the plugin's first quote and returns the deep query it opened. */
async function approveWith(
  resolveDeepQuery: DirectionSupportData['resolveDeepQuery'],
  launchQuote?: DirectionSupportData['launchQuote']
): Promise<PluginViewParams['deepQuery']> {
  const navigate = await approve(resolveDeepQuery, launchQuote)

  expect(navigate).toHaveBeenCalledTimes(1)
  const [route, params] = navigate.mock.calls[0] as [string, PluginViewParams]
  expect(route).toBe('pluginViewBuy')
  return params.deepQuery
}

describe('createExternalRampPlugin approveQuote', () => {
  it('merges the resolved query over the static deep query', async () => {
    const deepQuery = await approveWith(async () => ({
      session: 'jwt',
      lang: 'de'
    }))

    expect(deepQuery).toEqual({ wallet: 'Edge', lang: 'de', session: 'jwt' })
  })

  it('keeps the static deep query when the resolver returns nothing', async () => {
    const deepQuery = await approveWith(async () => undefined)

    expect(deepQuery).toEqual({ wallet: 'Edge', lang: 'en' })
  })

  it('hands the merged deep query to the launcher in place of the plugin scene', async () => {
    const launchQuote = jest.fn(
      async (
        request: RampQuoteRequest,
        deepQuery: Record<string, string> | undefined
      ) => true
    )

    const navigate = await approve(
      async () => ({ session: 'jwt' }),
      launchQuote
    )

    expect(launchQuote).toHaveBeenCalledWith(REQUEST, {
      wallet: 'Edge',
      lang: 'en',
      session: 'jwt'
    })
    expect(navigate).not.toHaveBeenCalled()
  })

  it('opens the plugin scene when the launcher does not open the provider', async () => {
    const deepQuery = await approveWith(
      async () => undefined,
      async () => false
    )

    expect(deepQuery).toEqual({ wallet: 'Edge', lang: 'en' })
  })
})
