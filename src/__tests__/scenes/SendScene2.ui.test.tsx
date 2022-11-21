import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'
import { asMap, asObject, asOptional, asString, asUnknown } from 'cleaners'
import { addEdgeCorePlugins, EdgeAccount, EdgeContext, EdgeCurrencyWallet, lockEdgeCorePlugins, makeFakeEdgeWorld } from 'edge-core-js'
import fs from 'fs'
import * as React from 'react'
import { Provider } from 'react-redux'
import TestRenderer from 'react-test-renderer'
import { createStore } from 'redux'

import { SendScene2 } from '../../components/scenes/SendScene2'
import { rootReducer } from '../../reducers/RootReducer'
import { RouteProp } from '../../types/routerTypes'
import { avaxCurrencyInfo } from '../../util/fake/fakeAvaxInfo'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakePlugin } from '../../util/fake/fakeCurrencyPlugin'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import { fakeNavigation } from '../../util/fake/fakeNavigation'
import { fakeRootState } from '../../util/fake/fakeRootState'

jest.useRealTimers()

let context: EdgeContext | undefined
let account: EdgeAccount | undefined

let btcWallet: EdgeCurrencyWallet | undefined
let ethWallet: EdgeCurrencyWallet | undefined
let avaxWallet: EdgeCurrencyWallet | undefined

const DUMP_USER_FILE = './src/util/fake/fakeUserDump.json'

const asDateStr = (raw: string): Date => new Date(raw)

const asFakeUser = asObject({
  username: asString,
  lastLogin: asOptional(asDateStr),
  loginId: asString,
  loginKey: asString,
  repos: asMap(asMap(asUnknown)),
  server: asUnknown
})

const asUserDump = asObject({
  loginKey: asString,
  data: asFakeUser
})

beforeAll(async () => {
  const userFile = fs.readFileSync(DUMP_USER_FILE, { encoding: 'utf8' })
  const json = JSON.parse(userFile)
  const dump = asUserDump(json)
  const loginKey = dump.loginKey
  const fakeUsers = []
  fakeUsers.push(dump.data)

  const allPlugins = {
    bitcoin: makeFakePlugin(btcCurrencyInfo),
    ethereum: makeFakePlugin(ethCurrencyInfo),
    avalanche: makeFakePlugin(avaxCurrencyInfo)
  }

  addEdgeCorePlugins(allPlugins)
  lockEdgeCorePlugins()

  const world = await makeFakeEdgeWorld(fakeUsers, {})
  context = await world.makeEdgeContext({ apiKey: '', appId: '', plugins: { bitcoin: true, ethereum: true, avalanche: true } })
  account = await context.loginWithKey('bob', loginKey)
  const btcInfo = await account.getFirstWalletInfo('wallet:bitcoin')
  const ethInfo = await account.getFirstWalletInfo('wallet:ethereum')
  const avaxInfo = await account.getFirstWalletInfo('wallet:avalanche')

  btcWallet = await account.waitForCurrencyWallet(btcInfo?.id ?? '')
  ethWallet = await account.waitForCurrencyWallet(ethInfo?.id ?? '')
  avaxWallet = await account.waitForCurrencyWallet(avaxInfo?.id ?? '')

  if (btcWallet == null) process.exit(-1)
  if (ethWallet == null) process.exit(-1)
  if (avaxWallet == null) process.exit(-1)
})

describe('SendScene2', () => {
  it('Render SendScene', () => {
    if (btcWallet == null) return

    const rootState: any = fakeRootState
    const navigation = fakeNavigation
    const route: RouteProp<'send2'> = {
      name: 'send2',
      params: {
        walletId: btcWallet.id
      }
    }

    rootState.core = {
      account
    }
    const store = createStore(rootReducer, rootState)

    const renderer = TestRenderer.create(
      <Provider store={store}>
        <SendScene2 route={route} navigation={navigation} />
      </Provider>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
  it('1 spendTarget', () => {
    if (btcWallet == null) return

    const rootState: any = fakeRootState
    const navigation = fakeNavigation
    const route: RouteProp<'send2'> = {
      name: 'send2',
      params: {
        walletId: btcWallet.id,
        spendInfo: {
          spendTargets: [{ publicAddress: 'some pub address', nativeAmount: '1234' }]
        }
      }
    }

    rootState.core = {
      account
    }
    const store = createStore(rootReducer, rootState)

    const renderer = TestRenderer.create(
      <Provider store={store}>
        <SendScene2 route={route} navigation={navigation} />
      </Provider>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
  it('1 spendTarget with info tiles', () => {
    if (btcWallet == null) return

    const rootState: any = fakeRootState
    const navigation = fakeNavigation
    const route: RouteProp<'send2'> = {
      name: 'send2',
      params: {
        infoTiles: [
          { label: 'info tile label 1', value: 'info tile value 1' },
          { label: 'info tile label 2', value: 'info tile value 2' }
        ],
        walletId: btcWallet.id,
        spendInfo: {
          spendTargets: [{ publicAddress: 'some pub address', nativeAmount: '1234' }]
        }
      }
    }

    rootState.core = {
      account
    }
    const store = createStore(rootReducer, rootState)

    const renderer = TestRenderer.create(
      <Provider store={store}>
        <SendScene2 route={route} navigation={navigation} />
      </Provider>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
  it('2 spendTargets', () => {
    if (btcWallet == null) return

    const rootState: any = fakeRootState
    const navigation = fakeNavigation
    const route: RouteProp<'send2'> = {
      name: 'send2',
      params: {
        walletId: btcWallet.id,
        spendInfo: {
          spendTargets: [
            { publicAddress: 'some pub address', nativeAmount: '1234' },
            { publicAddress: 'some pub address 2', nativeAmount: '12345' }
          ]
        }
      }
    }

    rootState.core = {
      account
    }
    const store = createStore(rootReducer, rootState)

    const renderer = TestRenderer.create(
      <Provider store={store}>
        <SendScene2 route={route} navigation={navigation} />
      </Provider>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('2 spendTargets hide tiles', () => {
    if (btcWallet == null) return

    const rootState: any = fakeRootState
    const navigation = fakeNavigation
    const route: RouteProp<'send2'> = {
      name: 'send2',
      params: {
        hiddenTilesMap: { address: true },
        walletId: btcWallet.id,
        spendInfo: {
          spendTargets: [
            { publicAddress: 'some pub address', nativeAmount: '1234' },
            { publicAddress: 'some pub address 2', nativeAmount: '12345' }
          ]
        }
      }
    }

    rootState.core = {
      account
    }
    const store = createStore(rootReducer, rootState)

    // Hide Address
    const renderer = TestRenderer.create(
      <Provider store={store}>
        <SendScene2 route={route} navigation={navigation} />
      </Provider>
    )
    expect(renderer.toJSON()).toMatchSnapshot()

    // Hide Amount
    route.params.hiddenTilesMap = { amount: true }
    const renderer2 = TestRenderer.create(
      <Provider store={store}>
        <SendScene2 route={route} navigation={navigation} />
      </Provider>
    )
    expect(renderer2.toJSON()).toMatchSnapshot()

    // Hide Both
    route.params.hiddenTilesMap = { amount: true, address: true }
    const renderer3 = TestRenderer.create(
      <Provider store={store}>
        <SendScene2 route={route} navigation={navigation} />
      </Provider>
    )
    expect(renderer3.toJSON()).toMatchSnapshot()
  })

  it('2 spendTargets lock tiles', () => {
    if (btcWallet == null) return

    const rootState: any = fakeRootState
    const navigation = fakeNavigation
    const route: RouteProp<'send2'> = {
      name: 'send2',
      params: {
        lockTilesMap: { address: true },
        walletId: btcWallet.id,
        spendInfo: {
          spendTargets: [
            { publicAddress: 'some pub address', nativeAmount: '1234' },
            { publicAddress: 'some pub address 2', nativeAmount: '12345' }
          ]
        }
      }
    }

    rootState.core = {
      account
    }
    const store = createStore(rootReducer, rootState)

    // Lock Address
    const renderer = TestRenderer.create(
      <Provider store={store}>
        <SendScene2 route={route} navigation={navigation} />
      </Provider>
    )
    expect(renderer.toJSON()).toMatchSnapshot()

    // Lock Amount
    route.params.lockTilesMap = { amount: true }
    const renderer2 = TestRenderer.create(
      <Provider store={store}>
        <SendScene2 route={route} navigation={navigation} />
      </Provider>
    )
    expect(renderer2.toJSON()).toMatchSnapshot()

    // Lock Both
    route.params.lockTilesMap = { amount: true, address: true }
    const renderer3 = TestRenderer.create(
      <Provider store={store}>
        <SendScene2 route={route} navigation={navigation} />
      </Provider>
    )
    expect(renderer3.toJSON()).toMatchSnapshot()
  })
})

afterAll(async () => {
  await context?.close()
})
