import {
  afterAll,
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
  type EdgeCurrencyInfo,
  type EdgeCurrencyPlugin,
  type EdgeCurrencyWallet,
  type EdgeParsedUri,
  lockEdgeCorePlugins,
  makeFakeEdgeWorld
} from 'edge-core-js'
import * as React from 'react'

import { EdgeRow } from '../../components/rows/EdgeRow'
import { SendScene2 } from '../../components/scenes/SendScene2'
import type * as AirshipInstance from '../../components/services/AirshipInstance'
import { Airship, showToast } from '../../components/services/AirshipInstance'
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

jest.useRealTimers()

jest.mock('../../components/services/AirshipInstance', () => {
  const actual = jest.requireActual<typeof AirshipInstance>(
    '../../components/services/AirshipInstance'
  )
  return { ...actual, showToast: jest.fn() }
})

const BTC_ADDRESS = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
const EVM_ADDRESS = '0xF0825Aec2c79189C6bB1FEe9293F9478103c9B9e'

const SCAM_WARNING = 'Scam Warning'
const SWAP_BEFORE_SEND = 'Swap before send'

interface RecipientAssetItem {
  value: string
  name: string
}

/**
 * A fake plugin whose parser accepts one address format, bare or inside a
 * payment code, and reads the code's `amount` in whole native units.
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
        const amount = /(?:^|&)amount=(\d+)/.exec(query)?.[1]
        return { publicAddress, nativeAmount: amount }
      }
      return Object.assign(tools, { parseUri })
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

beforeAll(async () => {
  const dump = asUserDump(fakeUser)

  addEdgeCorePlugins({
    bitcoin: makeParsingPlugin(btcCurrencyInfo, /^bc1[a-z0-9]{39}$/),
    ethereum: makeParsingPlugin(ethCurrencyInfo, /^0x[0-9A-Fa-f]{40}$/),
    avalanche: makeParsingPlugin(avaxCurrencyInfo, /^0x[0-9A-Fa-f]{40}$/)
  })
  lockEdgeCorePlugins()

  const world = await makeFakeEdgeWorld([dump.data], {})
  context = await world.makeEdgeContext({
    apiKey: '',
    appId: '',
    plugins: { bitcoin: true, ethereum: true, avalanche: true }
  })
  account = await context.loginWithKey('bob', dump.loginKey)
  const btcInfo = account.getFirstWalletInfo('wallet:bitcoin')
  if (btcInfo == null) throw new Error('Unable to get wallet info')
  btcWallet = await account.waitForCurrencyWallet(btcInfo.id)
})

afterAll(async () => {
  await context?.close()
})

describe('SendScene2 recipient network', () => {
  const mockShowToast = jest.mocked(showToast)

  beforeEach(() => {
    mockShowToast.mockClear()
  })

  /** Renders a Bitcoin send and hands text to the scene as the tile would. */
  const renderBitcoinSend = (): {
    enterUnparsedAddress: (text: string) => Promise<boolean | string>
    /** Picks an asset by name in the "Recipient receives" picker. */
    pickRecipientAsset: (name: string) => Promise<void>
    recipientAddress: () => string
    /** How many text nodes on the scene read exactly this. */
    count: (text: string) => number
    /** Whether some text node on the scene reads exactly this. */
    shows: (text: string) => boolean
    unmount: () => void
  } => {
    if (btcWallet == null) throw new Error('No wallet')
    const rootState: FakeState = { ...fakeRootState, core: { account } }
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
})
