import { describe, expect, it } from '@jest/globals'
import type { EdgeCurrencyWallet, EdgeSwapRequest } from 'edge-core-js'

import type { AccountReferral } from '../../types/ReferralTypes'
import {
  makeSwapRequestOptions,
  withAssetDisabledPlugins
} from '../../util/swapRequestOptions'

const noReferral: AccountReferral = {
  promotions: [],
  ignoreAccountSwap: false,
  hiddenAccountMessages: {},
  activePromotions: []
}

/**
 * The swap request options the app's swap scenes and the CLI's
 * `fetch-swap-quotes` both ask with, from one builder.
 */
describe('makeSwapRequestOptions', () => {
  it('disables what the account and the info server disable, with the app’s timeouts', () => {
    const { options } = makeSwapRequestOptions({
      accountPlugins: [
        { pluginId: 'swapuz', disabled: true, durationDays: 3650 }
      ],
      accountReferral: noReferral,
      preferredSwapPluginId: 'changenow',
      preferredSwapPluginType: 'CEX',
      disablePlugins: { changehero: true }
    })
    expect(options).toStrictEqual({
      disabled: { swapuz: true, changehero: true },
      noResponseMs: 60000,
      preferPluginId: 'changenow',
      preferType: 'CEX',
      promoCodes: {},
      slowResponseMs: 10000
    })
  })

  it('adds the exchanges Edge turned off for the request’s assets', () => {
    const wallet = (pluginId: string): EdgeCurrencyWallet =>
      ({ currencyInfo: { pluginId } } as unknown as EdgeCurrencyWallet)
    const request = {
      fromWallet: wallet('bitcoin'),
      toWallet: wallet('ethereum'),
      fromTokenId: null,
      toTokenId: null,
      nativeAmount: '1000',
      quoteFor: 'from'
    } as unknown as EdgeSwapRequest
    const options = withAssetDisabledPlugins(
      { disabled: { changehero: true } },
      {
        godex: {
          source: [],
          destination: [{ pluginId: 'ethereum', tokenId: undefined }]
        },
        exolix: {
          source: [{ pluginId: 'litecoin', tokenId: undefined }],
          destination: []
        }
      },
      request
    )
    expect(options.disabled).toStrictEqual({ changehero: true, godex: true })
  })
})
