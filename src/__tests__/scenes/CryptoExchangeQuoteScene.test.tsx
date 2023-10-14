import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'
import { asDate, asObject, asOptional, asString, asUnknown } from 'cleaners'
import { addEdgeCorePlugins, EdgeAccount, EdgeContext, EdgeSwapInfo, EdgeSwapQuote, lockEdgeCorePlugins, makeFakeEdgeWorld } from 'edge-core-js'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { CryptoExchangeQuoteScene } from '../../components/scenes/CryptoExchangeQuoteScene'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakePlugin } from '../../util/fake/fakeCurrencyPlugin'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'
import fakeUser from '../../util/fake/fakeUserDump.json'

jest.useRealTimers()

const dummySwapInfo: EdgeSwapInfo = {
  pluginId: '',
  displayName: '',
  supportEmail: ''
}

let context: EdgeContext | undefined
let account: EdgeAccount | undefined

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
    bitcoin: makeFakePlugin(btcCurrencyInfo)
  }

  addEdgeCorePlugins(allPlugins)
  lockEdgeCorePlugins()

  const world = await makeFakeEdgeWorld(fakeUsers, {})
  context = await world.makeEdgeContext({ apiKey: '', appId: '', plugins: { bitcoin: true } })
  account = await context.loginWithKey('bob', loginKey)
})

describe('CryptoExchangeQuoteScreenComponent', () => {
  it('should render with loading props', () => {
    const rootState: FakeState = { ...fakeRootState, core: { account } }

    const fakeRequest: any = {
      fromWallet: {
        fiatCurrencyCode: 'USD',
        name: '',
        currencyInfo: {
          pluginId: 'bitcoin'
        }
      },
      toWallet: {
        fiatCurrencyCode: 'USD',
        name: '',
        currencyInfo: {
          pluginId: 'bitcoin'
        }
      }
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
            txid: 'txid1',
            walletId: ''
          }
        }
      },
      close: async () => {}
    }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <CryptoExchangeQuoteScene
          {...fakeSceneProps('exchangeQuote', {
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
})

afterAll(async () => {
  await context?.close()
})
