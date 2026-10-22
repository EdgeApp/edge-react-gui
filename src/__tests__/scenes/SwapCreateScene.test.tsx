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
import { Airship, showToast } from '../../components/services/AirshipInstance'
import { SwapInput } from '../../components/themed/SwapInput'
import { lstrings } from '../../locales/strings'
import type { EdgeAsset } from '../../types/types'
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
import { getStealthProviderName } from '../../util/stealthSwap'

jest.mock('../../components/services/AirshipInstance', () => ({
  ...jest.requireActual<object>('../../components/services/AirshipInstance'),
  showToast: jest.fn()
}))

jest.useRealTimers()

let context: EdgeContext | undefined
let account: EdgeAccount | undefined

/** The Stealth toggle's info line, naming the provider the way the scene does. */
const stealthInfo = (): string => {
  if (account == null) throw new Error('No account')
  return sprintf(lstrings.stealth_info_1s, getStealthProviderName(account))
}
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
  core: { account },
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
    expect(rendered.queryByText(stealthInfo(), { exact: false })).toBeNull()
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
    expect(rendered.queryByText(stealthInfo(), { exact: false })).toBeNull()
    rendered.unmount()
  })

  it('turns Stealth Swap on from the stealth param', () => {
    const rootState: FakeState = { ...servedState, core: { account } }
    const sceneProps = fakeSwapTabSceneProps('swapCreate', { stealth: true })
    const setParams = jest.spyOn(sceneProps.navigation, 'setParams')

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SwapCreateScene {...sceneProps} />
      </FakeProviders>
    )

    expect(rendered.getByText(stealthInfo(), { exact: false })).toBeTruthy()
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
      rendered.queryByText(stealthInfo(), { exact: false }) != null

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
  // A chain Houdini's served list leaves out:
  const ltcConfig = makeFakeCurrencyConfig({
    ...btcCurrencyInfo,
    currencyCode: 'LTC',
    displayName: 'Litecoin',
    pluginId: 'litecoin',
    walletType: 'wallet:litecoin'
  })
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

  interface RenderedSwap {
    navigate: ReturnType<typeof jest.spyOn>
    pickPair: (fromWalletId: string, toWalletId: string) => void
    /** The assets a wallet picker offers, or `undefined` for every asset. */
    pickerAssets: (side: 'from' | 'to') => Promise<EdgeAsset[] | undefined>
    pressMax: () => void
    reasonShown: (currencyCode: string) => boolean
    stealthArmed: () => boolean
    stealthDimmed: () => boolean
    toggleStealth: () => void
    unmount: () => void
  }

  const renderScene = (opts: {
    houdiniBans?: {
      source: Array<{ pluginId: string }>
      destination: Array<{ pluginId: string }>
    }
    stealthSwapEnabled?: boolean
    toWalletId?: string
  }): RenderedSwap => {
    const {
      houdiniBans = { source: [], destination: [] },
      stealthSwapEnabled = false,
      toWalletId = 'eth'
    } = opts
    const rootState: FakeState = {
      ...fakeRootState,
      core: {
        account: {
          currencyConfig: {
            bitcoin: btcConfig,
            ethereum: ethConfig,
            litecoin: ltcConfig
          },
          currencyWallets: {
            btc: makeWallet('btc', btcConfig),
            eth: makeWallet('eth', ethConfig),
            ltc: makeWallet('ltc', ltcConfig)
          },
          swapConfig: {},
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
        },
        settings: { ...fakeRootState.ui?.settings, stealthSwapEnabled }
      }
    }
    const sceneElement = (
      fromWalletId: string,
      toWalletId: string
    ): React.JSX.Element => (
      <FakeProviders initialState={rootState}>
        <SwapCreateScene
          {...fakeSwapTabSceneProps('swapCreate', { fromWalletId, toWalletId })}
        />
      </FakeProviders>
    )
    const navigate = jest.spyOn(fakeNavigation, 'navigate')
    const rendered = render(sceneElement('btc', toWalletId))
    const toggleProps = (): { disabled?: boolean } =>
      rendered.UNSAFE_getByProps({ label: lstrings.stealth_swap_toggle }).props
    return {
      navigate,
      pickPair: (fromWalletId, toWalletId) => {
        rendered.rerender(sceneElement(fromWalletId, toWalletId))
      },
      pickerAssets: async side => {
        let allowedAssets: EdgeAsset[] | undefined
        const show = jest
          .spyOn(Airship, 'show')
          .mockImplementationOnce(
            async (renderModal: (bridge: never) => React.ReactNode) => {
              const modal = renderModal(
                undefined as never
              ) as React.ReactElement<{ allowedAssets?: EdgeAsset[] }>
              allowedAssets = modal.props.allowedAssets
              return undefined
            }
          )
        const input = rendered
          .UNSAFE_getAllByType(SwapInput)
          .find(
            node =>
              node.props.walletPillTestID ===
              (side === 'from' ? 'swapFromWalletPill' : 'swapToWalletPill')
          )
        if (input == null) throw new Error(`No ${side} input`)
        await act(async () => {
          await input.props.onSelectWallet()
        })
        show.mockRestore()
        return allowedAssets
      },
      pressMax: () => {
        fireEvent.press(rendered.getByText(lstrings.string_max_cap))
      },
      reasonShown: currencyCode =>
        rendered.queryByText(
          sprintf(lstrings.stealth_asset_unsupported_1s, currencyCode)
        ) != null,
      stealthArmed: () =>
        rendered.queryByText(stealthInfo(), { exact: false }) != null,
      stealthDimmed: () => toggleProps().disabled === true,
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
    mockSetStealthSwapEnabled.mockReset()
  })

  it('quotes a Houdini-banned source when Stealth Swap is off', () => {
    const scene = renderScene({
      houdiniBans: { source: [{ pluginId: 'bitcoin' }], destination: [] }
    })
    scene.pressMax()
    expect(showToast).not.toHaveBeenCalled()
    expect(scene.navigate).toHaveBeenCalledWith(
      'swapProcessing',
      expect.anything()
    )
    scene.unmount()
  })

  it('dims a saved Stealth Swap off on a Houdini-banned source', () => {
    const scene = renderScene({
      houdiniBans: { source: [{ pluginId: 'bitcoin' }], destination: [] },
      stealthSwapEnabled: true
    })
    expect(scene.stealthDimmed()).toBe(true)
    expect(scene.stealthArmed()).toBe(false)
    expect(scene.reasonShown('BTC')).toBe(true)

    // A tap explains the block, and neither arms nor saves:
    scene.toggleStealth()
    expect(showToast).toHaveBeenCalledWith(
      sprintf(lstrings.stealth_asset_unsupported_1s, 'BTC')
    )
    expect(scene.stealthArmed()).toBe(false)
    expect(mockSetStealthSwapEnabled).not.toHaveBeenCalled()

    // The pair quotes as an ordinary swap:
    scene.pressMax()
    // The spy types its calls after navigate's last overload, an options
    // object, while the scene calls the (name, params) overload:
    const calls = scene.navigate.mock.calls as unknown as Array<
      [string, unknown]
    >
    const processingCall = calls.find(call => call[0] === 'swapProcessing')
    const processingParams = processingCall?.[1] as SwapProcessingParams
    expect(processingParams.swapRequest.privacy).toBeUndefined()
    scene.unmount()
  })

  it('dims Stealth Swap on a Houdini-banned destination', () => {
    const scene = renderScene({
      houdiniBans: { source: [], destination: [{ pluginId: 'ethereum' }] }
    })
    expect(scene.stealthDimmed()).toBe(true)
    expect(scene.reasonShown('ETH')).toBe(true)
    scene.toggleStealth()
    expect(showToast).toHaveBeenCalledWith(
      sprintf(lstrings.stealth_asset_unsupported_1s, 'ETH')
    )
    expect(scene.stealthArmed()).toBe(false)
    expect(mockSetStealthSwapEnabled).not.toHaveBeenCalled()
    scene.unmount()
  })

  it('dims Stealth Swap on a side Houdini does not serve', () => {
    const scene = renderScene({ toWalletId: 'ltc' })
    expect(scene.stealthDimmed()).toBe(true)
    expect(scene.reasonShown('LTC')).toBe(true)
    scene.toggleStealth()
    expect(showToast).toHaveBeenCalledWith(
      sprintf(lstrings.stealth_asset_unsupported_1s, 'LTC')
    )
    expect(mockSetStealthSwapEnabled).not.toHaveBeenCalled()
    scene.unmount()
  })

  it('returns to the saved choice once the pair can route', () => {
    const scene = renderScene({ stealthSwapEnabled: true, toWalletId: 'ltc' })
    expect(scene.stealthArmed()).toBe(false)
    expect(scene.reasonShown('LTC')).toBe(true)

    scene.pickPair('btc', 'eth')
    expect(scene.stealthDimmed()).toBe(false)
    expect(scene.stealthArmed()).toBe(true)
    expect(scene.reasonShown('LTC')).toBe(false)
    expect(mockSetStealthSwapEnabled).not.toHaveBeenCalled()
    scene.unmount()
  })

  it('leaves out of each Stealth picker what Houdini is banned for there', async () => {
    const scene = renderScene({
      houdiniBans: { source: [{ pluginId: 'ethereum' }], destination: [] },
      stealthSwapEnabled: true
    })
    expect(scene.stealthArmed()).toBe(true)

    // ETH may still be received, but picking it to send would only turn
    // Stealth off, so the sending picker does not offer it:
    const fromAssets = await scene.pickerAssets('from')
    const toAssets = await scene.pickerAssets('to')
    expect(fromAssets).toContainEqual({ pluginId: 'bitcoin', tokenId: null })
    expect(fromAssets).not.toContainEqual({
      pluginId: 'ethereum',
      tokenId: null
    })
    expect(toAssets).toContainEqual({ pluginId: 'ethereum', tokenId: null })
    scene.unmount()
  })
})
