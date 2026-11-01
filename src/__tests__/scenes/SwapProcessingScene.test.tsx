import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, render } from '@testing-library/react-native'
import {
  type EdgeAccount,
  type EdgeCurrencyWallet,
  type EdgeSwapQuote,
  type EdgeSwapRequest,
  SwapAboveLimitError,
  SwapCurrencyError
} from 'edge-core-js'
import * as React from 'react'

import {
  SwapProcessingScene,
  type ToQuoteFallback
} from '../../components/scenes/SwapProcessingScene'
import { showToast } from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import {
  fakeNavigation,
  fakeSwapTabSceneProps
} from '../../util/fake/fakeSceneProps'

jest.mock('../../components/services/AirshipInstance', () => ({
  ...jest.requireActual<object>('../../components/services/AirshipInstance'),
  showToast: jest.fn()
}))

jest.useRealTimers()

const fromWallet = {
  id: 'fromWallet',
  currencyInfo: btcCurrencyInfo,
  currencyConfig: { allTokens: {}, currencyInfo: btcCurrencyInfo }
} as unknown as EdgeCurrencyWallet
const toWallet = {
  id: 'toWallet',
  currencyInfo: ethCurrencyInfo,
  currencyConfig: { allTokens: {}, currencyInfo: ethCurrencyInfo }
} as unknown as EdgeCurrencyWallet

const toRequest: EdgeSwapRequest = {
  fromTokenId: null,
  fromWallet,
  nativeAmount: '1000000000000000000',
  quoteFor: 'to',
  toTokenId: null,
  toWallet
}
const fromRequest: EdgeSwapRequest = {
  ...toRequest,
  nativeAmount: '4000000',
  quoteFor: 'from'
}

const quote = { pluginId: 'fakeSwap' } as unknown as EdgeSwapQuote
const currencyError = new SwapCurrencyError(
  { pluginId: 'fakeSwap', displayName: 'Fake', supportEmail: '' },
  toRequest
)

type FetchSwapQuotes = (request: EdgeSwapRequest) => Promise<EdgeSwapQuote[]>

interface SceneOpts {
  fetchSwapQuotes: FetchSwapQuotes
  toQuoteFallback?: ToQuoteFallback
  swapRequest?: EdgeSwapRequest
}

const renderScene = async (
  opts: SceneOpts
): Promise<{
  fetch: jest.Mock<FetchSwapQuotes>
  navigate: jest.SpiedFunction<typeof fakeNavigation.navigate>
  onDone: jest.Mock<(quotes: EdgeSwapQuote[]) => void>
}> => {
  const fetch = jest.fn(opts.fetchSwapQuotes)
  const onDone = jest.fn<(quotes: EdgeSwapQuote[]) => void>()
  const navigate = jest
    .spyOn(fakeNavigation, 'navigate')
    .mockImplementation(() => undefined)
  const account = { fetchSwapQuotes: fetch } as unknown as EdgeAccount
  const rootState: FakeState = { ...fakeRootState, core: { account } }

  render(
    <FakeProviders initialState={rootState}>
      <SwapProcessingScene
        {...fakeSwapTabSceneProps('swapProcessing', {
          swapRequest: opts.swapRequest ?? toRequest,
          swapRequestOptions: {},
          toQuoteFallback: opts.toQuoteFallback,
          onCancel: () => {},
          onDone
        })}
      />
    </FakeProviders>
  )
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  return { fetch, navigate, onDone }
}

/** The error the scene handed back to the create scene, as user-facing text. */
const shownErrorMessage = (
  navigate: jest.SpiedFunction<typeof fakeNavigation.navigate>
): string | undefined => {
  const calls = navigate.mock.calls as unknown as Array<
    [string, { params: { errorDisplayInfo?: { message: string } } }]
  >
  return calls[calls.length - 1]?.[1].params.errorDisplayInfo?.message
}

describe('SwapProcessingScene "to" quote fallback', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    jest.mocked(showToast).mockClear()
  })

  const makeFallback = (): ToQuoteFallback & {
    onSwitch: jest.Mock<() => void>
  } => ({ swapRequest: fromRequest, onSwitch: jest.fn() })

  it('leaves a quotable "to" request alone', async () => {
    const toQuoteFallback = makeFallback()
    const { fetch, onDone } = await renderScene({
      fetchSwapQuotes: async () => [quote],
      toQuoteFallback
    })

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(onDone).toHaveBeenCalledWith([quote])
    expect(toQuoteFallback.onSwitch).not.toHaveBeenCalled()
    expect(showToast).not.toHaveBeenCalled()
  })

  it('switches to the "from" quote when the route exists', async () => {
    const toQuoteFallback = makeFallback()
    const { fetch, onDone } = await renderScene({
      fetchSwapQuotes: async request => {
        if (request.quoteFor === 'to') throw currencyError
        return [quote]
      },
      toQuoteFallback
    })

    expect(fetch.mock.calls.map(call => call[0].quoteFor)).toEqual([
      'to',
      'from'
    ])
    expect(fetch.mock.calls[1][0].nativeAmount).toBe(fromRequest.nativeAmount)
    expect(onDone).toHaveBeenCalledWith([quote])
    expect(toQuoteFallback.onSwitch).toHaveBeenCalledTimes(1)
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(showToast).toHaveBeenCalledWith(
      lstrings.swap_fixed_to_unavailable_toast
    )
  })

  it('also switches when every provider declines without an error', async () => {
    const toQuoteFallback = makeFallback()
    const { onDone } = await renderScene({
      fetchSwapQuotes: async request =>
        request.quoteFor === 'to' ? [] : [quote],
      toQuoteFallback
    })

    expect(onDone).toHaveBeenCalledWith([quote])
    expect(toQuoteFallback.onSwitch).toHaveBeenCalledTimes(1)
  })

  it('keeps the amounts and reports the pair when neither direction routes', async () => {
    const toQuoteFallback = makeFallback()
    const { fetch, navigate, onDone } = await renderScene({
      fetchSwapQuotes: async () => {
        throw currencyError
      },
      toQuoteFallback
    })

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(onDone).not.toHaveBeenCalled()
    expect(toQuoteFallback.onSwitch).not.toHaveBeenCalled()
    expect(showToast).not.toHaveBeenCalled()
    expect(shownErrorMessage(navigate)).toBeDefined()
  })

  it('switches before reporting a limit on the new amount', async () => {
    const toQuoteFallback = makeFallback()
    const limitError = new SwapAboveLimitError(
      { pluginId: 'fakeSwap', displayName: 'Fake', supportEmail: '' },
      '100',
      'from'
    )
    const { navigate, onDone } = await renderScene({
      fetchSwapQuotes: async request => {
        if (request.quoteFor === 'to') throw currencyError
        throw limitError
      },
      toQuoteFallback
    })

    expect(onDone).not.toHaveBeenCalled()
    expect(toQuoteFallback.onSwitch).toHaveBeenCalledTimes(1)
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(shownErrorMessage(navigate)).toContain('0.000001')
  })

  it('does not retry an amount error on the "to" quote', async () => {
    const toQuoteFallback = makeFallback()
    const limitError = new SwapAboveLimitError(
      { pluginId: 'fakeSwap', displayName: 'Fake', supportEmail: '' },
      '100',
      'to'
    )
    const { fetch } = await renderScene({
      fetchSwapQuotes: async () => {
        throw limitError
      },
      toQuoteFallback
    })

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(toQuoteFallback.onSwitch).not.toHaveBeenCalled()
  })

  it('reports the provider error when there is no fallback', async () => {
    const { fetch, navigate } = await renderScene({
      fetchSwapQuotes: async () => {
        throw currencyError
      }
    })

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(showToast).not.toHaveBeenCalled()
    expect(shownErrorMessage(navigate)).toBeDefined()
  })
})
