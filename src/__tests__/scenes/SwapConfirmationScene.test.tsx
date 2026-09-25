import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import { act, render } from '@testing-library/react-native'
import { asDate, asObject, asOptional, asString, asUnknown } from 'cleaners'
import {
  addEdgeCorePlugins,
  type EdgeAccount,
  type EdgeContext,
  type EdgeCurrencyWallet,
  type EdgeSwapInfo,
  type EdgeSwapQuote,
  lockEdgeCorePlugins,
  makeFakeEdgeWorld
} from 'edge-core-js'
import process from 'process'
import * as React from 'react'

import {
  pickBestQuote,
  pickBestQuoteWithPreference,
  SwapConfirmationScene
} from '../../components/scenes/SwapConfirmationScene'
import { SafeSlider } from '../../components/themed/SafeSlider'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakePlugin } from '../../util/fake/fakeCurrencyPlugin'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import {
  fakeNavigation,
  fakeSwapTabSceneProps
} from '../../util/fake/fakeSceneProps'
import fakeUser from '../../util/fake/fakeUserDump.json'

jest.useRealTimers()

const dummySwapInfo: EdgeSwapInfo = {
  pluginId: '',
  displayName: '',
  supportEmail: ''
}

let context: EdgeContext | undefined
let account: EdgeAccount | undefined

let btcWallet: EdgeCurrencyWallet | undefined
let ethWallet: EdgeCurrencyWallet | undefined

// For use later when we need tests that use EVM currencies
// let ethWallet: EdgeCurrencyWallet | undefined
// let avaxWallet: EdgeCurrencyWallet | undefined

const asFakeUser = asObject({
  username: asString,
  lastLogin: asOptional(asDate),
  loginId: asString,
  loginKey: asString,
  repos: asObject(asObject(asUnknown)),
  server: asUnknown
})

const asUserDump = asObject({
  loginKey: asString,
  data: asFakeUser
})

beforeAll(async () => {
  const dump = asUserDump(fakeUser)
  const loginKey = dump.loginKey
  const fakeUsers = [dump.data]

  const allPlugins = {
    bitcoin: makeFakePlugin(btcCurrencyInfo),
    ethereum: makeFakePlugin(ethCurrencyInfo)
  }

  addEdgeCorePlugins(allPlugins)
  lockEdgeCorePlugins()

  const world = await makeFakeEdgeWorld(fakeUsers, {})
  context = await world.makeEdgeContext({
    apiKey: '',
    appId: '',
    plugins: { bitcoin: true, ethereum: true }
  })
  account = await context.loginWithKey('bob', loginKey)
  const btcInfo = account.getFirstWalletInfo('wallet:bitcoin')
  const ethInfo = account.getFirstWalletInfo('wallet:ethereum')
  if (btcInfo == null || ethInfo == null) {
    console.error('Unable to get wallet infos')
    process.exit(-1)
  }
  btcWallet = await account.waitForCurrencyWallet(btcInfo.id)
  ethWallet = await account.waitForCurrencyWallet(ethInfo.id)
})

describe('SwapConfirmationScene', () => {
  it('should render with loading props', () => {
    if (btcWallet == null || ethWallet == null) return
    const rootState: FakeState = { ...fakeRootState, core: { account } }

    const fakeRequest: any = {
      fromWallet: btcWallet,
      toWallet: ethWallet
    }

    const quote: EdgeSwapQuote = {
      swapInfo: dummySwapInfo,
      request: fakeRequest,
      isEstimate: true,
      fromNativeAmount: '10000',
      toNativeAmount: '10000',
      networkFee: {
        currencyCode: 'BTC',
        nativeAmount: '1',
        tokenId: null
      },
      pluginId: 'bitcoin',
      approve: async () => {
        return {
          transaction: {
            blockHeight: 500000,
            currencyCode: 'BTC',
            date: 1524476980,
            deviceDescription: 'iphone12',
            isSend: false,
            memos: [],
            metadata: {
              name: 'Crazy Person',
              category: 'Income:Mo Money',
              notes: 'Hell yeah! Thanks for the fish <<&&>>',
              amountFiat: 12000.45
            },
            nativeAmount: '123000000',
            networkFee: '1000',
            networkFees: [],
            ourReceiveAddresses: ['receiveaddress1', 'receiveaddress2'],
            parentNetworkFee: '10002',
            signedTx: '298t983y4t983y4t93y4g98oeshfgi4t89w394t',
            tokenId: null,
            txid: 'txid1',
            walletId: ''
          }
        }
      },
      close: async () => {}
    }

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SwapConfirmationScene
          {...fakeSwapTabSceneProps('swapConfirmation', {
            quotes: [quote],
            selectedQuote: quote,
            onApprove: () => undefined
          })}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  describe('sliding on a quote that cannot be approved', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    const renderScene = (
      quote: EdgeSwapQuote
    ): {
      replace: jest.SpiedFunction<typeof fakeNavigation.replace>
      slide: () => Promise<void>
      unmount: () => void
    } => {
      const rootState: FakeState = { ...fakeRootState, core: { account } }
      const replace = jest
        .spyOn(fakeNavigation, 'replace')
        .mockImplementation(() => undefined)
      const props = fakeSwapTabSceneProps('swapConfirmation', {
        quotes: [quote],
        selectedQuote: quote,
        onApprove: () => undefined
      })
      const rendered = render(
        <FakeProviders initialState={rootState}>
          <SwapConfirmationScene {...props} />
        </FakeProviders>
      )
      const slide = async (): Promise<void> => {
        await act(async () => {
          await rendered
            .UNSAFE_getByType(SafeSlider)
            .props.onSlidingComplete(() => undefined)
        })
      }
      return { replace, slide, unmount: rendered.unmount }
    }

    const makeQuote = (
      approve: EdgeSwapQuote['approve'],
      expirationDate?: Date
    ): EdgeSwapQuote => {
      const fakeRequest: any = { fromWallet: btcWallet, toWallet: ethWallet }
      return {
        swapInfo: dummySwapInfo,
        request: fakeRequest,
        isEstimate: false,
        fromNativeAmount: '10000',
        toNativeAmount: '10000',
        networkFee: { currencyCode: 'BTC', nativeAmount: '1', tokenId: null },
        pluginId: 'bitcoin',
        expirationDate,
        approve,
        close: jest.fn(async () => {})
      }
    }

    it('requotes a retry after a failed approval', async () => {
      if (btcWallet == null || ethWallet == null) return
      const approve = jest.fn(async () => {
        throw new Error('Broadcast failed')
      })
      const quote = makeQuote(approve)
      const { replace, slide, unmount } = renderScene(quote)

      await slide()
      expect(approve).toHaveBeenCalledTimes(1)
      expect(quote.close).toHaveBeenCalledTimes(1)
      expect(replace).not.toHaveBeenCalled()

      await slide()
      expect(approve).toHaveBeenCalledTimes(1)
      expect(replace).toHaveBeenCalledWith(
        'swapProcessing',
        expect.objectContaining({ swapRequest: quote.request })
      )

      unmount()
      expect(quote.close).toHaveBeenCalledTimes(1)
    })

    it('requotes an expired quote without approving it', async () => {
      if (btcWallet == null || ethWallet == null) return
      const approve = jest.fn(async () => {
        throw new Error('unreachable')
      })
      const quote = makeQuote(approve, new Date(Date.now() - 1000))
      const { replace, slide, unmount } = renderScene(quote)

      await slide()
      expect(approve).not.toHaveBeenCalled()
      expect(replace).toHaveBeenCalledWith(
        'swapProcessing',
        expect.objectContaining({ swapRequest: quote.request })
      )

      unmount()
      expect(quote.close).toHaveBeenCalledTimes(1)
    })
  })

  let quotes: TestSwapQuote[]
  let bestQuote: EdgeSwapQuote

  it('pickBestQuote fixed', () => {
    quotes = [
      {
        swapInfo: { isDex: false },
        isEstimate: false,
        fromNativeAmount: '100',
        toNativeAmount: '10000'
      },
      {
        swapInfo: { isDex: false },
        isEstimate: false,
        fromNativeAmount: '100',
        toNativeAmount: '11000'
      }
    ]
    bestQuote = pickBestQuote(quotes as any)
    expect(bestQuote).toEqual(quotes[1])
  })
  it('pickBestQuote prefer DEX first in list', () => {
    quotes = [
      {
        swapInfo: { isDex: true },
        isEstimate: true,
        fromNativeAmount: '100',
        toNativeAmount: '11000'
      },
      {
        swapInfo: { isDex: false },
        isEstimate: false,
        fromNativeAmount: '100',
        toNativeAmount: '10000'
      }
    ]
    bestQuote = pickBestQuote(quotes as any)
    expect(bestQuote).toEqual(quotes[0])
  })

  it('pickBestQuote prefer DEX second in list', () => {
    quotes = [
      {
        swapInfo: { isDex: false },
        isEstimate: false,
        fromNativeAmount: '100',
        toNativeAmount: '10000'
      },
      {
        swapInfo: { isDex: true },
        isEstimate: true,
        fromNativeAmount: '100',
        toNativeAmount: '11000'
      }
    ]
    bestQuote = pickBestQuote(quotes as any)
    expect(bestQuote).toEqual(quotes[1])
  })
  it('pickBestQuote prefer CEX', () => {
    quotes = [
      {
        swapInfo: { isDex: false },
        isEstimate: false,
        fromNativeAmount: '100',
        toNativeAmount: '10000'
      },
      {
        swapInfo: { isDex: true },
        isEstimate: true,
        fromNativeAmount: '100',
        toNativeAmount: '9000'
      }
    ]
    bestQuote = pickBestQuote(quotes as any)
    expect(bestQuote).toEqual(quotes[0])
  })
  it('pickBestQuote prefer fixed', () => {
    quotes = [
      {
        swapInfo: { isDex: false },
        isEstimate: true,
        fromNativeAmount: '100',
        toNativeAmount: '10000'
      },
      {
        swapInfo: { isDex: false },
        isEstimate: false,
        fromNativeAmount: '100',
        toNativeAmount: '9000'
      }
    ]
    bestQuote = pickBestQuote(quotes as any)
    expect(bestQuote).toEqual(quotes[1])
  })

  describe('pickBestQuoteWithPreference', () => {
    const cheaper: TestSwapQuote = {
      pluginId: 'cheapswap',
      swapInfo: { isDex: false },
      isEstimate: false,
      fromNativeAmount: '1000',
      toNativeAmount: '11000'
    }
    const pinned: TestSwapQuote = {
      pluginId: 'changenow',
      swapInfo: { isDex: false },
      isEstimate: false,
      fromNativeAmount: '1000',
      toNativeAmount: '10000'
    }
    const dex: TestSwapQuote = {
      pluginId: 'thorchain',
      swapInfo: { isDex: true },
      isEstimate: true,
      fromNativeAmount: '1000',
      toNativeAmount: '9000'
    }

    it('selects the preferred provider over a better rate', () => {
      expect(
        pickBestQuoteWithPreference([cheaper, pinned] as any, {
          preferPluginId: 'changenow'
        })
      ).toEqual(pinned)
    })

    it('ranks the preferred provider above the DEX/CEX preference', () => {
      expect(
        pickBestQuoteWithPreference([cheaper, pinned, dex] as any, {
          preferPluginId: 'changenow',
          preferType: 'DEX'
        })
      ).toEqual(pinned)
    })

    it('falls back to the best rate when the preferred provider has no quote', () => {
      expect(
        pickBestQuoteWithPreference([cheaper, pinned] as any, {
          preferPluginId: 'godex'
        })
      ).toEqual(cheaper)
    })

    it('keeps honoring the DEX/CEX preference without a preferred provider', () => {
      expect(
        pickBestQuoteWithPreference([cheaper, pinned, dex] as any, {
          preferType: 'DEX'
        })
      ).toEqual(dex)
    })

    it('picks the best rate with no preferences at all', () => {
      expect(
        pickBestQuoteWithPreference([cheaper, pinned, dex] as any, {})
      ).toEqual(cheaper)
    })
  })
})

afterAll(async () => {
  await context?.close()
})

interface TestSwapQuote {
  pluginId?: string
  swapInfo: { isDex: boolean }
  isEstimate: boolean
  fromNativeAmount: string
  toNativeAmount: string
}
