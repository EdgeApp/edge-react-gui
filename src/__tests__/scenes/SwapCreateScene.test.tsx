import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import { act, fireEvent, render } from '@testing-library/react-native'
import { asDate, asObject, asOptional, asString, asUnknown } from 'cleaners'
import {
  addEdgeCorePlugins,
  type EdgeAccount,
  type EdgeContext,
  type EdgeCurrencyWallet,
  lockEdgeCorePlugins,
  makeFakeEdgeWorld
} from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import type { SwapConfirmationParams } from '../../components/scenes/SwapConfirmationScene'
import { SwapCreateScene } from '../../components/scenes/SwapCreateScene'
import type { SwapProcessingParams } from '../../components/scenes/SwapProcessingScene'
import { showToast } from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import { makeFakePlugin } from '../../util/fake/fakeCurrencyPlugin'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import {
  fakeNavigation,
  fakeSwapTabSceneProps
} from '../../util/fake/fakeSceneProps'
import fakeUser from '../../util/fake/fakeUserDump.json'
import { asHoudiniChains } from '../../util/houdiniChains'

jest.mock('../../components/services/AirshipInstance', () => ({
  ...jest.requireActual<object>('../../components/services/AirshipInstance'),
  showToast: jest.fn()
}))

jest.useRealTimers()

let context: EdgeContext | undefined
let account: EdgeAccount | undefined
let btcWallet: EdgeCurrencyWallet | undefined
let ethWallet: EdgeCurrencyWallet | undefined

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

beforeAll(async () => {
  const dump = asUserDump(fakeUser)
  addEdgeCorePlugins({
    bitcoin: makeFakePlugin(btcCurrencyInfo),
    ethereum: makeFakePlugin(ethCurrencyInfo)
  })
  lockEdgeCorePlugins()

  const world = await makeFakeEdgeWorld([dump.data], {})
  context = await world.makeEdgeContext({
    apiKey: '',
    appId: '',
    plugins: { bitcoin: true, ethereum: true }
  })
  account = await context.loginWithKey('bob', dump.loginKey)
  const btcInfo = account.getFirstWalletInfo('wallet:bitcoin')
  const ethInfo = account.getFirstWalletInfo('wallet:ethereum')
  if (btcInfo == null || ethInfo == null) {
    throw new Error('Unable to get wallet infos')
  }
  btcWallet = await account.waitForCurrencyWallet(btcInfo.id)
  ethWallet = await account.waitForCurrencyWallet(ethInfo.id)
})

afterAll(async () => {
  await context?.close()
})

const mockSetStealthSwapEnabled = jest.fn()
jest.mock('../../actions/SettingsActions', () => ({
  ...jest.requireActual<object>('../../actions/SettingsActions'),
  setStealthSwapEnabled: (...args: unknown[]) => {
    mockSetStealthSwapEnabled(...args)
    return async () => {}
  }
}))

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

/** A root state with Houdini's served list loaded. */
const servedState: FakeState = {
  ...fakeRootState,
  ui: { ...fakeRootState.ui, houdiniChains }
}

/** A root state whose account saved `stealthSwapEnabled`. */
const savedState = (stealthSwapEnabled: boolean): FakeState => ({
  ...servedState,
  ui: {
    ...servedState.ui,
    settings: { ...fakeRootState.ui?.settings, stealthSwapEnabled }
  }
})

describe('SwapCreateScene', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render with loading props', () => {
    const rootState: FakeState = servedState

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SwapCreateScene {...fakeSwapTabSceneProps('swapCreate', {})} />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('asks for an ordinary swap after the Stealth terms are declined', async () => {
    if (btcWallet == null || ethWallet == null) throw new Error('No wallets')
    mockSetStealthSwapEnabled.mockReset()
    const rootState: FakeState = { ...servedState, core: { account } }
    const navigate = jest
      .spyOn(fakeNavigation, 'navigate')
      .mockImplementation(() => undefined)
    const replace = jest
      .spyOn(fakeNavigation, 'replace')
      .mockImplementation(() => undefined)

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SwapCreateScene
          {...fakeSwapTabSceneProps('swapCreate', {
            fromWalletId: btcWallet.id,
            fromTokenId: null,
            toWalletId: ethWallet.id,
            toTokenId: null
          })}
        />
      </FakeProviders>
    )

    // The scene's last quote request, as handed to the processing scene:
    const lastProcessingParams = (): SwapProcessingParams => {
      // The spy types its calls after navigate's last overload, an options
      // object, while the scene calls the (name, params) overload:
      const calls = navigate.mock.calls as unknown as Array<[string, unknown]>
      const processingCalls = calls.filter(call => call[0] === 'swapProcessing')
      return processingCalls[
        processingCalls.length - 1
      ][1] as SwapProcessingParams
    }

    fireEvent.press(rendered.getByText(lstrings.stealth_swap_toggle))
    fireEvent.press(rendered.getByText(lstrings.string_max_cap))
    const stealthParams = lastProcessingParams()
    expect(stealthParams.swapRequest.privacy).toBe('required')

    // The quotes arrive, and the confirmation scene's terms decline calls back.
    // The create scene only forwards the quotes, so none are needed:
    await act(async () => {
      stealthParams.onDone([])
    })
    const confirmationCall = replace.mock.calls.find(
      call => call[0] === 'swapConfirmation'
    )
    const confirmationParams = confirmationCall?.[1] as SwapConfirmationParams
    await act(async () => {
      confirmationParams.onStealthTermsDeclined?.()
    })

    fireEvent.press(rendered.getByText(lstrings.string_max_cap))
    const nextParams = lastProcessingParams()
    expect(nextParams).not.toBe(stealthParams)
    expect(nextParams.swapRequest.privacy).toBeUndefined()
    expect(nextParams.swapRequestOptions.forceEnabled).toBeUndefined()
    // Only the tap saves. The decline turns the toggle off for this visit:
    expect(mockSetStealthSwapEnabled).toHaveBeenCalledTimes(1)
    expect(mockSetStealthSwapEnabled.mock.calls[0][1]).toBe(true)
    rendered.unmount()
  })

  it('offers the Stealth Swap toggle before any wallet is picked', () => {
    const rootState: FakeState = servedState

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SwapCreateScene {...fakeSwapTabSceneProps('swapCreate', {})} />
      </FakeProviders>
    )

    expect(rendered.getByText(lstrings.stealth_swap_toggle)).toBeTruthy()
    expect(
      rendered.queryByText(lstrings.stealth_swap_info, { exact: false })
    ).toBeNull()
    rendered.unmount()
  })

  it('hides the Stealth Swap toggle until Houdini serves its list', () => {
    const rendered = render(
      <FakeProviders initialState={{ ...fakeRootState }}>
        <SwapCreateScene
          {...fakeSwapTabSceneProps('swapCreate', { stealth: true })}
        />
      </FakeProviders>
    )

    // A stealth param or saved choice cannot arm a swap Houdini cannot route:
    expect(rendered.queryByText(lstrings.stealth_swap_toggle)).toBeNull()
    expect(
      rendered.queryByText(lstrings.stealth_swap_info, { exact: false })
    ).toBeNull()
    rendered.unmount()
  })

  it('turns Stealth Swap on from the stealth param', () => {
    const rootState: FakeState = servedState
    const sceneProps = fakeSwapTabSceneProps('swapCreate', { stealth: true })
    const setParams = jest.spyOn(sceneProps.navigation, 'setParams')

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SwapCreateScene {...sceneProps} />
      </FakeProviders>
    )

    expect(
      rendered.getByText(lstrings.stealth_swap_info, { exact: false })
    ).toBeTruthy()
    // The param is consumed, so later param merges cannot re-apply it:
    expect(setParams).toHaveBeenCalledWith({ stealth: undefined })
    rendered.unmount()
    // The fake navigation is shared by every test in the file:
    setParams.mockRestore()
  })

  describe('saved Stealth Swap choice', () => {
    beforeEach(() => {
      mockSetStealthSwapEnabled.mockReset()
    })

    const infoShown = (rendered: ReturnType<typeof render>): boolean =>
      rendered.queryByText(lstrings.stealth_swap_info, { exact: false }) != null

    it('starts from the saved choice', () => {
      const on = render(
        <FakeProviders initialState={savedState(true)}>
          <SwapCreateScene {...fakeSwapTabSceneProps('swapCreate', {})} />
        </FakeProviders>
      )
      expect(infoShown(on)).toBe(true)
      on.unmount()

      const off = render(
        <FakeProviders initialState={savedState(false)}>
          <SwapCreateScene {...fakeSwapTabSceneProps('swapCreate', {})} />
        </FakeProviders>
      )
      expect(infoShown(off)).toBe(false)
      off.unmount()
    })

    it('lets the stealth param override the saved choice without saving it', () => {
      const rendered = render(
        <FakeProviders initialState={savedState(true)}>
          <SwapCreateScene
            {...fakeSwapTabSceneProps('swapCreate', { stealth: false })}
          />
        </FakeProviders>
      )

      expect(infoShown(rendered)).toBe(false)
      expect(mockSetStealthSwapEnabled).not.toHaveBeenCalled()
      rendered.unmount()
    })

    it('saves the choice a tap makes', () => {
      const rendered = render(
        <FakeProviders initialState={savedState(false)}>
          <SwapCreateScene {...fakeSwapTabSceneProps('swapCreate', {})} />
        </FakeProviders>
      )

      fireEvent.press(rendered.getByText(lstrings.stealth_swap_toggle))
      expect(infoShown(rendered)).toBe(true)
      expect(mockSetStealthSwapEnabled).toHaveBeenCalledTimes(1)
      expect(mockSetStealthSwapEnabled.mock.calls[0][1]).toBe(true)
      rendered.unmount()
    })

    it('drops the param override when the user leaves the swap tab', () => {
      // A tab navigator that has moved to another tab, with its blur handler
      // captured so the test can fire it:
      let leaveTab: () => void = () => {}
      const sceneProps = fakeSwapTabSceneProps('swapCreate', { stealth: true })
      const getParent = jest
        .spyOn(sceneProps.navigation, 'getParent')
        .mockReturnValue({
          addListener: (event: string, callback: () => void) => {
            leaveTab = callback
            return () => {}
          },
          getState: () => ({ index: 0, routes: [{ name: 'walletsTab' }] })
        })

      const rendered = render(
        <FakeProviders initialState={savedState(false)}>
          <SwapCreateScene {...sceneProps} />
        </FakeProviders>
      )
      expect(infoShown(rendered)).toBe(true)

      act(() => {
        leaveTab()
      })
      expect(infoShown(rendered)).toBe(false)
      expect(mockSetStealthSwapEnabled).not.toHaveBeenCalled()
      rendered.unmount()
      // The fake navigation is shared by every test in the file:
      getParent.mockRestore()
    })

    it('applies a stealth param that arrives after the tab mounted', () => {
      // The swap tab stays mounted, so a link reaches it as new params on a
      // scene that already rendered with none:
      const sceneProps = fakeSwapTabSceneProps('swapCreate', {})
      const setParams = jest.spyOn(sceneProps.navigation, 'setParams')

      const rendered = render(
        <FakeProviders initialState={savedState(false)}>
          <SwapCreateScene {...sceneProps} />
        </FakeProviders>
      )
      expect(infoShown(rendered)).toBe(false)

      rendered.rerender(
        <FakeProviders initialState={savedState(false)}>
          <SwapCreateScene
            {...fakeSwapTabSceneProps('swapCreate', { stealth: true })}
          />
        </FakeProviders>
      )
      expect(infoShown(rendered)).toBe(true)
      expect(setParams).toHaveBeenCalledWith({ stealth: undefined })
      expect(mockSetStealthSwapEnabled).not.toHaveBeenCalled()
      rendered.unmount()
      setParams.mockRestore()
    })
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
