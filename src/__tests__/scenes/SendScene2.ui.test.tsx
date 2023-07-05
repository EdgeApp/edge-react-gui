import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'
import { asDate, asObject, asOptional, asString, asUnknown } from 'cleaners'
import { addEdgeCorePlugins, EdgeAccount, EdgeContext, EdgeCurrencyWallet, lockEdgeCorePlugins, makeFakeEdgeWorld } from 'edge-core-js'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { SendScene2, SendScene2Params } from '../../components/scenes/SendScene2'
import { avaxCurrencyInfo } from '../../util/fake/fakeAvaxInfo'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakePlugin } from '../../util/fake/fakeCurrencyPlugin'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'
import fakeUser from '../../util/fake/fakeUserDump.json'

jest.useRealTimers()

let context: EdgeContext | undefined
let account: EdgeAccount | undefined

let btcWallet: EdgeCurrencyWallet | undefined

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
  context = await world.makeEdgeContext({ apiKey: '', appId: '', plugins: { bitcoin: true, ethereum: true, avalanche: true } })
  account = await context.loginWithKey('bob', loginKey)
  const btcInfo = await account.getFirstWalletInfo('wallet:bitcoin')

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

  // For use later when we need tests that use EVM currencies
  // ethWallet = await account.waitForCurrencyWallet(ethInfo.id)
  // avaxWallet = await account.waitForCurrencyWallet(avaxInfo.id)
})

describe('SendScene2', () => {
  it('Render SendScene', () => {
    if (btcWallet == null) return

    const rootState: FakeState = { ...fakeRootState, core: { account } }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <SendScene2
          {...fakeSceneProps('send2', {
            walletId: btcWallet.id,
            doCheckAndShowGetCryptoModal: false
          })}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
  it('1 spendTarget', () => {
    if (btcWallet == null) return

    const rootState: FakeState = { ...fakeRootState, core: { account } }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <SendScene2
          {...fakeSceneProps('send2', {
            walletId: btcWallet.id,
            spendInfo: {
              spendTargets: [{ publicAddress: 'some pub address', nativeAmount: '1234' }]
            },
            doCheckAndShowGetCryptoModal: false
          })}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
  it('1 spendTarget with info tiles', () => {
    if (btcWallet == null) return

    const rootState: FakeState = { ...fakeRootState, core: { account } }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <SendScene2
          {...fakeSceneProps('send2', {
            infoTiles: [
              { label: 'info tile label 1', value: 'info tile value 1' },
              { label: 'info tile label 2', value: 'info tile value 2' }
            ],
            walletId: btcWallet.id,
            spendInfo: {
              spendTargets: [{ publicAddress: 'some pub address', nativeAmount: '1234' }]
            },
            doCheckAndShowGetCryptoModal: false
          })}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
  it('2 spendTargets', () => {
    if (btcWallet == null) return

    const rootState: FakeState = { ...fakeRootState, core: { account } }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <SendScene2
          {...fakeSceneProps('send2', {
            walletId: btcWallet.id,
            spendInfo: {
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

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })

  it('2 spendTargets hide tiles', () => {
    if (btcWallet == null) return

    const rootState: FakeState = { ...fakeRootState, core: { account } }

    const params: SendScene2Params = {
      hiddenFeaturesMap: { address: true },
      walletId: btcWallet.id,
      spendInfo: {
        spendTargets: [
          { publicAddress: 'some pub address', nativeAmount: '1234' },
          { publicAddress: 'some pub address 2', nativeAmount: '12345' }
        ]
      },
      doCheckAndShowGetCryptoModal: false
    }

    // Hide Address
    const renderer = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <SendScene2 {...fakeSceneProps('send2', params)} />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()

    // Hide Amount
    params.hiddenFeaturesMap = { amount: true }
    const renderer2 = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <SendScene2 {...fakeSceneProps('send2', params)} />
      </FakeProviders>
    )
    expect(renderer2.toJSON()).toMatchSnapshot()

    // Hide Both
    params.hiddenFeaturesMap = { amount: true, address: true }
    const renderer3 = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <SendScene2 {...fakeSceneProps('send2', params)} />
      </FakeProviders>
    )
    expect(renderer3.toJSON()).toMatchSnapshot()
  })

  it('2 spendTargets lock tiles', () => {
    if (btcWallet == null) return

    const rootState: FakeState = { ...fakeRootState, core: { account } }
    const params: SendScene2Params = {
      lockTilesMap: { address: true },
      walletId: btcWallet.id,
      spendInfo: {
        spendTargets: [
          { publicAddress: 'some pub address', nativeAmount: '1234' },
          { publicAddress: 'some pub address 2', nativeAmount: '12345' }
        ]
      },
      doCheckAndShowGetCryptoModal: false
    }

    // Lock Address
    const renderer = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <SendScene2 {...fakeSceneProps('send2', params)} />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()

    // Lock Amount
    params.lockTilesMap = { amount: true }
    const renderer2 = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <SendScene2 {...fakeSceneProps('send2', params)} />
      </FakeProviders>
    )
    expect(renderer2.toJSON()).toMatchSnapshot()

    // Lock Both
    params.lockTilesMap = { amount: true, address: true }
    const renderer3 = TestRenderer.create(
      <FakeProviders initialState={rootState}>
        <SendScene2 {...fakeSceneProps('send2', params)} />
      </FakeProviders>
    )
    expect(renderer3.toJSON()).toMatchSnapshot()
  })
})

afterAll(async () => {
  await context?.close()
})
