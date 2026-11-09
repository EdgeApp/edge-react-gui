import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render, within } from '@testing-library/react-native'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator } from 'react-native'
import { sprintf } from 'sprintf-js'

import { RampCreateScene } from '../../components/scenes/RampCreateScene'
import { showToast } from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import {
  fakeBuyTabSceneProps,
  fakeSellTabSceneProps
} from '../../util/fake/fakeSceneProps'

jest.mock('../../components/services/AirshipInstance', () => ({
  ...jest.requireActual<object>('../../components/services/AirshipInstance'),
  showToast: jest.fn()
}))

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual<object>('@react-navigation/native'),
  useFocusEffect: () => {}
}))

jest.mock('../../hooks/useLinkPromoRelease', () => ({
  useLinkPromoRelease: () => {}
}))
jest.mock('../../hooks/useRampLastCryptoSelection', () => ({
  useRampLastCryptoSelection: () => ({
    isLoading: false,
    selection: { tokenId: null, walletId: 'btc' }
  })
}))
jest.mock('../../hooks/useRampPlugins', () => ({
  useRampPlugins: () => ({ data: [], isLoading: false })
}))
jest.mock('../../hooks/useRampPreferredProviders', () => ({
  useRampPreferredProviders: () => []
}))
jest.mock('../../hooks/useSupportedPlugins', () => ({
  useSupportedPlugins: () => ({
    error: null,
    isLoading: false,
    supportedPlugins: []
  })
}))
jest.mock('../../hooks/useTabBlur', () => ({ useTabBlur: () => {} }))

/** Records the amount each render would quote. */
const mockUseRampQuotes = jest.fn((_args: unknown) => ({
  errors: [],
  isFetching: false,
  isLoading: false,
  quotes: []
}))
jest.mock('../../hooks/useRampQuotes', () => ({
  useRampQuotes: (args: unknown) => mockUseRampQuotes(args)
}))

const lastAmountQuery = (): unknown => {
  const calls = mockUseRampQuotes.mock.calls as Array<
    [{ rampQuoteRequest?: { amountQuery: unknown } }]
  >
  return calls[calls.length - 1][0].rampQuoteRequest?.amountQuery
}

describe('RampCreateScene percent pills', () => {
  const btcConfig = makeFakeCurrencyConfig(btcCurrencyInfo)

  const renderScene = (
    direction: 'buy' | 'sell',
    balance: string = '100000000',
    getMaxSpendable?: () => Promise<string>
  ): ReturnType<typeof render> => {
    const wallet = {
      balanceMap: new Map([[null, balance]]),
      balances: { BTC: balance },
      currencyConfig: btcConfig,
      currencyInfo: btcConfig.currencyInfo,
      getAddresses: async () => [{ publicAddress: 'fakeAddress' }],
      getMaxSpendable,
      id: 'btc',
      name: 'My Bitcoin',
      watch: () => () => {}
    } as unknown as EdgeCurrencyWallet
    const rootState: FakeState = {
      ...fakeRootState,
      core: {
        account: {
          currencyConfig: { bitcoin: btcConfig },
          currencyWallets: { btc: wallet },
          watch: () => () => {}
        }
      },
      ui: {
        ...fakeRootState.ui,
        settings: {
          ...fakeRootState.ui?.settings,
          countryCode: 'NL',
          stateProvinceCode: undefined
        }
      }
    }
    const sceneProps =
      direction === 'buy'
        ? fakeBuyTabSceneProps('pluginListBuy', {})
        : fakeSellTabSceneProps('pluginListSell', {})
    return render(
      <FakeProviders initialState={rootState}>
        <RampCreateScene {...sceneProps} direction={direction} />
      </FakeProviders>
    )
  }

  beforeEach(() => {
    mockUseRampQuotes.mockClear()
    jest.mocked(showToast).mockClear()
  })

  it('fills the crypto amount with a share of the balance on sell', () => {
    const rendered = renderScene('sell')
    fireEvent.press(rendered.getByTestId('amountPercent25'))
    expect(lastAmountQuery()).toEqual({ exchangeAmount: '0.25' })
    expect(rendered.getByDisplayValue('0.25')).toBeTruthy()
    rendered.unmount()
  })

  it('replaces an earlier share with the newest pill', () => {
    const rendered = renderScene('sell')
    fireEvent.press(rendered.getByTestId('amountPercent25'))
    fireEvent.press(rendered.getByTestId('amountPercent75'))
    expect(lastAmountQuery()).toEqual({ exchangeAmount: '0.75' })
    rendered.unmount()
  })

  it('shows a toast when the share rounds to nothing', () => {
    const rendered = renderScene('sell', '1')
    fireEvent.press(rendered.getByTestId('amountPercent25'))
    expect(showToast).toHaveBeenCalledWith(
      lstrings.exchange_insufficient_funds_title
    )
    expect(rendered.queryByDisplayValue('0')).toBeNull()
    rendered.unmount()
  })

  it('keeps MAX and shows no pills on buy', () => {
    const rendered = renderScene('buy')
    expect(rendered.queryByTestId('amountPercent25')).toBeNull()
    expect(rendered.getByText(lstrings.trade_create_max)).toBeTruthy()
    rendered.unmount()
  })

  it('moves MAX into the 100 pill on sell', () => {
    const rendered = renderScene('sell')
    expect(rendered.queryByText(lstrings.trade_create_max)).toBeNull()
    expect(rendered.getByTestId('amountPercent100')).toBeTruthy()
    rendered.unmount()
  })

  it('shows a spinner in the 100 pill while the max computes', async () => {
    let resolveMax: (nativeAmount: string) => void = () => {}
    const getMaxSpendable = jest.fn(
      async () =>
        await new Promise<string>(resolve => {
          resolveMax = resolve
        })
    )
    const rendered = renderScene('sell', '100000000', getMaxSpendable)
    const label = sprintf(lstrings.percent_amount_1s, '100')
    const pill = (): ReturnType<typeof rendered.getByTestId> =>
      rendered.getByTestId('amountPercent100')

    expect(rendered.getByText(label)).toBeTruthy()
    expect(rendered.UNSAFE_queryAllByType(ActivityIndicator)).toHaveLength(0)

    await act(async () => {
      fireEvent.press(pill())
    })
    expect(getMaxSpendable).toHaveBeenCalledTimes(1)
    expect(within(pill()).UNSAFE_getByType(ActivityIndicator)).toBeTruthy()
    expect(rendered.queryByText(label)).toBeNull()

    // A second tap while the max computes starts nothing new:
    await act(async () => {
      fireEvent.press(pill())
    })
    expect(getMaxSpendable).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveMax('50000000')
    })
    expect(
      within(pill()).UNSAFE_queryAllByType(ActivityIndicator)
    ).toHaveLength(0)
    expect(rendered.getByText(label)).toBeTruthy()
    expect(lastAmountQuery()).toEqual({ maxExchangeAmount: '0.5' })
    rendered.unmount()
  })
})
