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
  type EdgeParsedUri,
  type EdgeSwapPlugin,
  type EdgeTokenId,
  lockEdgeCorePlugins,
  makeFakeEdgeWorld,
  SwapCurrencyError
} from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { EdgeRow } from '../../components/rows/EdgeRow'
import { SendScene2 } from '../../components/scenes/SendScene2'
import type * as AirshipInstance from '../../components/services/AirshipInstance'
import { Airship, showToast } from '../../components/services/AirshipInstance'
import { StealthInfoText } from '../../components/themed/StealthInfoText'
import { AddressTile2 } from '../../components/tiles/AddressTile2'
import { lstrings } from '../../locales/strings'
import { avaxCurrencyInfo } from '../../util/fake/fakeAvaxInfo'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakePlugin } from '../../util/fake/fakeCurrencyPlugin'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'
import fakeUser from '../../util/fake/fakeUserDump.json'
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
const OTHER_EVM_ADDRESS = '0x52908400098527886E0F7030069857D2E4169EE7'
const ZCASH_ADDRESS = /^(u1[a-z0-9]+|zs1[a-z0-9]+|t1[1-9A-HJ-NP-Za-km-z]{33})$/
// An amount over the provider's floor, so the quote goes out:
const ONE_BTC = '100000000'
const ONE_ETH = '1000000000000000000'
const ONE_ZEC = '100000000'
const USDT_TOKEN_ID = 'dac17f958d2ee523a2206206994597c13d831ec7'

// Either side of the provider's 25 USD floor for a private route, at the fake
// rates' 1326.1958 USD per ETH:
const FIVE_USD_OF_ETH = '3770000000000000'
const FIFTY_USD_OF_ETH = '37700000000000000'

const SCAM_WARNING = 'Scam Warning'
const SWAP_BEFORE_SEND = 'Swap before send'
const ZCASH_TRANSPARENT_WARNING = 'Transparent Zcash payout'

interface RecipientAssetItem {
  value: string
  name: string
}

/**
 * A fake plugin whose parser accepts one address format, bare or inside a
 * payment code, and reads the code's `amount` or EIP-681 `value` in whole
 * native units. Like the real parsers it names no asset for either, so the
 * wallet stamps the asset it was asked about on both.
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
        return { publicAddress, nativeAmount: amount }
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
let zecWallet: EdgeCurrencyWallet | undefined
let otherZecWallet: EdgeCurrencyWallet | undefined

beforeAll(async () => {
  const dump = asUserDump(fakeUser)

  addEdgeCorePlugins({
    bitcoin: makeParsingPlugin(btcCurrencyInfo, /^bc1[a-z0-9]{39}$/),
    ethereum: makeParsingPlugin(ethCurrencyInfo, /^0x[0-9A-Fa-f]{40}$/),
    avalanche: makeParsingPlugin(avaxCurrencyInfo, /^0x[0-9A-Fa-f]{40}$/),
    fantom: makeParsingPlugin(ftmCurrencyInfo, /^0x[0-9A-Fa-f]{40}$/),
    zcash: makeZcashPlugin(),
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
    /** The props the scene hands the address tile. */
    tileProps: () => React.ComponentProps<typeof AddressTile2>
    recipientAddress: () => string
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
    tokenId: EdgeTokenId = null
  ): RenderedSend => {
    if (wallet == null) throw new Error('No wallet')
    const rootState: FakeState = { ...fakeRootState, core: { account } }
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
      tileProps,
      pickRecipientAsset: async name => {
        const show = jest.spyOn(Airship, 'show').mockImplementationOnce(
          // The scene's own picker, answered from the rows it offers:
          async (renderModal: (bridge: never) => React.ReactNode) => {
            const modal = renderModal(
              undefined as never
            ) as React.ReactElement<{
              items: RecipientAssetItem[]
            }>
            return modal.props.items.find(item => item.name === name)?.value
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
        .selfTransfer?.onPickCrossAsset('ethereum', EVM_ADDRESS, [other, shown])
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

  it('leaves a plain send of an asset no Stealth route serves unexplained', async () => {
    const scene = renderSend(ftmWallet)

    // No swap is involved until the user asks for one, so nothing sits under
    // the toggle. Tapping it says why it stays off, naming the asset alone:
    expect(scene.stealthNotes()).toEqual([])
    await scene.toggleStealth()
    expect(mockShowToast.mock.calls).toEqual([
      [sprintf(lstrings.stealth_asset_unsupported_1s, 'AVAX')]
    ])
    expect(scene.stealthNotes()).toEqual([])
    scene.unmount()
  })

  it('names the Stealth minimum only once a swap is picked', async () => {
    const scene = renderSend(ethWallet)
    const belowMinimum = expect.stringMatching(
      /^Stealth routing needs at least/
    )
    await scene.enterParsedAddress(EVM_ADDRESS)
    await scene.enterAmount(FIVE_USD_OF_ETH)

    expect(scene.stealthNotes()).toEqual([])
    await scene.toggleStealth()
    expect(mockShowToast.mock.calls).toEqual([[belowMinimum]])

    // A picked recipient asset makes the send a swap, so the reason shows.
    // The pick clears the recipient, so the send is entered again:
    await scene.pickRecipientAsset('Bitcoin')
    await scene.enterUnparsedAddress(BTC_ADDRESS)
    await scene.enterAmount(FIVE_USD_OF_ETH)
    expect(scene.stealthNotes()).toEqual([belowMinimum])
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
})
