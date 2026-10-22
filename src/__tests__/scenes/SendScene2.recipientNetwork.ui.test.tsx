import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import { act, render, waitFor } from '@testing-library/react-native'
import { asDate, asObject, asOptional, asString, asUnknown } from 'cleaners'
import {
  addEdgeCorePlugins,
  type EdgeAccount,
  type EdgeAddress,
  type EdgeContext,
  type EdgeCurrencyEngine,
  type EdgeCurrencyInfo,
  type EdgeCurrencyPlugin,
  type EdgeCurrencyWallet,
  type EdgeMetadata,
  type EdgeParsedUri,
  type EdgeSwapPlugin,
  type EdgeTokenId,
  lockEdgeCorePlugins,
  makeFakeEdgeWorld,
  SwapCurrencyError
} from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import type { RecipientAssetRow } from '../../components/modals/RecipientAssetListModal'
import { EdgeRow } from '../../components/rows/EdgeRow'
import { SendScene2 } from '../../components/scenes/SendScene2'
import type * as AirshipInstance from '../../components/services/AirshipInstance'
import { Airship, showToast } from '../../components/services/AirshipInstance'
import { StealthInfoText } from '../../components/themed/StealthInfoText'
import { AddressTile2 } from '../../components/tiles/AddressTile2'
import { lstrings } from '../../locales/strings'
import { avaxCurrencyInfo } from '../../util/fake/fakeAvaxInfo'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import {
  type FakeSettings,
  makeFakePlugin
} from '../../util/fake/fakeCurrencyPlugin'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'
import fakeUser from '../../util/fake/fakeUserDump.json'
import { asHoudiniChains, type HoudiniChains } from '../../util/houdiniChains'
import { withStatedAsset } from '../../util/paymentUri'
import { getStealthProviderName } from '../../util/stealthSwap'

jest.useRealTimers()

jest.mock('../../components/services/AirshipInstance', () => {
  const actual = jest.requireActual<typeof AirshipInstance>(
    '../../components/services/AirshipInstance'
  )
  return { ...actual, showToast: jest.fn() }
})

const BTC_ADDRESS = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
const EVM_ADDRESS = '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e'
const OTHER_EVM_ADDRESS = '0x52908400098527886E0F7030069857D2E4169EE7'
const ZCASH_ADDRESS = /^(u1[a-z0-9]+|zs1[a-z0-9]+|t1[1-9A-HJ-NP-Za-km-z]{33})$/
// An amount over the provider's floor, so the quote goes out:
const ONE_BTC = '100000000'
const ONE_ETH = '1000000000000000000'
const ONE_ZEC = '100000000'
const USDT_TOKEN_ID = 'dac17f958d2ee523a2206206994597c13d831ec7'
const XRP_ADDRESS = 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh'

// The networks the provider pays out to. Fantom is left out, as an EVM
// network the provider does not serve:
const servedChains = {
  bitcoin: {
    memoNeeded: false,
    addressValidation:
      '^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39}|bc1[a-z0-9]{59})$',
    coin: { hasSelfPrivate: true },
    tokens: {}
  },
  ethereum: {
    memoNeeded: false,
    addressValidation: '^(0x)[0-9A-Za-z]{40}$',
    coin: { hasSelfPrivate: true },
    tokens: { [USDT_TOKEN_ID]: { hasSelfPrivate: true } }
  },
  avalanche: {
    memoNeeded: false,
    addressValidation: '^(0x)[0-9A-Za-z]{40}$',
    coin: { hasSelfPrivate: true },
    tokens: {}
  },
  ripple: {
    memoNeeded: true,
    addressValidation: '^r[1-9A-HJ-NP-Za-km-z]{24,34}$',
    coin: { hasSelfPrivate: true },
    tokens: {}
  },
  zcash: {
    memoNeeded: false,
    addressValidation: '^t1[1-9A-HJ-NP-Za-km-z]{33}$',
    coin: { hasSelfPrivate: true },
    tokens: {}
  }
}
const houdiniChains = asHoudiniChains(servedChains)

// Either side of the provider's 25 USD floor for a private route, at the fake
// rates' 1326.1958 USD per ETH:
const FIVE_USD_OF_ETH = '3770000000000000'
const FIFTY_USD_OF_ETH = '37700000000000000'

const SCAM_WARNING = 'Scam Warning'
const SWAP_BEFORE_SEND = 'Swap before send'
const ZCASH_TRANSPARENT_WARNING = 'Transparent Zcash payout'

/**
 * A fake plugin whose parser accepts one address format, bare or inside a
 * payment code, and reads the code's `amount` or EIP-681 `value` in whole
 * native units, plus an XRP-style `dt` destination tag. Like the real parsers
 * it names no asset for either, so the wallet stamps the asset it was asked
 * about on both. An EIP-681 token `transfer` reads only when asked with a
 * token's code, as an EVM parser refuses it asked with the coin's, and a
 * `gateway=1` parameter marks it a gateway code. Each read is logged in
 * `parseCalls`.
 */
interface GatewayMetadata extends EdgeMetadata {
  gateway: boolean
}
const parseCalls: Array<{ text: string; currencyCode?: string }> = []
const makeParsingPlugin = (
  currencyInfo: EdgeCurrencyInfo,
  addressFormat: RegExp
): EdgeCurrencyPlugin => {
  const plugin = makeFakePlugin(currencyInfo)
  const { makeCurrencyTools } = plugin
  return {
    ...plugin,
    async makeCurrencyTools() {
      const tools = await makeCurrencyTools()
      const parseUri = async (
        uri: string,
        currencyCode?: string
      ): Promise<EdgeParsedUri> => {
        parseCalls.push({ text: uri, currencyCode })
        const [target, query = ''] = uri.replace(/^[a-z]+:/, '').split('?')
        if (target.endsWith('/transfer')) {
          if (
            currencyCode == null ||
            currencyCode === currencyInfo.currencyCode
          ) {
            throw new Error('InvalidUriError')
          }
          const payee = /(?:^|&)address=([^&]+)/.exec(query)?.[1]
          if (payee == null || !addressFormat.test(payee)) {
            throw new Error('InvalidPublicAddressError')
          }
          const amount = /(?:^|&)uint256=(\d+)/.exec(query)?.[1]
          const gateway = /(?:^|&)gateway=1(?:&|$)/.test(query)
          // EVM parsers flag a gateway code on the metadata, outside the core
          // type, which is how the scan warning reads it:
          const metadata: GatewayMetadata = { gateway }
          return {
            publicAddress: payee,
            nativeAmount: amount,
            metadata: gateway ? metadata : undefined
          }
        }
        const publicAddress = target.split('@')[0]
        if (!addressFormat.test(publicAddress)) {
          throw new Error('InvalidPublicAddressError')
        }
        const amount = /(?:^|&)(?:amount|value)=(\d+)/.exec(query)?.[1]
        const tag = /(?:^|&)dt=(\d+)/.exec(query)?.[1]
        return { publicAddress, nativeAmount: amount, uniqueIdentifier: tag }
      }
      return Object.assign(tools, { parseUri })
    }
  }
}

/**
 * An EVM network the provider does not pay out to. Only the network differs
 * from the fake Avalanche: the coin and its fake balances are reused as-is.
 */
const ftmCurrencyInfo: EdgeCurrencyInfo = {
  ...avaxCurrencyInfo,
  assetDisplayName: 'Fantom',
  chainDisplayName: 'Fantom',
  displayName: 'Fantom',
  pluginId: 'fantom',
  walletType: 'wallet:fantom'
}

/**
 * The swap provider every send-to-address quote goes to. It records the
 * destination addresses each request reached it with, then declines the pair
 * as a provider with no route would.
 */
const quotedDestinations: EdgeAddress[][] = []
const fakeHoudiniPlugin: EdgeSwapPlugin = {
  swapInfo: { pluginId: 'houdini', displayName: 'Houdini', supportEmail: '' },
  async fetchSwapQuote(request) {
    quotedDestinations.push(
      await request.toWallet.getAddresses({ tokenId: null })
    )
    throw new SwapCurrencyError(fakeHoudiniPlugin.swapInfo, request)
  }
}

const zecCurrencyInfo: EdgeCurrencyInfo = {
  ...btcCurrencyInfo,
  assetDisplayName: 'Zcash',
  chainDisplayName: 'Zcash',
  currencyCode: 'ZEC',
  displayName: 'Zcash',
  pluginId: 'zcash',
  walletType: 'wallet:zcash',
  denominations: [{ name: 'ZEC', multiplier: '100000000', symbol: 'Z' }],
  defaultSettings: {
    customFeeSettings: [],
    publicAddress: 't1Zcash111111111111111111111111111',
    networkFee: '400',
    parentNetworkFee: '',
    balances: { ZEC: '10' }
  }
}

/**
 * Zcash wallets list a unified, a shielded and a transparent address, the
 * unified one first, as the real engine does. Each wallet gets its own set,
 * so two of them are told apart.
 */
const makeZcashPlugin = (): EdgeCurrencyPlugin => {
  const plugin = makeParsingPlugin(zecCurrencyInfo, ZCASH_ADDRESS)
  let engineCount = 0
  return {
    ...plugin,
    async makeCurrencyEngine(walletInfo, opts): Promise<EdgeCurrencyEngine> {
      const engine = await plugin.makeCurrencyEngine(walletInfo, opts)
      const digit = String(++engineCount)
      const addresses: EdgeAddress[] = [
        {
          addressType: 'unifiedAddress',
          publicAddress: `u1${digit.repeat(60)}`
        },
        {
          addressType: 'saplingAddress',
          publicAddress: `zs1${digit.repeat(60)}`
        },
        {
          addressType: 'transparentAddress',
          publicAddress: `t1${digit.repeat(33)}`
        }
      ]
      const getAddresses = async (): Promise<EdgeAddress[]> => addresses
      return Object.assign(engine, { getAddresses })
    }
  }
}

/**
 * A network whose payouts need a destination tag. Only the coin and its
 * address differ from the fake Bitcoin.
 */
const xrpCurrencyInfo: EdgeCurrencyInfo = {
  ...btcCurrencyInfo,
  assetDisplayName: 'XRP',
  chainDisplayName: 'XRP Ledger',
  currencyCode: 'XRP',
  displayName: 'XRP',
  pluginId: 'ripple',
  walletType: 'wallet:ripple',
  denominations: [{ name: 'XRP', multiplier: '1000000' }],
  defaultSettings: {
    customFeeSettings: [],
    publicAddress: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY',
    networkFee: '12',
    parentNetworkFee: '',
    balances: { XRP: '100' }
  } satisfies FakeSettings,
  memoOptions: [{ type: 'number', memoName: 'destination tag' }]
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

/** The Stealth toggle's info line, naming the provider the way the scene does. */
const stealthInfo = (): string => {
  if (account == null) throw new Error('No account')
  return sprintf(lstrings.stealth_info_1s, getStealthProviderName(account))
}
let btcWallet: EdgeCurrencyWallet | undefined
let ethWallet: EdgeCurrencyWallet | undefined
let ftmWallet: EdgeCurrencyWallet | undefined
let zecWallet: EdgeCurrencyWallet | undefined
let otherZecWallet: EdgeCurrencyWallet | undefined
let xrpWallet: EdgeCurrencyWallet | undefined

beforeAll(async () => {
  const dump = asUserDump(fakeUser)

  addEdgeCorePlugins({
    bitcoin: makeParsingPlugin(btcCurrencyInfo, /^bc1[a-z0-9]{39}$/),
    ethereum: makeParsingPlugin(ethCurrencyInfo, /^0x[0-9A-Fa-f]{40}$/),
    avalanche: makeParsingPlugin(avaxCurrencyInfo, /^0x[0-9A-Fa-f]{40}$/),
    fantom: makeParsingPlugin(ftmCurrencyInfo, /^0x[0-9A-Fa-f]{40}$/),
    zcash: makeZcashPlugin(),
    ripple: makeParsingPlugin(
      xrpCurrencyInfo,
      /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/
    ),
    houdini: fakeHoudiniPlugin
  })
  lockEdgeCorePlugins()

  const world = await makeFakeEdgeWorld([dump.data], {})
  context = await world.makeEdgeContext({
    apiKey: '',
    appId: '',
    plugins: {
      bitcoin: true,
      ethereum: true,
      avalanche: true,
      fantom: true,
      zcash: true,
      ripple: true,
      houdini: true
    }
  })
  account = await context.loginWithKey('bob', dump.loginKey)
  const btcInfo = account.getFirstWalletInfo('wallet:bitcoin')
  if (btcInfo == null) throw new Error('Unable to get wallet info')
  btcWallet = await account.waitForCurrencyWallet(btcInfo.id)
  const ethInfo = account.getFirstWalletInfo('wallet:ethereum')
  if (ethInfo == null) throw new Error('Unable to get wallet info')
  ethWallet = await account.waitForCurrencyWallet(ethInfo.id)
  ftmWallet = await account.createCurrencyWallet('wallet:fantom', {
    fiatCurrencyCode: 'iso:USD'
  })
  zecWallet = await account.createCurrencyWallet('wallet:zcash', {
    fiatCurrencyCode: 'iso:USD'
  })
  otherZecWallet = await account.createCurrencyWallet('wallet:zcash', {
    fiatCurrencyCode: 'iso:USD'
  })
  xrpWallet = await account.createCurrencyWallet('wallet:ripple', {
    fiatCurrencyCode: 'iso:USD'
  })
})

afterAll(async () => {
  await context?.close()
})

describe('SendScene2 recipient network', () => {
  const mockShowToast = jest.mocked(showToast)

  beforeEach(() => {
    mockShowToast.mockClear()
  })

  interface RenderedSend {
    enterUnparsedAddress: (text: string) => Promise<boolean | string>
    /**
     * Hands text to the scene's reader for the picked network, as the tile
     * does on a cross-chain send. Resolves whether the reader accepted it.
     */
    enterCrossChainAddress: (text: string) => Promise<boolean>
    /** Types an amount into the send's amount modal, plain or swap. */
    enterAmount: (nativeAmount: string) => Promise<void>
    /** Hands the scene a payment code the sending wallet's parser accepted. */
    enterParsedAddress: (text: string) => Promise<void>
    /**
     * Hands the scene a recipient as the tile does for a picked wallet of the
     * user's own: the address the tile shows, with every address the wallet
     * has.
     */
    enterOwnWalletAddress: (
      parsedUri: EdgeParsedUri,
      walletAddresses: EdgeAddress[]
    ) => Promise<void>
    /** Picks one of the user's own wallets through the tile's "Myself". */
    pickOwnWallet: (picked: EdgeCurrencyWallet | undefined) => Promise<void>
    /** Picks an asset by name in the "Recipient receives" picker. */
    pickRecipientAsset: (name: string) => Promise<void>
    /** Enters the amount through the swap-send "You send" row. */
    enterSendAmount: (nativeAmount: string) => Promise<void>
    /** Enters the amount through the swap-send "Recipient gets" row. */
    enterRecipientAmount: (nativeAmount: string) => Promise<void>
    /** The props the scene hands the swap-send "Recipient gets" row. */
    recipientGetsRow: () => React.ComponentProps<typeof EdgeRow>
    /** The props the scene hands the address tile. */
    tileProps: () => React.ComponentProps<typeof AddressTile2>
    /** Picks one of the user's own wallets under "Myself". */
    pickMyself: (pluginId: string, address: string) => Promise<void>
    recipientAddress: () => string
    stealthArmed: () => boolean
    /** Whether the Stealth Send toggle shows dimmed. */
    stealthDimmed: () => boolean
    /** The Destination Tag row's text, or `undefined` with no row shown. */
    destinationTag: () => string | undefined
    /** How many text nodes on the scene read exactly this. */
    count: (text: string) => number
    /** Where a text first appears on the scene, top to bottom, or -1. */
    position: (text: string) => number
    /** Whether some text node on the scene reads exactly this. */
    shows: (text: string) => boolean
    /** The notes under the Stealth Send toggle, top to bottom. */
    stealthNotes: () => string[]
    /** Taps the Stealth Send toggle. */
    toggleStealth: () => Promise<void>
    unmount: () => void
  }

  /** Renders a send and hands text to the scene as the tile would. */
  const renderSend = (
    wallet: EdgeCurrencyWallet | undefined,
    tokenId: EdgeTokenId = null,
    opts: {
      chains?: HoudiniChains
      /** What the info server bans for Houdini alone, on each side. */
      houdiniBans?: {
        source: Array<{ pluginId: string }>
        destination: Array<{ pluginId: string }>
      }
      sceneAccount?: EdgeAccount
    } = {}
  ): RenderedSend => {
    if (wallet == null) throw new Error('No wallet')
    const { chains = houdiniChains, houdiniBans, sceneAccount = account } = opts
    const rootState: FakeState = {
      ...fakeRootState,
      core: { account: sceneAccount },
      ui: {
        ...fakeRootState.ui,
        houdiniChains: chains,
        ...(houdiniBans == null
          ? {}
          : {
              exchangeInfo: {
                swap: {
                  disableAssets: { source: [], destination: [] },
                  disableAssetsByPlugin: { houdini: houdiniBans },
                  disablePlugins: {}
                }
              }
            })
      }
    }
    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SendScene2
          {...fakeEdgeAppSceneProps('send2', {
            walletId: wallet.id,
            tokenId,
            doCheckAndShowGetCryptoModal: false
          })}
        />
      </FakeProviders>
    )
    const tileProps = (): React.ComponentProps<typeof AddressTile2> =>
      rendered.UNSAFE_getByType(AddressTile2).props
    const recipientGetsRow = (): React.ComponentProps<typeof EdgeRow> => {
      const row = rendered
        .UNSAFE_getAllByType(EdgeRow)
        .find(
          candidate => candidate.props.title === lstrings.stealth_recipient_gets
        )
      if (row == null) throw new Error('No "Recipient gets" row')
      return row.props
    }
    return {
      enterUnparsedAddress: async text => {
        let result: boolean | string = false
        await act(async () => {
          result =
            (await tileProps().onUnparsedAddress?.(text, 'other')) ?? false
        })
        return result
      },
      enterCrossChainAddress: async text => {
        const { parseCrossChainAddress, onChangeAddress } = tileProps()
        if (parseCrossChainAddress == null) {
          throw new Error('No cross-chain reader')
        }
        const payment = await parseCrossChainAddress(text)
        if (payment == null) return false
        await act(async () => {
          await onChangeAddress({
            parsedUri: { publicAddress: payment.publicAddress },
            addressEntryMethod: 'other',
            crossChainNativeAmount: payment.nativeAmount,
            crossChainMemo: payment.memo
          })
        })
        return true
      },
      enterAmount: async nativeAmount => {
        const amounts = {
          nativeAmount,
          exchangeAmount: '',
          fiatAmount: '',
          fieldChanged: 'crypto'
        }
        const show = jest.spyOn(Airship, 'show').mockImplementationOnce(
          // A plain send reads the amount as it is typed, and a swap-send
          // reads what the modal resolves with:
          async (renderModal: (bridge: never) => React.ReactNode) => {
            const modal = renderModal(
              undefined as never
            ) as React.ReactElement<{
              onAmountsChanged?: (next: typeof amounts) => void
            }>
            modal.props.onAmountsChanged?.(amounts)
            return amounts
          }
        )
        const row = [
          ...rendered.UNSAFE_queryAllByProps({
            title: lstrings.fio_request_amount
          }),
          ...rendered.UNSAFE_queryAllByProps({
            title: lstrings.stealth_you_send
          })
        ].find(node => typeof node.props.onPress === 'function')
        if (row == null) throw new Error('No amount row')
        await act(async () => {
          row.props.onPress()
        })
        show.mockRestore()
      },
      enterParsedAddress: async text => {
        const currencyCode =
          tokenId == null
            ? wallet.currencyInfo.currencyCode
            : wallet.currencyConfig.allTokens[tokenId].currencyCode
        const parsedUri = withStatedAsset(
          await wallet.parseUri(text, currencyCode),
          text
        )
        await act(async () => {
          await tileProps().onChangeAddress({
            parsedUri,
            addressEntryMethod: 'other'
          })
        })
      },
      enterOwnWalletAddress: async (parsedUri, walletAddresses) => {
        await act(async () => {
          await tileProps().onChangeAddress({
            parsedUri,
            addressEntryMethod: 'other',
            walletAddresses
          })
        })
      },
      pickOwnWallet: async picked => {
        if (picked == null) throw new Error('No wallet')
        const show = jest.spyOn(Airship, 'show').mockResolvedValueOnce({
          type: 'wallet',
          walletId: picked.id,
          tokenId: null
        })
        await act(async () => {
          rendered
            .UNSAFE_getByProps({ testID: 'addressTileMyself' })
            .props.onPress()
        })
        // The tile settles the pick on its own promise chain, whose updates
        // only reach the scene once an act scope closes over them:
        for (let i = 0; i < 50 && tileProps().recipientAddress === ''; ++i) {
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 20))
          })
        }
        expect(tileProps().recipientAddress).not.toBe('')
        show.mockRestore()
      },
      enterSendAmount: async nativeAmount => {
        const show = jest
          .spyOn(Airship, 'show')
          .mockResolvedValueOnce({ nativeAmount })
        const row = rendered
          .UNSAFE_getAllByType(EdgeRow)
          .find(
            candidate => candidate.props.title === lstrings.stealth_you_send
          )
        await act(async () => {
          row?.props.onPress?.()
        })
        show.mockRestore()
      },
      enterRecipientAmount: async nativeAmount => {
        const show = jest
          .spyOn(Airship, 'show')
          .mockResolvedValueOnce({ nativeAmount })
        const { onPress } = recipientGetsRow()
        await act(async () => {
          await onPress?.()
        })
        show.mockRestore()
      },
      recipientGetsRow,
      tileProps,
      pickRecipientAsset: async name => {
        const show = jest.spyOn(Airship, 'show').mockImplementationOnce(
          // The scene's own picker, answered from the rows it offers:
          async (renderModal: (bridge: never) => React.ReactNode) => {
            const modal = renderModal(
              undefined as never
            ) as React.ReactElement<{
              rows: RecipientAssetRow[]
            }>
            return modal.props.rows.find(row => row.name === name)?.value
          }
        )
        const row = rendered
          .UNSAFE_getAllByType(EdgeRow)
          .find(
            candidate =>
              candidate.props.title === lstrings.stealth_recipient_receives
          )
        await act(async () => {
          row?.props.onPress?.()
        })
        show.mockRestore()
      },
      pickMyself: async (pluginId, address) => {
        const { selfTransfer } = tileProps()
        if (selfTransfer == null) throw new Error('No "Myself" picker')
        await act(async () => {
          await selfTransfer.onPickAsset({ pluginId, tokenId: null }, address, [
            { addressType: 'publicAddress', publicAddress: address }
          ])
        })
      },
      recipientAddress: () => tileProps().recipientAddress,
      stealthArmed: () =>
        rendered.UNSAFE_getByProps({ label: lstrings.stealth_send_toggle })
          .props.value === true,
      stealthDimmed: () =>
        rendered.UNSAFE_getByProps({ label: lstrings.stealth_send_toggle })
          .props.disabled === true,
      destinationTag: () => {
        const row = rendered
          .UNSAFE_getAllByType(EdgeRow)
          .find(
            candidate =>
              candidate.props.title === lstrings.memo_destination_tag_title
          )
        return row == null
          ? undefined
          : (row.props.children as React.ReactElement<{ children: string }>)
              .props.children
      },
      position: text =>
        JSON.stringify(rendered.toJSON()).indexOf(JSON.stringify(text)),
      count: text =>
        JSON.stringify(rendered.toJSON()).split(JSON.stringify([text])).length -
        1,
      shows: text =>
        JSON.stringify(rendered.toJSON()).includes(JSON.stringify([text])),
      stealthNotes: () =>
        rendered
          .UNSAFE_queryAllByType(StealthInfoText)
          .map(note => note.props.message),
      toggleStealth: async () => {
        const [toggle] = rendered.UNSAFE_getAllByProps({
          label: lstrings.stealth_send_toggle
        })
        await act(async () => {
          await toggle.props.onPress?.()
        })
      },
      unmount: () => {
        rendered.unmount()
      }
    }
  }

  const renderBitcoinSend = (): RenderedSend => renderSend(btcWallet)

  it('adopts a lone matching network and says the network changed', async () => {
    const scene = renderBitcoinSend()

    expect(await scene.enterUnparsedAddress(`ethereum:${EVM_ADDRESS}@1`)).toBe(
      true
    )
    expect(scene.recipientAddress()).toBe(EVM_ADDRESS)
    expect(mockShowToast.mock.calls).toEqual([
      ['Recipient network changed to Ethereum.']
    ])
    scene.unmount()
  })

  it("switches back for an address on the wallet's own network", async () => {
    const scene = renderBitcoinSend()
    await scene.enterUnparsedAddress(`ethereum:${EVM_ADDRESS}@1`)
    expect(scene.shows('Ethereum (ETH)')).toBe(true)
    mockShowToast.mockClear()

    expect(await scene.enterUnparsedAddress(BTC_ADDRESS)).toBe(true)
    expect(scene.recipientAddress()).toBe(BTC_ADDRESS)
    expect(scene.shows('Bitcoin (BTC)')).toBe(true)
    expect(scene.shows('Ethereum (ETH)')).toBe(false)
    expect(mockShowToast.mock.calls).toEqual([
      ['Recipient network changed to Bitcoin.']
    ])

    // Back on its own network, the send reads the next address as a Bitcoin
    // one again: an Ethereum address is a new switch, not a second decline.
    mockShowToast.mockClear()
    expect(await scene.enterUnparsedAddress(`ethereum:${EVM_ADDRESS}@1`)).toBe(
      true
    )
    expect(mockShowToast.mock.calls).toEqual([
      ['Recipient network changed to Ethereum.']
    ])
    scene.unmount()
  })

  it("keeps a payment code's amount through the switch", async () => {
    const scene = renderBitcoinSend()
    await scene.enterUnparsedAddress(`ethereum:${EVM_ADDRESS}@1`)

    expect(
      await scene.enterUnparsedAddress(`bitcoin:${BTC_ADDRESS}?amount=150000`)
    ).toBe(true)
    expect(scene.recipientAddress()).toBe(BTC_ADDRESS)
    // A plain Bitcoin send for the amount the code asked for:
    expect(scene.shows('0.0015 BTC')).toBe(true)
    expect(scene.shows('Bitcoin (BTC)')).toBe(true)
    scene.unmount()
  })

  it('keeps the entered amount through a "Myself" pick on another network', async () => {
    const scene = renderBitcoinSend()
    await scene.enterParsedAddress(`bitcoin:${BTC_ADDRESS}?amount=150000`)
    expect(scene.shows('0.0015 BTC')).toBe(true)

    // The picked wallet's address carries no amount, and the entered one is
    // in the asset being sent, so it stays as the guaranteed send side:
    await scene.pickMyself('ethereum', EVM_ADDRESS)
    expect(scene.recipientAddress()).toBe(EVM_ADDRESS)
    expect(scene.shows('Ethereum (ETH)')).toBe(true)
    expect(scene.position('0.0015 BTC')).toBeGreaterThan(-1)
    expect(scene.position('(Guaranteed)')).toBeLessThan(
      scene.position('Recipient gets')
    )
    scene.unmount()
  })

  it('keeps the entered amount when an address adopts another network', async () => {
    const scene = renderBitcoinSend()
    await scene.enterParsedAddress(`bitcoin:${BTC_ADDRESS}?amount=150000`)

    expect(await scene.enterUnparsedAddress(`ethereum:${EVM_ADDRESS}@1`)).toBe(
      true
    )
    expect(scene.shows('Ethereum (ETH)')).toBe(true)
    expect(scene.position('0.0015 BTC')).toBeGreaterThan(-1)
    scene.unmount()
  })

  it('keeps the entered amount when an address switches back', async () => {
    const scene = renderBitcoinSend()
    await scene.enterParsedAddress(`bitcoin:${BTC_ADDRESS}?amount=150000`)
    await scene.enterUnparsedAddress(`ethereum:${EVM_ADDRESS}@1`)
    expect(scene.shows('Ethereum (ETH)')).toBe(true)

    // A bare Bitcoin address carries no amount, and the entered one is in
    // the asset this plain send pays:
    expect(await scene.enterUnparsedAddress(BTC_ADDRESS)).toBe(true)
    expect(scene.recipientAddress()).toBe(BTC_ADDRESS)
    expect(scene.shows('Bitcoin (BTC)')).toBe(true)
    expect(scene.shows('0.0015 BTC')).toBe(true)
    scene.unmount()
  })

  it("switches back when other networks share the wallet's address format", async () => {
    const scene = renderSend(ethWallet)
    await scene.enterUnparsedAddress(BTC_ADDRESS)
    expect(scene.shows('Bitcoin (BTC)')).toBe(true)
    mockShowToast.mockClear()
    const show = jest.spyOn(Airship, 'show')

    // A bare EVM address fits Avalanche too. The wallet's own network reads
    // it first, so no other network is adopted and no picker opens:
    expect(await scene.enterUnparsedAddress(EVM_ADDRESS)).toBe(true)
    expect(show).not.toHaveBeenCalled()
    expect(scene.recipientAddress()).toBe(EVM_ADDRESS)
    expect(scene.shows('Ethereum (ETH)')).toBe(true)
    expect(scene.shows('Avalanche (AVAX)')).toBe(false)
    expect(mockShowToast.mock.calls).toEqual([
      ['Recipient network changed to Ethereum.']
    ])

    show.mockRestore()
    scene.unmount()
  })

  it("declines the wallet's own address through the switch", async () => {
    const scene = renderSend(ethWallet)
    await scene.enterUnparsedAddress(BTC_ADDRESS)
    mockShowToast.mockClear()
    if (ethWallet == null) throw new Error('No wallet')
    // The same address in another case, as a checksummed paste would be:
    const [{ publicAddress }] = await ethWallet.getAddresses({ tokenId: null })
    const ownAddress = `0x${publicAddress.slice(2).toUpperCase()}`

    expect(await scene.enterUnparsedAddress(ownAddress)).toBe(
      'You cannot send to the same wallet'
    )
    expect(scene.recipientAddress()).toBe(BTC_ADDRESS)
    expect(scene.shows('Bitcoin (BTC)')).toBe(true)
    expect(mockShowToast).not.toHaveBeenCalled()
    scene.unmount()
  })

  it("sends a token code's amount when the payout is the chain's coin", async () => {
    const scene = renderSend(ethWallet, USDT_TOKEN_ID)
    await scene.pickRecipientAsset('Ethereum')

    // The wallet reads the amount in the token being sent, six decimals:
    await scene.enterParsedAddress(`ethereum:${EVM_ADDRESS}?amount=5000000`)
    expect(scene.recipientAddress()).toBe(EVM_ADDRESS)
    expect(scene.position('5 USDT')).toBeGreaterThan(-1)
    // The token amount is what the wallet sends, so the send side is the
    // guaranteed one and the coin payout is the estimate:
    expect(scene.position('(Guaranteed)')).toBeLessThan(
      scene.position('Recipient gets')
    )
    expect(scene.position('(Estimated)')).toBeGreaterThan(
      scene.position('Recipient gets')
    )
    scene.unmount()
  })

  it("receives a coin code's amount when the payout is the chain's coin", async () => {
    const scene = renderSend(ethWallet, USDT_TOKEN_ID)
    await scene.pickRecipientAsset('Ethereum')

    // An EIP-681 `value` is wei of the coin the recipient asked for:
    await scene.enterParsedAddress(
      `ethereum:${EVM_ADDRESS}?value=2000000000000000`
    )
    expect(scene.recipientAddress()).toBe(EVM_ADDRESS)
    expect(scene.position('0.002 ETH')).toBeGreaterThan(-1)
    expect(scene.position('(Guaranteed)')).toBeGreaterThan(
      scene.position('Recipient gets')
    )
    scene.unmount()
  })

  it("receives a token code's amount when the payout is a token on the wallet's own chain", async () => {
    const scene = renderSend(ethWallet)
    await scene.pickRecipientAsset('Tether')
    mockShowToast.mockClear()

    // The wallet reads a token's payment code only with the token's own code,
    // and the amount is what the recipient asked to get, six decimals:
    expect(
      await scene.enterUnparsedAddress(
        `ethereum:0x${USDT_TOKEN_ID}@1/transfer?address=${EVM_ADDRESS}&uint256=5000000`
      )
    ).toBe(true)
    expect(scene.recipientAddress()).toBe(EVM_ADDRESS)
    expect(scene.shows('Tether (USDT)')).toBe(true)
    expect(scene.position('5 USDT')).toBeGreaterThan(-1)
    expect(scene.position('(Guaranteed)')).toBeGreaterThan(
      scene.position('Recipient gets')
    )
    expect(mockShowToast).not.toHaveBeenCalled()
    scene.unmount()
  })

  it("declines a token code to the wallet's own address when the payout is that token", async () => {
    if (ethWallet == null) throw new Error('No wallet')
    const [{ publicAddress }] = await ethWallet.getAddresses({ tokenId: null })
    const scene = renderSend(ethWallet)
    await scene.pickRecipientAsset('Tether')
    mockShowToast.mockClear()

    // The tile refuses a send to the wallet's own address, and this path
    // reads the code in the tile's place:
    expect(
      await scene.enterUnparsedAddress(
        `ethereum:0x${USDT_TOKEN_ID}@1/transfer?address=${publicAddress}&uint256=5000000`
      )
    ).toBe('You cannot send to the same wallet')
    expect(scene.recipientAddress()).toBe('')
    expect(scene.shows('Tether (USDT)')).toBe(true)
    expect(mockShowToast).not.toHaveBeenCalled()
    scene.unmount()
  })

  it('keeps a token code out when its gateway warning is declined', async () => {
    const scene = renderSend(ethWallet)
    await scene.pickRecipientAsset('Tether')
    // Every modal is declined, and the titles shown are logged:
    const titles: unknown[] = []
    const show = jest
      .spyOn(Airship, 'show')
      .mockImplementation(
        async (renderModal: (bridge: never) => React.ReactNode) => {
          const modal = renderModal(undefined as never) as React.ReactElement<{
            title?: string
          }>
          titles.push(modal.props.title)
          return false
        }
      )

    // The tile warns before taking a gateway code, and this path reads the
    // code in the tile's place:
    expect(
      await scene.enterUnparsedAddress(
        `ethereum:0x${USDT_TOKEN_ID}@1/transfer?address=${EVM_ADDRESS}&uint256=5000000&gateway=1`
      )
    ).toBe(true)
    expect(titles).toContain(
      sprintf(lstrings.gateway_agreement_modal_title, 'USDT')
    )
    expect(scene.recipientAddress()).toBe('')
    expect(scene.shows('Tether (USDT)')).toBe(true)

    show.mockRestore()
    scene.unmount()
  })

  it('never reads bare text as the payout token', async () => {
    const scene = renderSend(ethWallet)
    await scene.pickRecipientAsset('Tether')
    parseCalls.length = 0

    // Bare text asked as a token can read as a different payment, as Tron's
    // parser turns a PIX key into a USDT deposit address, so only a payment
    // code is asked with the payout token's code:
    expect(await scene.enterUnparsedAddress('payee@example.com')).toEqual(
      expect.any(String)
    )
    expect(scene.recipientAddress()).toBe('')
    expect(parseCalls.filter(call => call.currencyCode === 'USDT')).toEqual([])
    scene.unmount()
  })

  it("reads a token code's amount when the payout is that token on another chain", async () => {
    const scene = renderBitcoinSend()
    await scene.pickRecipientAsset('Tether')
    mockShowToast.mockClear()

    // The Ethereum parser refuses a `transfer` code asked for its coin, so
    // the reader asks again with the payout token's code, and the amount is
    // what the recipient asked to get, six decimals:
    expect(
      await scene.enterCrossChainAddress(
        `ethereum:0x${USDT_TOKEN_ID}@1/transfer?address=${EVM_ADDRESS}&uint256=5000000`
      )
    ).toBe(true)
    expect(scene.recipientAddress()).toBe(EVM_ADDRESS)
    expect(scene.shows('Tether (USDT)')).toBe(true)
    expect(scene.position('5 USDT')).toBeGreaterThan(-1)
    expect(scene.position('(Guaranteed)')).toBeGreaterThan(
      scene.position('Recipient gets')
    )
    expect(mockShowToast).not.toHaveBeenCalled()
    scene.unmount()
  })

  it("pays a coin code as the chain's coin, not as the token being sent", async () => {
    const scene = renderSend(ethWallet, USDT_TOKEN_ID)
    await scene.pickRecipientAsset('Bitcoin')
    expect(scene.shows('Bitcoin (BTC)')).toBe(true)
    mockShowToast.mockClear()

    // Read as a plain send of the token, this code is 2,000,000,000 USDT.
    // The own-network switch leaves it to detection, which pays it in ETH:
    expect(
      await scene.enterUnparsedAddress(
        `ethereum:${EVM_ADDRESS}?value=2000000000000000`
      )
    ).toBe(true)
    expect(scene.recipientAddress()).toBe(EVM_ADDRESS)
    expect(scene.shows('Ethereum (ETH)')).toBe(true)
    expect(scene.position('0.002 ETH')).toBeGreaterThan(-1)
    expect(scene.position('(Guaranteed)')).toBeGreaterThan(
      scene.position('Recipient gets')
    )
    expect(mockShowToast.mock.calls).toEqual([
      ['Recipient network changed to Ethereum.']
    ])
    scene.unmount()
  })

  it("quotes a picked wallet's addresses with the shown one first", async () => {
    const scene = renderBitcoinSend()
    await scene.pickRecipientAsset('Ethereum')

    // The provider picks the address type it pays out to, so the picked
    // wallet's other addresses ride along after the one the tile shows:
    const shown: EdgeAddress = {
      addressType: 'publicAddress',
      publicAddress: EVM_ADDRESS
    }
    const other: EdgeAddress = {
      addressType: 'segwitAddress',
      publicAddress: OTHER_EVM_ADDRESS
    }
    quotedDestinations.length = 0
    await scene.enterOwnWalletAddress(
      { publicAddress: EVM_ADDRESS, nativeAmount: ONE_ETH },
      [other, shown]
    )
    await waitFor(() => {
      expect(quotedDestinations.at(-1)).toEqual([shown, other])
    })

    // A pasted address is the only one the quote gets:
    quotedDestinations.length = 0
    await scene.enterUnparsedAddress(
      `ethereum:${OTHER_EVM_ADDRESS}@1?value=${ONE_ETH}`
    )
    await waitFor(() => {
      expect(quotedDestinations.at(-1)).toEqual([
        { addressType: 'publicAddress', publicAddress: OTHER_EVM_ADDRESS }
      ])
    })
    scene.unmount()
  })

  it('quotes a wallet picked on another chain with the shown address first', async () => {
    const scene = renderBitcoinSend()
    const shown: EdgeAddress = {
      addressType: 'publicAddress',
      publicAddress: EVM_ADDRESS
    }
    const other: EdgeAddress = {
      addressType: 'segwitAddress',
      publicAddress: OTHER_EVM_ADDRESS
    }

    // The "Myself" picker hands a wallet on another chain to the scene as a
    // cross-asset destination, not through the address callback:
    await act(async () => {
      await scene
        .tileProps()
        .selfTransfer?.onPickAsset(
          { pluginId: 'ethereum', tokenId: null },
          EVM_ADDRESS,
          [other, shown]
        )
    })
    expect(scene.recipientAddress()).toBe(EVM_ADDRESS)

    quotedDestinations.length = 0
    await scene.enterSendAmount(ONE_BTC)
    await waitFor(() => {
      expect(quotedDestinations.at(-1)).toEqual([shown, other])
    })
    scene.unmount()
  })

  it("quotes only the shown address when the wallet's list lacks it", async () => {
    const scene = renderBitcoinSend()
    await scene.pickRecipientAsset('Ethereum')

    // A list that does not hold the shown address belongs to some other
    // wallet, so none of it may reach the provider:
    quotedDestinations.length = 0
    await scene.enterOwnWalletAddress(
      { publicAddress: EVM_ADDRESS, nativeAmount: ONE_ETH },
      [{ addressType: 'segwitAddress', publicAddress: OTHER_EVM_ADDRESS }]
    )
    await waitFor(() => {
      expect(quotedDestinations.at(-1)).toEqual([
        { addressType: 'publicAddress', publicAddress: EVM_ADDRESS }
      ])
    })
    scene.unmount()
  })

  it('quotes every address of a wallet picked through Myself', async () => {
    if (zecWallet == null || otherZecWallet == null) {
      throw new Error('No wallet')
    }
    const zecAddresses = await zecWallet.getAddresses({ tokenId: null })
    const otherZecAddresses = await otherZecWallet.getAddresses({
      tokenId: null
    })

    // A wallet on another chain shows its first address and quotes them all:
    const crossChain = renderBitcoinSend()
    await crossChain.pickOwnWallet(zecWallet)
    expect(crossChain.recipientAddress()).toBe(zecAddresses[0].publicAddress)
    quotedDestinations.length = 0
    await crossChain.enterSendAmount(ONE_BTC)
    await waitFor(() => {
      expect(quotedDestinations.at(-1)).toEqual(zecAddresses)
    })
    crossChain.unmount()

    // So does another wallet on the sending wallet's own chain, which the
    // tile hands over through the address callback instead:
    const sameChain = renderSend(zecWallet)
    await sameChain.pickOwnWallet(otherZecWallet)
    expect(sameChain.recipientAddress()).toBe(
      otherZecAddresses[0].publicAddress
    )
    await sameChain.toggleStealth()
    quotedDestinations.length = 0
    await sameChain.enterSendAmount(ONE_ZEC)
    await waitFor(() => {
      expect(quotedDestinations.at(-1)).toEqual(otherZecAddresses)
    })
    sameChain.unmount()
  })

  it('warns that a Stealth send to an own Zcash wallet pays its t1', async () => {
    const scene = renderBitcoinSend()
    await scene.pickOwnWallet(zecWallet)
    expect(scene.shows(ZCASH_TRANSPARENT_WARNING)).toBe(false)

    await scene.toggleStealth()
    expect(scene.shows(ZCASH_TRANSPARENT_WARNING)).toBe(true)
    expect(scene.shows(lstrings.stealth_zcash_transparent_payout_body)).toBe(
      true
    )
    expect(scene.shows(lstrings.stealth_swap_send_warning_title_private)).toBe(
      true
    )
    scene.unmount()
  })

  it('hides the transparent payout warning behind an error card', async () => {
    const scene = renderBitcoinSend()
    await scene.pickOwnWallet(zecWallet)
    await scene.toggleStealth()
    expect(scene.shows(ZCASH_TRANSPARENT_WARNING)).toBe(true)

    // The fake provider refuses every quote. The refusal settles on the
    // quote's own promise chain, so only a closing act scope delivers it:
    await scene.enterSendAmount(ONE_BTC)
    for (
      let i = 0;
      i < 50 && !scene.shows(lstrings.exchange_generic_error_title);
      ++i
    ) {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20))
      })
    }
    expect(scene.shows(lstrings.exchange_generic_error_title)).toBe(true)
    expect(scene.shows(ZCASH_TRANSPARENT_WARNING)).toBe(false)
    scene.unmount()
  })

  it('shows no transparent payout warning for a pasted t1', async () => {
    const scene = renderSend(zecWallet)
    await scene.toggleStealth()
    // No address yet, so there is no payout to warn about:
    expect(scene.shows(ZCASH_TRANSPARENT_WARNING)).toBe(false)

    await scene.enterParsedAddress(`t1${'3'.repeat(33)}`)

    expect(scene.shows(lstrings.stealth_swap_send_warning_title_private)).toBe(
      true
    )
    expect(scene.shows(ZCASH_TRANSPARENT_WARNING)).toBe(false)
    scene.unmount()
  })

  it('shows the scam warning on a plain send with no address', async () => {
    const scene = renderBitcoinSend()

    expect(scene.count(SCAM_WARNING)).toBe(1)
    expect(scene.shows(SWAP_BEFORE_SEND)).toBe(false)

    // An entered address retires the card: off to Ethereum and back leaves a
    // plain Bitcoin send with its recipient filled in.
    await scene.enterUnparsedAddress(`ethereum:${EVM_ADDRESS}@1`)
    await scene.enterUnparsedAddress(BTC_ADDRESS)
    expect(scene.recipientAddress()).toBe(BTC_ADDRESS)
    expect(scene.shows(SCAM_WARNING)).toBe(false)
    expect(scene.shows(SWAP_BEFORE_SEND)).toBe(false)
    scene.unmount()
  })

  it('shows the swap card alone on a swap-send with no address', async () => {
    const scene = renderBitcoinSend()

    // Picking the recipient's asset makes the send a swap before any address:
    await scene.pickRecipientAsset('Ethereum')
    expect(scene.recipientAddress()).toBe('')
    expect(scene.count(SWAP_BEFORE_SEND)).toBe(1)
    expect(scene.shows(SCAM_WARNING)).toBe(false)

    // The swap card stays the only one once the address is in:
    await scene.enterUnparsedAddress(`ethereum:${EVM_ADDRESS}@1`)
    expect(scene.recipientAddress()).toBe(EVM_ADDRESS)
    expect(scene.count(SWAP_BEFORE_SEND)).toBe(1)
    expect(scene.shows(SCAM_WARNING)).toBe(false)
    scene.unmount()
  })

  it('names the reason when no network takes the text', async () => {
    const scene = renderBitcoinSend()
    await scene.enterUnparsedAddress(`ethereum:${EVM_ADDRESS}@1`)
    mockShowToast.mockClear()

    expect(await scene.enterUnparsedAddress('not an address')).toBe(
      'This address does not match any network Edge can send to from this wallet.'
    )
    expect(scene.recipientAddress()).toBe(EVM_ADDRESS)
    expect(mockShowToast).not.toHaveBeenCalled()
    scene.unmount()
  })

  it("calls a mistyped address on the wallet's own network invalid there", async () => {
    const scene = renderBitcoinSend()
    const show = jest.spyOn(Airship, 'show')

    // Both fit Bitcoin's format, and the legacy one Bitcoin Cash's too, but
    // no parser accepts either:
    for (const typo of ['bc1' + 'q'.repeat(59), '1' + 'A'.repeat(33)]) {
      expect(await scene.enterUnparsedAddress(typo)).toBe(
        'This is not a valid Bitcoin address.'
      )
    }
    expect(show).not.toHaveBeenCalled()
    expect(scene.recipientAddress()).toBe('')

    show.mockRestore()
    scene.unmount()
  })

  it('offers no network for an address whose checksum none accepts', async () => {
    const scene = renderSend(ethWallet)
    const show = jest.spyOn(Airship, 'show')

    // Fits every EVM network's format, and no EVM parser accepts it:
    expect(await scene.enterUnparsedAddress('0x' + 'g'.repeat(40))).toBe(
      'This is not a valid Ethereum address.'
    )
    expect(show).not.toHaveBeenCalled()
    expect(scene.recipientAddress()).toBe('')

    show.mockRestore()
    scene.unmount()
  })

  it('calls a bad checksum invalid on an EVM network no swap pays', async () => {
    const scene = renderSend(ftmWallet)
    const show = jest.spyOn(Airship, 'show')

    // Fits only served EVM networks' formats, none of them the wallet's own:
    expect(await scene.enterUnparsedAddress('0x' + 'g'.repeat(40))).toBe(
      'This is not a valid Fantom address.'
    )
    expect(show).not.toHaveBeenCalled()
    expect(scene.recipientAddress()).toBe('')

    show.mockRestore()
    scene.unmount()
  })

  it('stays quiet when the user names the network in the picker', async () => {
    const scene = renderBitcoinSend()
    // A bare EVM address fits Ethereum and Avalanche alike, so the scene asks:
    const show = jest.spyOn(Airship, 'show').mockResolvedValueOnce('avalanche')

    expect(await scene.enterUnparsedAddress(EVM_ADDRESS)).toBe(true)
    expect(show).toHaveBeenCalledTimes(1)
    expect(scene.recipientAddress()).toBe(EVM_ADDRESS)
    expect(mockShowToast).not.toHaveBeenCalled()

    show.mockRestore()
    scene.unmount()
  })

  it('explains a plain send of an asset no Stealth route serves', async () => {
    const scene = renderSend(ftmWallet)
    const unserved = sprintf(lstrings.stealth_asset_unsupported_1s, 'AVAX')

    // The toggle shows dimmed and off with the reason under it, naming the
    // asset alone. Tapping it toasts the same reason and leaves it off:
    expect(scene.stealthDimmed()).toBe(true)
    expect(scene.stealthNotes()).toEqual([unserved])
    await scene.toggleStealth()
    expect(mockShowToast.mock.calls).toEqual([[unserved]])
    expect(scene.stealthArmed()).toBe(false)
    expect(scene.stealthNotes()).toEqual([unserved])
    scene.unmount()
  })

  it('names the Stealth minimum on a plain send and on a swap', async () => {
    const scene = renderSend(ethWallet)
    const belowMinimum = expect.stringMatching(
      /^Stealth routing needs at least/
    )
    await scene.enterParsedAddress(EVM_ADDRESS)
    await scene.enterAmount(FIVE_USD_OF_ETH)

    expect(scene.stealthDimmed()).toBe(true)
    expect(scene.stealthNotes()).toEqual([belowMinimum])
    await scene.toggleStealth()
    expect(mockShowToast.mock.calls).toEqual([[belowMinimum]])

    // The pick clears the recipient, so the send is entered again:
    await scene.pickRecipientAsset('Bitcoin')
    await scene.enterUnparsedAddress(BTC_ADDRESS)
    await scene.enterAmount(FIVE_USD_OF_ETH)
    expect(scene.stealthDimmed()).toBe(true)
    expect(scene.stealthNotes()).toEqual([belowMinimum])
    scene.unmount()
  })

  it('leaves the minimum to the quote once Stealth is on', async () => {
    const scene = renderSend(ethWallet)
    await scene.toggleStealth()
    expect(scene.stealthArmed()).toBe(true)

    // Armed, an amount below the private minimum is the quote's to report,
    // so the toggle keeps its usual note and stays tappable:
    await scene.enterParsedAddress(EVM_ADDRESS)
    await scene.enterAmount(FIVE_USD_OF_ETH)
    expect(scene.stealthArmed()).toBe(true)
    expect(scene.stealthDimmed()).toBe(false)
    expect(scene.stealthNotes()).toEqual([stealthInfo()])
    scene.unmount()
  })

  it('arms again on a picked recipient asset that has a route', async () => {
    const chains = asHoudiniChains({
      ...servedChains,
      ethereum: { ...servedChains.ethereum, coin: { hasSelfPrivate: false } }
    })
    const scene = renderSend(ethWallet, null, { chains })
    const toItself = sprintf(
      lstrings.stealth_self_private_unsupported_1s,
      'ETH'
    )
    await scene.pickRecipientAsset('Bitcoin')
    await scene.toggleStealth()
    expect(scene.stealthArmed()).toBe(true)

    // Back to ETH, which has no private route to itself, the toggle turns
    // off with its reason, and a pick with a route arms it again:
    await scene.pickRecipientAsset('Ethereum')
    expect(scene.stealthArmed()).toBe(false)
    expect(scene.stealthDimmed()).toBe(true)
    expect(scene.stealthNotes()).toEqual([toItself])
    await scene.pickRecipientAsset('Bitcoin')
    expect(scene.stealthArmed()).toBe(true)
    expect(scene.stealthDimmed()).toBe(false)
    scene.unmount()
  })

  it('arms again on a "Myself" pick that has a route', async () => {
    const chains = asHoudiniChains({
      ...servedChains,
      ethereum: { ...servedChains.ethereum, coin: { hasSelfPrivate: false } }
    })
    const scene = renderSend(ethWallet, null, { chains })
    await scene.pickRecipientAsset('Bitcoin')
    await scene.toggleStealth()
    expect(scene.stealthArmed()).toBe(true)

    // The "Myself" picker changes the recipient asset without the "Recipient
    // receives" picker, and the toggle follows it the same way:
    await scene.pickMyself('ethereum', EVM_ADDRESS)
    expect(scene.stealthArmed()).toBe(false)
    expect(scene.stealthDimmed()).toBe(true)
    expect(scene.stealthNotes()).toEqual([
      sprintf(lstrings.stealth_self_private_unsupported_1s, 'ETH')
    ])
    await scene.pickMyself('bitcoin', BTC_ADDRESS)
    expect(scene.recipientAddress()).toBe(BTC_ADDRESS)
    expect(scene.stealthArmed()).toBe(true)
    expect(scene.stealthDimmed()).toBe(false)
    scene.unmount()
  })

  it('arms again once the amount clears the private minimum', async () => {
    const chains = asHoudiniChains({
      ...servedChains,
      ethereum: { ...servedChains.ethereum, coin: { hasSelfPrivate: false } }
    })
    const scene = renderSend(ethWallet, null, { chains })
    await scene.pickRecipientAsset('Bitcoin')
    await scene.toggleStealth()
    await scene.pickMyself('ethereum', EVM_ADDRESS)
    expect(scene.stealthArmed()).toBe(false)

    // Below the minimum, a pair with a route still refuses to arm:
    await scene.enterAmount(FIVE_USD_OF_ETH)
    await scene.pickMyself('bitcoin', BTC_ADDRESS)
    expect(scene.stealthArmed()).toBe(false)
    expect(scene.stealthDimmed()).toBe(true)

    // Raising the amount clears the reason with no pick in between, and the
    // choice the user tapped on this visit arms again:
    await scene.enterAmount(FIFTY_USD_OF_ETH)
    expect(scene.stealthArmed()).toBe(true)
    expect(scene.stealthDimmed()).toBe(false)
    scene.unmount()
  })

  it('explains a send of an asset banned for the Stealth provider', async () => {
    const scene = renderSend(ethWallet, null, {
      houdiniBans: { source: [{ pluginId: 'ethereum' }], destination: [] }
    })
    const banned = sprintf(lstrings.stealth_asset_unsupported_1s, 'ETH')

    // The Exchange scene dims its toggle for the same ban:
    expect(scene.stealthDimmed()).toBe(true)
    expect(scene.stealthNotes()).toEqual([banned])
    await scene.toggleStealth()
    expect(mockShowToast.mock.calls).toEqual([[banned]])
    expect(scene.stealthArmed()).toBe(false)
    scene.unmount()
  })

  it('explains a send to an asset banned as a Stealth destination', async () => {
    const scene = renderSend(ethWallet, null, {
      houdiniBans: { source: [], destination: [{ pluginId: 'ethereum' }] }
    })
    const banned = sprintf(lstrings.stealth_asset_unsupported_1s, 'ETH')

    expect(scene.stealthDimmed()).toBe(true)
    expect(scene.stealthNotes()).toEqual([banned])
    await scene.toggleStealth()
    expect(mockShowToast.mock.calls).toEqual([[banned]])
    expect(scene.stealthArmed()).toBe(false)
    scene.unmount()
  })

  it('keeps the note after a Stealth quote fails and turns the toggle off', async () => {
    const scene = renderSend(ethWallet)
    await scene.enterParsedAddress(EVM_ADDRESS)
    await scene.enterAmount(FIFTY_USD_OF_ETH)
    expect(scene.stealthNotes()).toEqual([])

    await scene.toggleStealth()
    // The quote is refused after the tap returns, so its outcome is awaited
    // inside act, where the scene's updates from it are applied:
    await act(async () => {
      for (let i = 0; i < 50 && mockShowToast.mock.calls.length === 0; ++i) {
        await new Promise(resolve => setTimeout(resolve, 20))
      }
    })

    // Stealth turns back off and says so, and the reason stays under the
    // toggle, since the user did ask for the swap:
    expect(scene.stealthNotes()).toEqual([
      lstrings.stealth_route_unavailable_info
    ])
    expect(mockShowToast.mock.calls).toEqual([
      [lstrings.stealth_route_unavailable_toast]
    ])

    scene.unmount()
  })

  it('acknowledges a dismissed picker without adopting the address', async () => {
    const scene = renderBitcoinSend()
    const show = jest.spyOn(Airship, 'show').mockResolvedValueOnce(undefined)

    expect(await scene.enterUnparsedAddress(EVM_ADDRESS)).toBe(true)
    expect(scene.recipientAddress()).toBe('')
    expect(mockShowToast.mock.calls).toEqual([
      ['No network was selected, so the address was not added.']
    ])

    show.mockRestore()
    scene.unmount()
  })

  describe('with Stealth on', () => {
    it("leaves a coin code's amount off a same-asset token send", async () => {
      const scene = renderSend(ethWallet, USDT_TOKEN_ID)
      await scene.toggleStealth()
      expect(scene.stealthArmed()).toBe(true)

      // Read as the token being sent, this code is 2,000,000,000 USDT:
      await scene.enterParsedAddress(
        `ethereum:${EVM_ADDRESS}?value=2000000000000000`
      )
      expect(scene.recipientAddress()).toBe(EVM_ADDRESS)
      expect(scene.shows('2000000000 USDT')).toBe(false)
      expect(scene.shows('0 USDT')).toBe(true)
      scene.unmount()
    })

    it("keeps a code's destination tag through the switch", async () => {
      const scene = renderSend(xrpWallet)
      await scene.pickRecipientAsset('Bitcoin')
      await scene.toggleStealth()
      expect(scene.stealthArmed()).toBe(true)
      mockShowToast.mockClear()

      // The tag belongs to the network the send switches back to, not to the
      // Bitcoin payout it leaves, which takes no tag:
      expect(
        await scene.enterUnparsedAddress(`ripple:${XRP_ADDRESS}?dt=104729`)
      ).toBe(true)
      expect(scene.recipientAddress()).toBe(XRP_ADDRESS)
      expect(scene.shows('XRP (XRP)')).toBe(true)
      expect(scene.stealthArmed()).toBe(true)
      expect(scene.destinationTag()).toBe('104729')
      expect(mockShowToast.mock.calls).toEqual([
        ['Recipient network changed to XRP.']
      ])
      scene.unmount()
    })

    it('refuses a token with no private route to itself', async () => {
      const chains = asHoudiniChains({
        ...servedChains,
        ethereum: {
          ...servedChains.ethereum,
          tokens: { [USDT_TOKEN_ID]: { hasSelfPrivate: false } }
        }
      })
      const scene = renderSend(ethWallet, USDT_TOKEN_ID, { chains })
      // A cross-asset pair, so the toggle arms:
      await scene.pickRecipientAsset('Bitcoin')
      await scene.toggleStealth()
      expect(scene.stealthArmed()).toBe(true)
      mockShowToast.mockClear()

      expect(await scene.enterUnparsedAddress(EVM_ADDRESS)).toBe(
        'Stealth routing is not available when sending USDT to itself.'
      )
      expect(scene.recipientAddress()).toBe('')
      expect(scene.shows('Bitcoin (BTC)')).toBe(true)
      expect(scene.stealthArmed()).toBe(true)
      expect(mockShowToast).not.toHaveBeenCalled()
      scene.unmount()
    })

    /**
     * The core's account is frozen, so the quote call is swapped in on a
     * stand-in that forwards everything else. What the bridge attaches to the
     * stand-in itself stays its own.
     */
    const withFetchSwapQuotes = (
      fetchSwapQuotes: EdgeAccount['fetchSwapQuotes']
    ): EdgeAccount => {
      const coreAccount = account
      if (coreAccount == null) throw new Error('No account')
      return new Proxy<EdgeAccount>({} as unknown as EdgeAccount, {
        get: (target, key) =>
          key === 'fetchSwapQuotes'
            ? fetchSwapQuotes
            : Reflect.get(
                Object.hasOwn(target, key) ? target : coreAccount,
                key
              )
      })
    }

    it('refuses a source whose private route to itself came back unavailable', async () => {
      const fetchSwapQuotes = jest
        .fn<EdgeAccount['fetchSwapQuotes']>()
        .mockRejectedValue(
          Object.assign(new Error('No private route'), {
            name: 'SwapCurrencyError'
          })
        )
      const sceneAccount = withFetchSwapQuotes(fetchSwapQuotes)
      const scene = renderSend(ethWallet, null, { sceneAccount })

      // A same-asset Stealth Send whose quote finds no private route turns
      // the toggle off and remembers the route as unavailable:
      await scene.toggleStealth()
      await scene.enterParsedAddress(
        `ethereum:${EVM_ADDRESS}?value=1000000000000000000`
      )
      await waitFor(() => {
        expect(mockShowToast.mock.calls).toEqual([
          [lstrings.stealth_route_unavailable_toast]
        ])
      })
      expect(scene.stealthArmed()).toBe(false)

      // The user asked for Stealth on this visit, so a pair with a route
      // arms it again without a tap:
      await scene.pickRecipientAsset('Bitcoin')
      expect(scene.stealthArmed()).toBe(true)
      mockShowToast.mockClear()

      expect(await scene.enterUnparsedAddress(EVM_ADDRESS)).toBe(
        'Stealth routing is not available for this pair right now.'
      )
      expect(scene.shows('Bitcoin (BTC)')).toBe(true)
      expect(scene.stealthArmed()).toBe(true)
      expect(mockShowToast).not.toHaveBeenCalled()

      // Picking the source asset back turns the armed toggle off with the
      // refusal it already learned, rather than quoting that route again:
      await scene.pickRecipientAsset('Ethereum')
      expect(scene.stealthArmed()).toBe(false)
      expect(scene.stealthDimmed()).toBe(true)
      expect(scene.stealthNotes()).toEqual([
        lstrings.stealth_route_unavailable_info
      ])

      scene.unmount()
    })

    it('keeps the swap card when the receive amount cannot be guaranteed', async () => {
      // The provider prices this pair only from the send side. Send-priced
      // quotes stay pending, so neither a quote nor a send-side refusal
      // replaces the card under test:
      const fetchSwapQuotes = jest
        .fn<EdgeAccount['fetchSwapQuotes']>()
        .mockImplementation(async request =>
          request.quoteFor === 'to'
            ? await Promise.reject(
                Object.assign(new Error('No receive-priced route'), {
                  name: 'SwapCurrencyError'
                })
              )
            : await new Promise(() => {})
        )
      const sceneAccount = withFetchSwapQuotes(fetchSwapQuotes)
      const scene = renderSend(btcWallet, null, { sceneAccount })
      await scene.toggleStealth()
      await scene.enterParsedAddress(BTC_ADDRESS)
      expect(
        scene.shows(lstrings.stealth_swap_send_warning_title_private)
      ).toBe(true)

      expect(scene.recipientGetsRow().rightButtonDeactivated).toBe(false)

      await scene.enterRecipientAmount(ONE_BTC)
      await waitFor(() => {
        expect(mockShowToast.mock.calls).toEqual([
          [lstrings.stealth_fixed_to_unavailable_toast]
        ])
      })

      // The route cannot price from the receive side, so the edit button
      // reads as unavailable. A tap still explains why instead of opening the
      // editor:
      expect(scene.recipientGetsRow().rightButtonDeactivated).toBe(true)
      const show = jest.spyOn(Airship, 'show')
      await act(async () => {
        await scene.recipientGetsRow().onPress?.()
      })
      expect(show).not.toHaveBeenCalled()
      show.mockRestore()
      expect(mockShowToast.mock.calls).toEqual([
        [lstrings.stealth_fixed_to_unavailable_toast],
        [lstrings.stealth_fixed_to_unavailable_toast]
      ])

      // The toast says what changed. The swap card stays, and the receive row
      // reads as the estimate:
      expect(
        scene.shows(lstrings.stealth_swap_send_warning_title_private)
      ).toBe(true)
      expect(scene.shows('Receive amount is an estimate')).toBe(false)
      expect(scene.shows(`(${lstrings.stealth_estimated})`)).toBe(true)
      expect(scene.stealthArmed()).toBe(true)

      scene.unmount()
    })
  })
})
