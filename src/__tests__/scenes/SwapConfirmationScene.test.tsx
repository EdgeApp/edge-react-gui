import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'
import { asDate, asObject, asOptional, asString, asUnknown } from 'cleaners'
import {
  addEdgeCorePlugins,
  EdgeAccount,
  EdgeContext,
  EdgeCurrencyWallet,
  EdgeSwapInfo,
  EdgeSwapQuote,
  lockEdgeCorePlugins,
  makeFakeEdgeWorld
} from 'edge-core-js'
import process from 'process'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { pickBestQuote, SwapConfirmationScene } from '../../components/scenes/SwapConfirmationScene'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakePlugin } from '../../util/fake/fakeCurrencyPlugin'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeSwapTabSceneProps } from '../../util/fake/fakeSceneProps'
import fakeUser from '../../util/fake/fakeUserDump.json'

jest.useRealTimers()

const dummySwapInfo: EdgeSwapInfo = {
  pluginId: '',
  displayName: '',
  supportEmail: ''
}

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
    ethereum: makeFakePlugin(ethCurrencyInfo)
  }

  addEdgeCorePlugins(allPlugins)
  lockEdgeCorePlugins()

  const world = await makeFakeEdgeWorld(fakeUsers, {})
  context = await world.makeEdgeContext({ apiKey: '', appId: '', plugins: { bitcoin: true, ethereum: true } })
  account = await context.loginWithKey('bob', loginKey)
  const btcInfo = await account.getFirstWalletInfo('wallet:bitcoin')
  const ethInfo = await account.getFirstWalletInfo('wallet:ethereum')
  if (btcInfo == null || ethInfo == null) {
    console.error('Unable to get wallet infos')
    process.exit(-1)
  }
  btcWallet = await account.waitForCurrencyWallet(btcInfo.id)
  ethWallet = await account.waitForCurrencyWallet(ethInfo.id)
})

describe('SwapConfirmationScene', () => {
  it('should render with loading props', () => {
    if (btcWallet == null || ethWallet == null) return
    const rootState: FakeState = { ...fakeRootState, core: { account } }

    const fakeRequest: any = {
      fromWallet: btcWallet,
      toWallet: ethWallet
    }

    const quote: EdgeSwapQuote = {
      swapInfo: dummySwapInfo,
      request: fakeRequest,
      isEstimate: true,
      fromNativeAmount: '10000',
      toNativeAmount: '10000',
      networkFee: {
        currencyCode: 'BTC',
        nativeAmount: '1'
      },
      pluginId: 'bitcoin',
      approve: async () => {
        return {
          transaction: {
            blockHeight: 500000,
            currencyCode: 'BTC',
            date: 1524476980,
            deviceDescription: 'iphone12',
            isSend: false,
            memos: [],
            metadata: {
              name: 'Crazy Person',
              category: 'Income:Mo Money',
              notes: 'Hell yeah! Thanks for the fish <<&&>>',
              amountFiat: 12000.45
            },
            nativeAmount: '123000000',
            networkFee: '1000',
            ourReceiveAddresses: ['receiveaddress1', 'receiveaddress2'],
            parentNetworkFee: '10002',
            signedTx: '298t983y4t983y4t93y4g98oeshfgi4t89w394t',
            tokenId: null,
            txid: 'txid1',
            walletId: ''
          }
        }
      },
      close: async () => {}
    }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <SwapConfirmationScene
          {...fakeSwapTabSceneProps('swapConfirmation', {
            quotes: [quote],
            selectedQuote: quote,
            onApprove: () => undefined
          })}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })

  let quotes: TestSwapQuote[]
  let bestQuote: EdgeSwapQuote

  it('pickBestQuote fixed', () => {
    quotes = [
      { swapInfo: { isDex: false }, isEstimate: false, fromNativeAmount: '100', toNativeAmount: '10000' },
      { swapInfo: { isDex: false }, isEstimate: false, fromNativeAmount: '100', toNativeAmount: '11000' }
    ]
    bestQuote = pickBestQuote(quotes as any)
    expect(bestQuote).toEqual(quotes[1])
  })
  it('pickBestQuote prefer DEX first in list', () => {
    quotes = [
      { swapInfo: { isDex: true }, isEstimate: true, fromNativeAmount: '100', toNativeAmount: '11000' },
      { swapInfo: { isDex: false }, isEstimate: false, fromNativeAmount: '100', toNativeAmount: '10000' }
    ]
    bestQuote = pickBestQuote(quotes as any)
    expect(bestQuote).toEqual(quotes[0])
  })

  it('pickBestQuote prefer DEX second in list', () => {
    quotes = [
      { swapInfo: { isDex: false }, isEstimate: false, fromNativeAmount: '100', toNativeAmount: '10000' },
      { swapInfo: { isDex: true }, isEstimate: true, fromNativeAmount: '100', toNativeAmount: '11000' }
    ]
    bestQuote = pickBestQuote(quotes as any)
    expect(bestQuote).toEqual(quotes[1])
  })
  it('pickBestQuote prefer CEX', () => {
    quotes = [
      { swapInfo: { isDex: false }, isEstimate: false, fromNativeAmount: '100', toNativeAmount: '10000' },
      { swapInfo: { isDex: true }, isEstimate: true, fromNativeAmount: '100', toNativeAmount: '9000' }
    ]
    bestQuote = pickBestQuote(quotes as any)
    expect(bestQuote).toEqual(quotes[0])
  })
  it('pickBestQuote prefer fixed', () => {
    quotes = [
      { swapInfo: { isDex: false }, isEstimate: true, fromNativeAmount: '100', toNativeAmount: '10000' },
      { swapInfo: { isDex: false }, isEstimate: false, fromNativeAmount: '100', toNativeAmount: '9000' }
    ]
    bestQuote = pickBestQuote(quotes as any)
    expect(bestQuote).toEqual(quotes[1])
  })
})

afterAll(async () => {
  await context?.close()
})

interface TestSwapQuote {
  swapInfo: { isDex: boolean }
  isEstimate: boolean
  fromNativeAmount: string
  toNativeAmount: string
}
