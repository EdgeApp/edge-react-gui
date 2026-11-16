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
import { act, render } from '@testing-library/react-native'
import { asDate, asObject, asOptional, asString, asUnknown } from 'cleaners'
import {
  addEdgeCorePlugins,
  type EdgeAccount,
  type EdgeContext,
  type EdgeCurrencyWallet,
  type EdgeSwapPlugin,
  lockEdgeCorePlugins,
  makeFakeEdgeWorld,
  SwapCurrencyError
} from 'edge-core-js'
import * as React from 'react'

import type { RecipientAssetRow } from '../../components/modals/RecipientAssetListModal'
import { EdgeRow } from '../../components/rows/EdgeRow'
import { SendScene2 } from '../../components/scenes/SendScene2'
import { Airship } from '../../components/services/AirshipInstance'
import { AddressTile2 } from '../../components/tiles/AddressTile2'
import { SWAP_SEND_WARNING } from '../../constants/constantSettings'
import { lstrings } from '../../locales/strings'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakePlugin } from '../../util/fake/fakeCurrencyPlugin'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'
import fakeUser from '../../util/fake/fakeUserDump.json'
import { asHoudiniChains } from '../../util/houdiniChains'

jest.useRealTimers()

const mockSetStealthSendEnabled = jest.fn()
jest.mock('../../actions/SettingsActions', () => ({
  ...jest.requireActual<object>('../../actions/SettingsActions'),
  setStealthSendEnabled: (...args: unknown[]) => {
    mockSetStealthSendEnabled(...args)
    return async () => {}
  }
}))

const EVM_ADDRESS = '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e'
const USDT_TOKEN_ID = 'dac17f958d2ee523a2206206994597c13d831ec7'

const houdiniChains = asHoudiniChains({
  bitcoin: {
    memoNeeded: false,
    addressValidation: '^bc1[a-z0-9]{39}$',
    coin: { hasSelfPrivate: true },
    tokens: {}
  },
  ethereum: {
    memoNeeded: false,
    addressValidation: '^(0x)[0-9A-Za-z]{40}$',
    coin: { hasSelfPrivate: true },
    tokens: { [USDT_TOKEN_ID]: { hasSelfPrivate: true } }
  }
})

/**
 * The swap provider the sheet names. It declines every pair, so no quote
 * lands, which leaves the sheet and its decline as the only things a test
 * watches.
 */
const fakeHoudiniPlugin: EdgeSwapPlugin = {
  swapInfo: { pluginId: 'houdini', displayName: 'Houdini', supportEmail: '' },
  async fetchSwapQuote(request) {
    throw new SwapCurrencyError(fakeHoudiniPlugin.swapInfo, request)
  }
}

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

let context: EdgeContext | undefined
let account: EdgeAccount | undefined
let btcWallet: EdgeCurrencyWallet | undefined
let ethWallet: EdgeCurrencyWallet | undefined

beforeAll(async () => {
  const dump = asUserDump(fakeUser)
  addEdgeCorePlugins({
    bitcoin: makeFakePlugin(btcCurrencyInfo),
    ethereum: makeFakePlugin(ethCurrencyInfo),
    houdini: fakeHoudiniPlugin
  })
  lockEdgeCorePlugins()

  const world = await makeFakeEdgeWorld([dump.data], {})
  context = await world.makeEdgeContext({
    apiKey: '',
    appId: '',
    plugins: { bitcoin: true, ethereum: true, houdini: true }
  })
  account = await context.loginWithKey('bob', dump.loginKey)
  const btcInfo = account.getFirstWalletInfo('wallet:bitcoin')
  const ethInfo = account.getFirstWalletInfo('wallet:ethereum')
  if (btcInfo == null || ethInfo == null) {
    throw new Error('Unable to get wallet info')
  }
  btcWallet = await account.waitForCurrencyWallet(btcInfo.id)
  ethWallet = await account.waitForCurrencyWallet(ethInfo.id)
})

afterAll(async () => {
  await context?.close()
})

/**
 * Waits in act scopes, for up to four seconds, until `done` holds. The
 * sheet's answer settles on its own promise chain, and only an act scope that
 * closes over it delivers the decline.
 */
async function settleInAct(done: () => boolean): Promise<void> {
  const deadline = Date.now() + 4000
  while (!done() && Date.now() < deadline) {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
    })
  }
}

describe('SendScene2 swap-send sheet', () => {
  /**
   * Every sheet a test raises is answered: FakeProviders mounts no Airship
   * host, so an unanswered sheet would never settle and would swallow the
   * sheet of every later test in this file. The swap-send sheet resolves
   * through `answerSheet`, which a test may hold open, and the recipient
   * picker resolves to the row named in `pickName`.
   */
  let sheetCount = 0
  let answerSheet: () => Promise<boolean> = async () => false
  let pickName: string | undefined

  beforeEach(() => {
    mockSetStealthSendEnabled.mockReset()
    sheetCount = 0
    answerSheet = async () => false
    pickName = undefined
    jest
      .spyOn(Airship, 'show')
      .mockImplementation(
        async (renderModal: (bridge: never) => React.ReactNode) => {
          const modal = renderModal(undefined as never) as React.ReactElement<{
            title?: string
            rows?: RecipientAssetRow[]
          }>
          if (modal.props.title === lstrings.stealth_swap_send_modal_title) {
            ++sheetCount
            return await answerSheet()
          }
          if (modal.props.rows != null) {
            return modal.props.rows.find(row => row.name === pickName)?.value
          }
          throw new Error(`Unexpected modal: ${String(modal.props.title)}`)
        }
      )
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    // No test agrees, so no acknowledgement may be on the account:
    const recorded = await account?.disklet.getText(SWAP_SEND_WARNING).then(
      () => true,
      () => false
    )
    expect(recorded).toBe(false)
  })

  const renderSend = (
    wallet: EdgeCurrencyWallet | undefined,
    stealthSendEnabled: boolean
  ): {
    enterAddress: (publicAddress: string) => Promise<void>
    pickRecipientAsset: (name: string) => Promise<void>
    recipientAddress: () => string
    shows: (text: string) => boolean
    stealthArmed: () => boolean
    unmount: () => void
  } => {
    if (wallet == null) throw new Error('No wallet')
    const state: FakeState = {
      ...fakeRootState,
      core: { account },
      ui: {
        ...fakeRootState.ui,
        houdiniChains,
        settings: { ...fakeRootState.ui?.settings, stealthSendEnabled }
      }
    }
    const rendered = render(
      <FakeProviders initialState={state}>
        <SendScene2
          {...fakeEdgeAppSceneProps('send2', {
            walletId: wallet.id,
            tokenId: null,
            doCheckAndShowGetCryptoModal: false
          })}
        />
      </FakeProviders>
    )
    const tileProps = (): React.ComponentProps<typeof AddressTile2> =>
      rendered.UNSAFE_getByType(AddressTile2).props as React.ComponentProps<
        typeof AddressTile2
      >
    return {
      enterAddress: async publicAddress => {
        await act(async () => {
          await tileProps().onChangeAddress({
            parsedUri: { publicAddress },
            addressEntryMethod: 'other'
          })
        })
      },
      pickRecipientAsset: async name => {
        pickName = name
        const row = rendered
          .UNSAFE_getAllByType(EdgeRow)
          .find(
            candidate =>
              candidate.props.title === lstrings.stealth_recipient_receives
          )
        if (row == null) throw new Error('No "Recipient receives" row')
        await act(async () => {
          row.props.onPress?.()
        })
      },
      recipientAddress: () => tileProps().recipientAddress,
      shows: text =>
        JSON.stringify(rendered.toJSON()).includes(JSON.stringify([text])),
      stealthArmed: () =>
        rendered.UNSAFE_getByProps({ label: lstrings.stealth_send_toggle })
          .props.value === true,
      unmount: () => {
        rendered.unmount()
      }
    }
  }

  it('turns a saved Stealth Send off, and saves it off, when the sheet is dismissed', async () => {
    const scene = renderSend(btcWallet, true)
    await settleInAct(() => sheetCount > 0 && !scene.stealthArmed())

    expect(sheetCount).toBe(1)
    expect(scene.stealthArmed()).toBe(false)
    expect(mockSetStealthSendEnabled.mock.calls).toEqual([[account, false]])
    scene.unmount()
  })

  it('clears a cross-chain recipient when the sheet is dismissed', async () => {
    const scene = renderSend(btcWallet, false)
    await scene.pickRecipientAsset('Ethereum')
    await settleInAct(() => sheetCount > 0 && scene.shows('Bitcoin (BTC)'))

    expect(sheetCount).toBe(1)
    expect(scene.shows('Bitcoin (BTC)')).toBe(true)
    expect(scene.shows('Ethereum (ETH)')).toBe(false)
    expect(scene.stealthArmed()).toBe(false)
    expect(mockSetStealthSendEnabled).not.toHaveBeenCalled()
    scene.unmount()
  })

  it('keeps the address of a same-chain recipient when the sheet is dismissed', async () => {
    const scene = renderSend(ethWallet, false)
    await scene.enterAddress(EVM_ADDRESS)
    await scene.pickRecipientAsset('Tether')
    await settleInAct(() => sheetCount > 0 && scene.shows('Ethereum (ETH)'))

    expect(sheetCount).toBe(1)
    expect(scene.shows('Ethereum (ETH)')).toBe(true)
    expect(scene.shows('Tether (USDT)')).toBe(false)
    expect(scene.recipientAddress()).toBe(EVM_ADDRESS)
    expect(mockSetStealthSendEnabled).not.toHaveBeenCalled()
    scene.unmount()
  })

  it('backs a Stealth swap out once, without arming Stealth again from the saved choice', async () => {
    // The sheet raised by the saved choice stays open while the user enters
    // an address and picks a token on the same chain:
    let closeSheet: (agreed: boolean) => void = () => {}
    answerSheet = async () =>
      await new Promise<boolean>(resolve => {
        closeSheet = resolve
      })
    const scene = renderSend(ethWallet, true)
    await settleInAct(() => sheetCount > 0)
    expect(scene.stealthArmed()).toBe(true)
    await scene.enterAddress(EVM_ADDRESS)
    await scene.pickRecipientAsset('Tether')
    expect(scene.shows('Tether (USDT)')).toBe(true)

    // Closing it turns Stealth off and drops the token, and the recipient
    // change that follows does not re-arm Stealth from the saved choice,
    // which would raise the sheet again:
    await act(async () => {
      closeSheet(false)
    })
    await settleInAct(() => scene.shows('Ethereum (ETH)'))

    expect(scene.stealthArmed()).toBe(false)
    expect(scene.shows('Tether (USDT)')).toBe(false)
    expect(scene.recipientAddress()).toBe(EVM_ADDRESS)
    expect(mockSetStealthSendEnabled.mock.calls).toEqual([[account, false]])
    expect(sheetCount).toBe(1)
    scene.unmount()
  })
})
