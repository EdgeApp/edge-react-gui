import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react-native'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { SwapCreateScene } from '../../components/scenes/SwapCreateScene'
import { showToast } from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeSwapTabSceneProps } from '../../util/fake/fakeSceneProps'
import { asHoudiniChains } from '../../util/houdiniChains'

jest.mock('../../components/services/AirshipInstance', () => ({
  ...jest.requireActual<object>('../../components/services/AirshipInstance'),
  showToast: jest.fn()
}))

describe('SwapCreateScene', () => {
  it('should render with loading props', () => {
    const rootState: FakeState = { ...fakeRootState }

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SwapCreateScene {...fakeSwapTabSceneProps('swapCreate', {})} />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})

describe('SwapCreateScene Stealth Swap bans', () => {
  const btcConfig = makeFakeCurrencyConfig(btcCurrencyInfo)
  const ethConfig = makeFakeCurrencyConfig(ethCurrencyInfo)
  const makeWallet = (
    id: string,
    currencyConfig: typeof btcConfig
  ): EdgeCurrencyWallet =>
    ({
      balanceMap: new Map([[null, '100000000']]),
      balances: { [currencyConfig.currencyInfo.currencyCode]: '100000000' },
      currencyConfig,
      currencyInfo: currencyConfig.currencyInfo,
      enabledTokenIds: [],
      fiatCurrencyCode: 'iso:USD',
      id,
      name: id,
      type: currencyConfig.currencyInfo.walletType,
      watch: () => () => {}
    } as unknown as EdgeCurrencyWallet)

  // Houdini's served list, without which the scene hides the toggle:
  const houdiniChains = asHoudiniChains({
    bitcoin: {
      memoNeeded: false,
      addressValidation: '^bc1[a-z0-9]{39}$',
      coin: { hasSelfPrivate: true },
      tokens: {}
    },
    ethereum: {
      memoNeeded: false,
      addressValidation: '^0x[0-9A-Fa-f]{40}$',
      coin: { hasSelfPrivate: true },
      tokens: {}
    }
  })

  const renderScene = (houdiniBans: {
    source: Array<{ pluginId: string }>
    destination: Array<{ pluginId: string }>
  }): {
    navigate: ReturnType<typeof jest.spyOn>
    pressMax: () => void
    toggleStealth: () => void
    unmount: () => void
  } => {
    const rootState: FakeState = {
      ...fakeRootState,
      core: {
        account: {
          currencyConfig: { bitcoin: btcConfig, ethereum: ethConfig },
          currencyWallets: {
            btc: makeWallet('btc', btcConfig),
            eth: makeWallet('eth', ethConfig)
          },
          watch: () => () => {}
        }
      },
      ui: {
        ...fakeRootState.ui,
        houdiniChains,
        exchangeInfo: {
          swap: {
            disableAssets: { source: [], destination: [] },
            disableAssetsByPlugin: { houdini: houdiniBans },
            disablePlugins: {}
          }
        }
      }
    }
    const props = fakeSwapTabSceneProps('swapCreate', {
      fromWalletId: 'btc',
      toWalletId: 'eth'
    })
    const navigate = jest.spyOn(props.navigation, 'navigate')
    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SwapCreateScene {...props} />
      </FakeProviders>
    )
    return {
      navigate,
      pressMax: () => {
        fireEvent.press(rendered.getByText(lstrings.string_max_cap))
      },
      toggleStealth: () => {
        fireEvent.press(rendered.getByText(lstrings.stealth_swap_toggle))
      },
      unmount: () => {
        rendered.unmount()
        navigate.mockRestore()
      }
    }
  }

  beforeEach(() => {
    jest.mocked(showToast).mockClear()
  })

  it('quotes a Houdini-banned source when Stealth Swap is off', () => {
    const scene = renderScene({
      source: [{ pluginId: 'bitcoin' }],
      destination: []
    })
    scene.pressMax()
    expect(showToast).not.toHaveBeenCalled()
    expect(scene.navigate).toHaveBeenCalledWith(
      'swapProcessing',
      expect.anything()
    )
    scene.unmount()
  })

  it('refuses a Houdini-banned source with Stealth Swap on', () => {
    const scene = renderScene({
      source: [{ pluginId: 'bitcoin' }],
      destination: []
    })
    scene.toggleStealth()
    scene.pressMax()
    expect(showToast).toHaveBeenCalledWith(
      sprintf(
        lstrings.swap_token_no_enabled_exchanges_2s,
        'BTC',
        btcCurrencyInfo.displayName
      )
    )
    expect(scene.navigate).not.toHaveBeenCalledWith(
      'swapProcessing',
      expect.anything()
    )
    scene.unmount()
  })

  it('refuses a Houdini-banned destination with Stealth Swap on', () => {
    const scene = renderScene({
      source: [],
      destination: [{ pluginId: 'ethereum' }]
    })
    scene.toggleStealth()
    scene.pressMax()
    expect(showToast).toHaveBeenCalledWith(
      sprintf(
        lstrings.swap_token_no_enabled_exchanges_2s,
        'ETH',
        ethCurrencyInfo.displayName
      )
    )
    expect(scene.navigate).not.toHaveBeenCalledWith(
      'swapProcessing',
      expect.anything()
    )
    scene.unmount()
  })
})
