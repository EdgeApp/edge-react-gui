import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'
import { asDate, asObject, asOptional, asString, asUnknown } from 'cleaners'
import {
  addEdgeCorePlugins,
  type EdgeAccount,
  type EdgeContext,
  type EdgeCurrencyWallet,
  type EdgeSwapPlugin,
  type EdgeSwapRequest,
  type EdgeSwapRequestOptions,
  lockEdgeCorePlugins,
  makeFakeEdgeWorld
} from 'edge-core-js'

import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakePlugin } from '../../util/fake/fakeCurrencyPlugin'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import fakeUser from '../../util/fake/fakeUserDump.json'
import { makeStealthSwapRequestOptions } from '../../util/stealthSwap'

jest.useRealTimers()

const asUserDump = asObject({
  loginKey: asString,
  data: asObject({
    username: asString,
    lastLogin: asOptional(asDate),
    loginId: asString,
    loginKey: asString,
    repos: asObject(asObject(asUnknown)),
    server: asUnknown
  })
})

/** A swap provider that answers every request with one quote. */
const makeFakeSwapPlugin = (pluginId: string): EdgeSwapPlugin => {
  const swapInfo = { pluginId, displayName: pluginId, supportEmail: '' }
  return {
    swapInfo,
    async fetchSwapQuote(request) {
      return {
        swapInfo,
        request,
        isEstimate: false,
        fromNativeAmount: request.nativeAmount,
        toNativeAmount: request.nativeAmount,
        networkFee: { currencyCode: 'BTC', nativeAmount: '1', tokenId: null },
        pluginId: 'bitcoin',
        approve: async () => {
          throw new Error('unreachable')
        },
        close: async () => {}
      }
    }
  }
}

let context: EdgeContext | undefined
let account: EdgeAccount
let request: EdgeSwapRequest

beforeAll(async () => {
  const dump = asUserDump(fakeUser)

  addEdgeCorePlugins({
    bitcoin: makeFakePlugin(btcCurrencyInfo),
    ethereum: makeFakePlugin(ethCurrencyInfo),
    changenow: makeFakeSwapPlugin('changenow'),
    houdini: makeFakeSwapPlugin('houdini')
  })
  lockEdgeCorePlugins()

  const world = await makeFakeEdgeWorld([dump.data], {})
  context = await world.makeEdgeContext({
    apiKey: '',
    appId: '',
    plugins: { bitcoin: true, ethereum: true, changenow: true, houdini: true }
  })
  account = await context.loginWithKey('bob', dump.loginKey)

  const getWallet = async (type: string): Promise<EdgeCurrencyWallet> => {
    const info = account.getFirstWalletInfo(type)
    if (info == null) throw new Error(`No ${type} in the fake account`)
    return await account.waitForCurrencyWallet(info.id)
  }
  request = {
    fromWallet: await getWallet('wallet:bitcoin'),
    fromTokenId: null,
    toWallet: await getWallet('wallet:ethereum'),
    toTokenId: null,
    nativeAmount: '10000',
    quoteFor: 'from'
  }
})

// An open context keeps the jest process alive after the last test:
afterAll(async () => {
  await context?.close()
})

/** The providers the core actually queried for one set of request options. */
const quotedProviders = async (
  opts: EdgeSwapRequestOptions
): Promise<string[]> => {
  const quotes = await account.fetchSwapQuotes(request, opts)
  const pluginIds = quotes.map(quote => quote.swapInfo.pluginId).sort()
  for (const quote of quotes) await quote.close()
  return pluginIds
}

// These run the request options through the real core, which is what reads
// the Exchange Settings toggle (`EdgeSwapConfig.enabled`), instead of
// asserting on the option object's shape alone.
describe.each([
  { houdiniSetting: 'on', enabled: true, plainSwap: ['changenow', 'houdini'] },
  { houdiniSetting: 'off', enabled: false, plainSwap: ['changenow'] }
])(
  'swap quotes with Houdini switched $houdiniSetting in Exchange Settings',
  ({ enabled, plainSwap }) => {
    beforeAll(async () => {
      await account.swapConfig.houdini.changeEnabled(enabled)
      expect(account.swapConfig.houdini.enabled).toBe(enabled)
    })

    it('quotes a Stealth request from Houdini alone', async () => {
      const options = makeStealthSwapRequestOptions(account)
      expect(await quotedProviders(options)).toEqual(['houdini'])
    })

    it('honors the setting for a request with Stealth off', async () => {
      expect(await quotedProviders({})).toEqual(plainSwap)
    })

    it('stops a Stealth request the caller disabled Houdini for', async () => {
      // The info server's kill switches reach the request as `disabled`
      // entries, which the core ranks above `forceEnabled`:
      const options = makeStealthSwapRequestOptions(account, {
        disabled: { houdini: true }
      })
      await expect(account.fetchSwapQuotes(request, options)).rejects.toThrow()
    })
  }
)
