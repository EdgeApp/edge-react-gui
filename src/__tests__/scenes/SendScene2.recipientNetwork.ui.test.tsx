import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { asDate, asObject, asOptional, asString, asUnknown } from 'cleaners'
import {
  addEdgeCorePlugins,
  type EdgeAccount,
  type EdgeContext,
  type EdgeCurrencyInfo,
  type EdgeCurrencyPlugin,
  type EdgeCurrencyWallet,
  type EdgeParsedUri,
  type EdgeTokenId,
  lockEdgeCorePlugins,
  makeFakeEdgeWorld
} from 'edge-core-js'
import * as React from 'react'

import type { RecipientAssetRow } from '../../components/modals/RecipientAssetListModal'
import { EdgeRow } from '../../components/rows/EdgeRow'
import { SendScene2 } from '../../components/scenes/SendScene2'
import type * as AirshipInstance from '../../components/services/AirshipInstance'
import { Airship, showToast } from '../../components/services/AirshipInstance'
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

jest.useRealTimers()

jest.mock('../../components/services/AirshipInstance', () => {
  const actual = jest.requireActual<typeof AirshipInstance>(
    '../../components/services/AirshipInstance'
  )
  return { ...actual, showToast: jest.fn() }
})

const BTC_ADDRESS = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
const EVM_ADDRESS = '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e'
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
  }
}
const houdiniChains = asHoudiniChains(servedChains)

const SCAM_WARNING = 'Scam Warning'
const SWAP_BEFORE_SEND = 'Swap before send'

/**
 * A fake plugin whose parser accepts one address format, bare or inside a
 * payment code, and reads the code's `amount` or EIP-681 `value` in whole
 * native units, plus an XRP-style `dt` destination tag. Like the real parsers
 * it names no asset for either, so the wallet stamps the asset it was asked
 * about on both.
 */
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
      const parseUri = async (uri: string): Promise<EdgeParsedUri> => {
        const [target, query = ''] = uri.replace(/^[a-z]+:/, '').split('?')
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
let btcWallet: EdgeCurrencyWallet | undefined
let ethWallet: EdgeCurrencyWallet | undefined
let ftmWallet: EdgeCurrencyWallet | undefined
let xrpWallet: EdgeCurrencyWallet | undefined

beforeAll(async () => {
  const dump = asUserDump(fakeUser)

  addEdgeCorePlugins({
    bitcoin: makeParsingPlugin(btcCurrencyInfo, /^bc1[a-z0-9]{39}$/),
    ethereum: makeParsingPlugin(ethCurrencyInfo, /^0x[0-9A-Fa-f]{40}$/),
    avalanche: makeParsingPlugin(avaxCurrencyInfo, /^0x[0-9A-Fa-f]{40}$/),
    fantom: makeParsingPlugin(ftmCurrencyInfo, /^0x[0-9A-Fa-f]{40}$/),
    ripple: makeParsingPlugin(xrpCurrencyInfo, /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/)
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
      ripple: true
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
    /** Hands the scene a payment code the sending wallet's parser accepted. */
    enterParsedAddress: (text: string) => Promise<void>
    /** Picks an asset by name in the "Recipient receives" picker. */
    pickRecipientAsset: (name: string) => Promise<void>
    recipientAddress: () => string
    /** Presses the Stealth Send toggle. */
    toggleStealth: () => Promise<void>
    stealthArmed: () => boolean
    /** The Destination Tag row's text, or `undefined` with no row shown. */
    destinationTag: () => string | undefined
    /** How many text nodes on the scene read exactly this. */
    count: (text: string) => number
    /** Where a text first appears on the scene, top to bottom, or -1. */
    position: (text: string) => number
    /** Whether some text node on the scene reads exactly this. */
    shows: (text: string) => boolean
    unmount: () => void
  }

  /** Renders a send and hands text to the scene as the tile would. */
  const renderSend = (
    wallet: EdgeCurrencyWallet | undefined,
    tokenId: EdgeTokenId = null,
    opts: { chains?: HoudiniChains; sceneAccount?: EdgeAccount } = {}
  ): RenderedSend => {
    if (wallet == null) throw new Error('No wallet')
    const { chains = houdiniChains, sceneAccount = account } = opts
    const rootState: FakeState = {
      ...fakeRootState,
      core: { account: sceneAccount },
      ui: { ...fakeRootState.ui, houdiniChains: chains }
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
    return {
      enterUnparsedAddress: async text => {
        let result: boolean | string = false
        await act(async () => {
          result =
            (await tileProps().onUnparsedAddress?.(text, 'other')) ?? false
        })
        return result
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
      recipientAddress: () => tileProps().recipientAddress,
      toggleStealth: async () => {
        await act(async () => {
          fireEvent.press(rendered.getByText(lstrings.stealth_send_toggle))
        })
      },
      stealthArmed: () =>
        rendered.UNSAFE_getByProps({ label: lstrings.stealth_send_toggle })
          .props.value === true,
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

    it('refuses a source whose private route to itself came back unavailable', async () => {
      const coreAccount = account
      if (coreAccount == null) throw new Error('No account')
      const fetchSwapQuotes = jest
        .fn<EdgeAccount['fetchSwapQuotes']>()
        .mockRejectedValue(
          Object.assign(new Error('No private route'), {
            name: 'SwapCurrencyError'
          })
        )
      // The core's account is frozen, so the quote call is swapped in on a
      // stand-in that forwards everything else. What the bridge attaches to
      // the stand-in itself stays its own:
      const sceneAccount = new Proxy<EdgeAccount>(
        {} as unknown as EdgeAccount,
        {
          get: (target, key) =>
            key === 'fetchSwapQuotes'
              ? fetchSwapQuotes
              : Reflect.get(
                  Object.hasOwn(target, key) ? target : coreAccount,
                  key
                )
        }
      )
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

      await scene.pickRecipientAsset('Bitcoin')
      await scene.toggleStealth()
      expect(scene.stealthArmed()).toBe(true)
      mockShowToast.mockClear()

      expect(await scene.enterUnparsedAddress(EVM_ADDRESS)).toBe(
        'Stealth routing is not available for this pair right now.'
      )
      expect(scene.shows('Bitcoin (BTC)')).toBe(true)
      expect(scene.stealthArmed()).toBe(true)
      expect(mockShowToast).not.toHaveBeenCalled()

      scene.unmount()
    })
  })
})
