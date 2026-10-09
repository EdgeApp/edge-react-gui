import {
  afterAll,
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
import { ScrollView, StyleSheet } from 'react-native'
import { sprintf } from 'sprintf-js'

import {
  SendScene2,
  type SendScene2Params
} from '../../components/scenes/SendScene2'
import { Airship } from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import { avaxCurrencyInfo } from '../../util/fake/fakeAvaxInfo'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakePlugin } from '../../util/fake/fakeCurrencyPlugin'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'
import fakeUser from '../../util/fake/fakeUserDump.json'
import { asHoudiniChains, type HoudiniChains } from '../../util/houdiniChains'

jest.useRealTimers()

type TestInstance = ReturnType<typeof render>['UNSAFE_root']

const mockSetStealthSendEnabled = jest.fn()
jest.mock('../../actions/SettingsActions', () => ({
  ...jest.requireActual<object>('../../actions/SettingsActions'),
  setStealthSendEnabled: (...args: unknown[]) => {
    mockSetStealthSendEnabled(...args)
    return async () => {}
  }
}))

const USDT_TOKEN_ID = 'dac17f958d2ee523a2206206994597c13d831ec7'

/**
 * Houdini's served list, without which the scene offers no "Recipient
 * receives" row and no Stealth toggle. Each chain named in `noSelfPrivate`
 * reports no private route from its coin to itself, so a test can make a
 * wallet ineligible for a same-asset Stealth Send.
 */
const makeHoudiniChains = (noSelfPrivate: string[] = []): HoudiniChains =>
  asHoudiniChains({
    bitcoin: {
      memoNeeded: false,
      addressValidation:
        '^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39}|bc1[a-z0-9]{59})$',
      coin: { hasSelfPrivate: !noSelfPrivate.includes('bitcoin') },
      tokens: {}
    },
    ethereum: {
      memoNeeded: false,
      addressValidation: '^(0x)[0-9A-Za-z]{40}$',
      coin: { hasSelfPrivate: !noSelfPrivate.includes('ethereum') },
      tokens: { [USDT_TOKEN_ID]: { hasSelfPrivate: true } }
    }
  })
const houdiniChains = makeHoudiniChains()

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
    ethereum: makeFakePlugin(ethCurrencyInfo),
    avalanche: makeFakePlugin(avaxCurrencyInfo)
  }

  addEdgeCorePlugins(allPlugins)
  lockEdgeCorePlugins()

  const world = await makeFakeEdgeWorld(fakeUsers, {})
  context = await world.makeEdgeContext({
    apiKey: '',
    appId: '',
    plugins: { bitcoin: true, ethereum: true, avalanche: true }
  })
  account = await context.loginWithKey('bob', loginKey)
  const btcInfo = account.getFirstWalletInfo('wallet:bitcoin')

  // For use later when we need tests that use EVM currencies
  // const ethInfo = await account.getFirstWalletInfo('wallet:ethereum')
  // const avaxInfo = await account.getFirstWalletInfo('wallet:avalanche')

  if (
    btcInfo == null
    // || ethInfo == null
    // || avaxInfo == null
  ) {
    console.error('Unable to get wallet infos')
    process.exit(-1)
  }
  btcWallet = await account.waitForCurrencyWallet(btcInfo.id)

  const ethInfo = account.getFirstWalletInfo('wallet:ethereum')
  if (ethInfo != null) {
    ethWallet = await account.waitForCurrencyWallet(ethInfo.id)
  }

  // For use later when we need tests that use EVM currencies
  // ethWallet = await account.waitForCurrencyWallet(ethInfo.id)
  // avaxWallet = await account.waitForCurrencyWallet(avaxInfo.id)
})

describe('SendScene2', () => {
  it('Render SendScene', () => {
    if (btcWallet == null) return

    const rootState: FakeState = {
      ...fakeRootState,
      core: { account },
      ui: { ...fakeRootState.ui, houdiniChains }
    }

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SendScene2
          {...fakeEdgeAppSceneProps('send2', {
            walletId: btcWallet.id,
            tokenId: null,
            doCheckAndShowGetCryptoModal: false
          })}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
  it('1 spendTarget', () => {
    if (btcWallet == null) return

    const rootState: FakeState = {
      ...fakeRootState,
      core: { account },
      ui: { ...fakeRootState.ui, houdiniChains }
    }

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SendScene2
          {...fakeEdgeAppSceneProps('send2', {
            walletId: btcWallet.id,
            tokenId: null,
            spendInfo: {
              tokenId: null,
              spendTargets: [
                { publicAddress: 'some pub address', nativeAmount: '1234' }
              ]
            },
            doCheckAndShowGetCryptoModal: false
          })}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
  it('1 spendTarget with info tiles', () => {
    if (btcWallet == null) return

    const rootState: FakeState = {
      ...fakeRootState,
      core: { account },
      ui: { ...fakeRootState.ui, houdiniChains }
    }

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SendScene2
          {...fakeEdgeAppSceneProps('send2', {
            infoTiles: [
              { label: 'info tile label 1', value: 'info tile value 1' },
              { label: 'info tile label 2', value: 'info tile value 2' }
            ],
            walletId: btcWallet.id,
            tokenId: null,
            spendInfo: {
              tokenId: null,
              spendTargets: [
                { publicAddress: 'some pub address', nativeAmount: '1234' }
              ]
            },
            doCheckAndShowGetCryptoModal: false
          })}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
  it('2 spendTargets', () => {
    if (btcWallet == null) return

    const rootState: FakeState = {
      ...fakeRootState,
      core: { account },
      ui: { ...fakeRootState.ui, houdiniChains }
    }

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SendScene2
          {...fakeEdgeAppSceneProps('send2', {
            walletId: btcWallet.id,
            tokenId: null,
            spendInfo: {
              tokenId: null,
              spendTargets: [
                { publicAddress: 'some pub address', nativeAmount: '1234' },
                { publicAddress: 'some pub address 2', nativeAmount: '12345' }
              ]
            },
            doCheckAndShowGetCryptoModal: false
          })}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('2 spendTargets hide tiles', () => {
    if (btcWallet == null) return

    const rootState: FakeState = {
      ...fakeRootState,
      core: { account },
      ui: { ...fakeRootState.ui, houdiniChains }
    }

    const params: SendScene2Params = {
      hiddenFeaturesMap: { address: true },
      walletId: btcWallet.id,
      tokenId: null,
      spendInfo: {
        tokenId: null,
        spendTargets: [
          { publicAddress: 'some pub address', nativeAmount: '1234' },
          { publicAddress: 'some pub address 2', nativeAmount: '12345' }
        ]
      },
      doCheckAndShowGetCryptoModal: false
    }

    // Hide Address
    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SendScene2 {...fakeEdgeAppSceneProps('send2', params)} />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()

    // Hide Amount
    params.hiddenFeaturesMap = { amount: true }
    const rendered2 = render(
      <FakeProviders initialState={rootState}>
        <SendScene2 {...fakeEdgeAppSceneProps('send2', params)} />
      </FakeProviders>
    )
    expect(rendered2.toJSON()).toMatchSnapshot()

    // Hide Both
    params.hiddenFeaturesMap = { amount: true, address: true }
    const rendered3 = render(
      <FakeProviders initialState={rootState}>
        <SendScene2 {...fakeEdgeAppSceneProps('send2', params)} />
      </FakeProviders>
    )
    expect(rendered3.toJSON()).toMatchSnapshot()
  })

  it('2 spendTargets lock tiles', () => {
    if (btcWallet == null) return

    const rootState: FakeState = {
      ...fakeRootState,
      core: { account },
      ui: { ...fakeRootState.ui, houdiniChains }
    }
    const params: SendScene2Params = {
      lockTilesMap: { address: true },
      walletId: btcWallet.id,
      tokenId: null,
      spendInfo: {
        tokenId: null,
        spendTargets: [
          { publicAddress: 'some pub address', nativeAmount: '1234' },
          { publicAddress: 'some pub address 2', nativeAmount: '12345' }
        ]
      },
      doCheckAndShowGetCryptoModal: false
    }

    // Lock Address
    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SendScene2 {...fakeEdgeAppSceneProps('send2', params)} />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()

    // Lock Amount
    params.lockTilesMap = { amount: true }
    const rendered2 = render(
      <FakeProviders initialState={rootState}>
        <SendScene2 {...fakeEdgeAppSceneProps('send2', params)} />
      </FakeProviders>
    )
    expect(rendered2.toJSON()).toMatchSnapshot()

    // Lock Both
    params.lockTilesMap = { amount: true, address: true }
    const rendered3 = render(
      <FakeProviders initialState={rootState}>
        <SendScene2 {...fakeEdgeAppSceneProps('send2', params)} />
      </FakeProviders>
    )
    expect(rendered3.toJSON()).toMatchSnapshot()
  })

  it('2 spendTargets with sats display denomination', () => {
    if (btcWallet == null) return

    const rootState: FakeState = {
      ...fakeRootState,
      core: { account },
      ui: {
        ...fakeRootState.ui,
        houdiniChains,
        settings: {
          ...fakeRootState.ui?.settings,
          denominationSettings: {
            ...fakeRootState.ui?.settings?.denominationSettings,
            bitcoin: { BTC: { name: 'sats', multiplier: '1', symbol: 's' } }
          }
        }
      }
    }

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SendScene2
          {...fakeEdgeAppSceneProps('send2', {
            walletId: btcWallet.id,
            tokenId: null,
            spendInfo: {
              tokenId: null,
              spendTargets: [
                { publicAddress: 'some pub address', nativeAmount: '1234' },
                { publicAddress: 'some pub address 2', nativeAmount: '12345' }
              ]
            },
            doCheckAndShowGetCryptoModal: false
          })}
        />
      </FakeProviders>
    )

    // The total's unit follows the display denomination, like its value:
    expect(rendered.getByText('13579 sats')).toBeTruthy()
    expect(rendered.queryByText('13579 BTC')).toBeNull()
    rendered.unmount()
  })

  it('hides the Stealth Send card and Recipient receives row with 2 spendTargets', () => {
    if (btcWallet == null) return

    const rootState: FakeState = {
      ...fakeRootState,
      core: { account },
      ui: { ...fakeRootState.ui, houdiniChains }
    }
    // No pre-filled address, so the scene is eligible for Stealth Send:
    const params: SendScene2Params = {
      walletId: btcWallet.id,
      tokenId: null,
      spendInfo: { tokenId: null, spendTargets: [{}] },
      doCheckAndShowGetCryptoModal: false
    }

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SendScene2 {...fakeEdgeAppSceneProps('send2', params)} />
      </FakeProviders>
    )
    expect(rendered.queryByText(lstrings.stealth_send_toggle)).not.toBeNull()
    expect(
      rendered.queryByText(lstrings.stealth_recipient_receives)
    ).not.toBeNull()
    rendered.unmount()

    params.spendInfo = { tokenId: null, spendTargets: [{}, {}] }
    const rendered2 = render(
      <FakeProviders initialState={rootState}>
        <SendScene2 {...fakeEdgeAppSceneProps('send2', params)} />
      </FakeProviders>
    )
    expect(rendered2.queryByText(lstrings.stealth_send_toggle)).toBeNull()
    expect(
      rendered2.queryByText(lstrings.stealth_recipient_receives)
    ).toBeNull()
    rendered2.unmount()
  })
  it('arms Stealth Send from the stealth param', () => {
    if (btcWallet == null) return

    const rootState: FakeState = {
      ...fakeRootState,
      core: { account },
      ui: { ...fakeRootState.ui, houdiniChains }
    }

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SendScene2
          {...fakeEdgeAppSceneProps('send2', {
            walletId: btcWallet.id,
            tokenId: null,
            stealth: true,
            doCheckAndShowGetCryptoModal: false
          })}
        />
      </FakeProviders>
    )

    expect(
      rendered.getByText(lstrings.stealth_send_info, { exact: false })
    ).toBeTruthy()
    rendered.unmount()
  })
  it('leaves Stealth Send off when the stealth param is absent', () => {
    if (btcWallet == null) return

    const rootState: FakeState = {
      ...fakeRootState,
      core: { account },
      ui: { ...fakeRootState.ui, houdiniChains }
    }

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SendScene2
          {...fakeEdgeAppSceneProps('send2', {
            walletId: btcWallet.id,
            tokenId: null,
            doCheckAndShowGetCryptoModal: false
          })}
        />
      </FakeProviders>
    )

    expect(rendered.getByText(lstrings.stealth_send_toggle)).toBeTruthy()
    expect(
      rendered.queryByText(lstrings.stealth_send_info, { exact: false })
    ).toBeNull()
    rendered.unmount()
  })
  it('arms nothing from the stealth param on an address-prefilled send', () => {
    if (btcWallet == null) return

    const rootState: FakeState = {
      ...fakeRootState,
      core: { account },
      ui: { ...fakeRootState.ui, houdiniChains }
    }

    // The toggle is not offered for a send that arrives with an address:
    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SendScene2
          {...fakeEdgeAppSceneProps('send2', {
            walletId: btcWallet.id,
            tokenId: null,
            spendInfo: {
              tokenId: null,
              spendTargets: [
                { publicAddress: 'some pub address', nativeAmount: '1234' }
              ]
            },
            stealth: true,
            doCheckAndShowGetCryptoModal: false
          })}
        />
      </FakeProviders>
    )

    expect(rendered.queryByText(lstrings.stealth_send_toggle)).toBeNull()
    expect(
      rendered.queryByText(lstrings.stealth_send_info, { exact: false })
    ).toBeNull()
    rendered.unmount()
  })
  it('pads the scroll content past the docked slider', () => {
    if (btcWallet == null) return

    const rootState: FakeState = { ...fakeRootState, core: { account } }

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SendScene2
          {...fakeEdgeAppSceneProps('send2', {
            walletId: btcWallet.id,
            tokenId: null,
            spendInfo: {
              tokenId: null,
              spendTargets: [
                { publicAddress: 'some pub address', nativeAmount: '1234' }
              ]
            },
            doCheckAndShowGetCryptoModal: false
          })}
        />
      </FakeProviders>
    )

    // The test renderer never lays out the dock, so report a height for it:
    const docks = rendered.UNSAFE_root.findAll(
      (node: TestInstance) =>
        typeof node.type !== 'string' &&
        node.props.onLayout != null &&
        node.findAll(
          (child: TestInstance) => child.props.onSlidingComplete != null
        ).length > 0
    )
    act(() => {
      fireEvent(docks[docks.length - 1], 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 100 } }
      })
    })
    const scroll = rendered.UNSAFE_getByType(ScrollView)
    expect(
      StyleSheet.flatten(scroll.props.contentContainerStyle).paddingBottom
    ).toBeGreaterThanOrEqual(100)
    rendered.unmount()
  })
})

describe('SendScene2 saved Stealth Send choice', () => {
  beforeEach(() => {
    mockSetStealthSendEnabled.mockReset()
  })

  /**
   * A root state whose account saved `stealthSendEnabled`, with the served
   * list reporting no private route to itself for each coin in
   * `noSelfPrivate`.
   */
  const savedState = (
    stealthSendEnabled: boolean,
    noSelfPrivate: string[] = []
  ): FakeState => ({
    ...fakeRootState,
    core: { account },
    ui: {
      ...fakeRootState.ui,
      houdiniChains: makeHoudiniChains(noSelfPrivate),
      settings: { ...fakeRootState.ui?.settings, stealthSendEnabled }
    }
  })

  const renderSend = (
    state: FakeState,
    params: Partial<SendScene2Params> = {}
  ): ReturnType<typeof render> =>
    render(
      <FakeProviders initialState={state}>
        <SendScene2
          {...fakeEdgeAppSceneProps('send2', {
            walletId: btcWallet?.id ?? '',
            tokenId: null,
            doCheckAndShowGetCryptoModal: false,
            ...params
          })}
        />
      </FakeProviders>
    )

  it('arms Stealth Send from the saved choice', () => {
    if (btcWallet == null) return

    const rendered = renderSend(savedState(true))

    expect(
      rendered.getByText(lstrings.stealth_send_info, { exact: false })
    ).toBeTruthy()
    // Seeding is not a tap, so it saves nothing:
    expect(mockSetStealthSendEnabled).not.toHaveBeenCalled()
    rendered.unmount()
  })

  it('arms Stealth Send from the saved choice once the served list lands', () => {
    if (btcWallet == null) return

    const props = fakeEdgeAppSceneProps('send2', {
      walletId: btcWallet.id,
      tokenId: null,
      doCheckAndShowGetCryptoModal: false
    })
    const scene = (state: FakeState): React.JSX.Element => (
      <FakeProviders initialState={state}>
        <SendScene2 {...props} />
      </FakeProviders>
    )
    const loaded = savedState(true)

    // Before the rollup the scene offers no toggle, so the mount seed arms
    // nothing:
    const rendered = render(
      scene({ ...loaded, ui: { ...loaded.ui, houdiniChains: new Map() } })
    )
    expect(rendered.queryByText(lstrings.stealth_send_toggle)).toBeNull()

    rendered.rerender(scene(loaded))
    expect(
      rendered.getByText(lstrings.stealth_send_info, { exact: false })
    ).toBeTruthy()
    expect(mockSetStealthSendEnabled).not.toHaveBeenCalled()
    rendered.unmount()
  })

  it('arms nothing from the saved choice on an address-prefilled send', () => {
    if (btcWallet == null) return

    const rendered = renderSend(savedState(true), {
      spendInfo: {
        tokenId: null,
        spendTargets: [{ publicAddress: 'some pub address' }]
      }
    })

    expect(rendered.queryByText(lstrings.stealth_send_toggle)).toBeNull()
    expect(
      rendered.queryByText(lstrings.stealth_send_info, { exact: false })
    ).toBeNull()
    rendered.unmount()
  })

  it('lets the stealth param override the saved choice without saving it', () => {
    if (btcWallet == null) return

    const armed = renderSend(savedState(false), { stealth: true })
    expect(
      armed.getByText(lstrings.stealth_send_info, { exact: false })
    ).toBeTruthy()
    armed.unmount()

    const off = renderSend(savedState(true), { stealth: false })
    expect(
      off.queryByText(lstrings.stealth_send_info, { exact: false })
    ).toBeNull()
    off.unmount()

    expect(mockSetStealthSendEnabled).not.toHaveBeenCalled()
  })

  it('saves the choice a tap makes', () => {
    if (btcWallet == null) return

    const rendered = renderSend(savedState(false))

    fireEvent.press(rendered.getByText(lstrings.stealth_send_toggle))
    expect(
      rendered.getByText(lstrings.stealth_send_info, { exact: false })
    ).toBeTruthy()
    expect(mockSetStealthSendEnabled).toHaveBeenLastCalledWith(account, true)

    fireEvent.press(rendered.getByText(lstrings.stealth_send_toggle))
    expect(
      rendered.queryByText(lstrings.stealth_send_info, { exact: false })
    ).toBeNull()
    expect(mockSetStealthSendEnabled).toHaveBeenLastCalledWith(account, false)
    expect(mockSetStealthSendEnabled).toHaveBeenCalledTimes(2)
    rendered.unmount()
  })

  /** Switch the scene's source wallet, or its asset, through its picker. */
  const switchWallet = async (
    rendered: ReturnType<typeof render>,
    walletId: string,
    tokenId: string | null = null
  ): Promise<void> => {
    const showSpy = jest
      .spyOn(Airship, 'show')
      .mockResolvedValue({ type: 'wallet', walletId, tokenId })
    await act(async () => {
      fireEvent.press(rendered.getByText(lstrings.send_scene_send_from_wallet))
    })
    showSpy.mockRestore()
  }

  it('re-seeds from the saved choice after a wallet change', async () => {
    if (btcWallet == null || ethWallet == null) return

    const rendered = renderSend(savedState(true))
    await switchWallet(rendered, ethWallet.id)

    // The switch resets the toggle, then the saved choice arms it again on
    // the new wallet:
    expect(rendered.getByText(/^My Ethereum \(ETH\)$/)).toBeTruthy()
    expect(
      rendered.getByText(lstrings.stealth_send_info, { exact: false })
    ).toBeTruthy()
    expect(mockSetStealthSendEnabled).not.toHaveBeenCalled()
    rendered.unmount()
  })

  it('keeps a tap made on this visit across a wallet change', async () => {
    if (btcWallet == null || ethWallet == null) return

    // The mocked writer leaves the store's saved value at true, so only the
    // visit's own record of the tap can keep the toggle off:
    const rendered = renderSend(savedState(true))
    fireEvent.press(rendered.getByText(lstrings.stealth_send_toggle))
    await switchWallet(rendered, ethWallet.id)

    expect(rendered.getByText(/^My Ethereum \(ETH\)$/)).toBeTruthy()
    expect(
      rendered.queryByText(lstrings.stealth_send_info, { exact: false })
    ).toBeNull()
    rendered.unmount()
  })
  describe('on a wallet that cannot go private', () => {
    /** The reason a refused tap toasts. A plain send shows no inline line. */
    const reasonFor = (currencyCode: string): string =>
      sprintf(lstrings.stealth_self_private_unsupported_1s, currencyCode)

    const infoShown = (rendered: ReturnType<typeof render>): boolean =>
      rendered.queryByText(lstrings.stealth_send_info, { exact: false }) != null

    it('opens off without a reason line, a toast or a save', () => {
      if (btcWallet == null) return
      const showSpy = jest.spyOn(Airship, 'show')

      const rendered = renderSend(savedState(true, ['bitcoin']))

      expect(rendered.getByText(lstrings.stealth_send_toggle)).toBeTruthy()
      expect(infoShown(rendered)).toBe(false)
      expect(rendered.queryByText(reasonFor('BTC'))).toBeNull()
      // Seeding skips a wallet it cannot arm, rather than tapping and being
      // refused:
      expect(showSpy).not.toHaveBeenCalled()
      expect(mockSetStealthSendEnabled).not.toHaveBeenCalled()
      showSpy.mockRestore()
      rendered.unmount()
    })

    it('toasts a refused tap and saves nothing', () => {
      if (btcWallet == null) return
      const showSpy = jest.spyOn(Airship, 'show').mockResolvedValue(undefined)

      const rendered = renderSend(savedState(false, ['bitcoin']))
      fireEvent.press(rendered.getByText(lstrings.stealth_send_toggle))

      expect(showSpy).toHaveBeenCalledTimes(1)
      expect(infoShown(rendered)).toBe(false)
      expect(mockSetStealthSendEnabled).not.toHaveBeenCalled()
      showSpy.mockRestore()
      rendered.unmount()
    })

    it('arms from the saved choice on the next wallet that can', async () => {
      if (btcWallet == null || ethWallet == null) return

      const rendered = renderSend(savedState(true, ['bitcoin']))
      expect(infoShown(rendered)).toBe(false)
      await switchWallet(rendered, ethWallet.id)

      expect(rendered.getByText(/^My Ethereum \(ETH\)$/)).toBeTruthy()
      expect(infoShown(rendered)).toBe(true)
      expect(mockSetStealthSendEnabled).not.toHaveBeenCalled()
      rendered.unmount()
    })

    it('arms from the stealth param on the next wallet that can', async () => {
      if (btcWallet == null || ethWallet == null) return

      const rendered = renderSend(savedState(false, ['bitcoin']), {
        stealth: true
      })
      expect(infoShown(rendered)).toBe(false)
      expect(rendered.queryByText(reasonFor('BTC'))).toBeNull()
      await switchWallet(rendered, ethWallet.id)

      expect(infoShown(rendered)).toBe(true)
      expect(mockSetStealthSendEnabled).not.toHaveBeenCalled()
      rendered.unmount()
    })

    it('re-seeds on a token switch within one wallet', async () => {
      if (ethWallet == null) return
      // ETH to itself is refused, while USDT has its own private route to
      // itself:
      const rendered = renderSend(savedState(true, ['ethereum']), {
        walletId: ethWallet.id
      })
      expect(infoShown(rendered)).toBe(false)
      expect(rendered.queryByText(reasonFor('ETH'))).toBeNull()
      await switchWallet(rendered, ethWallet.id, USDT_TOKEN_ID)

      expect(infoShown(rendered)).toBe(true)
      expect(mockSetStealthSendEnabled).not.toHaveBeenCalled()
      rendered.unmount()
    })
  })
})

afterAll(async () => {
  await context?.close()
})
