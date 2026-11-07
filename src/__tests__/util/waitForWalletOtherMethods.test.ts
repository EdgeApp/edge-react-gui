import { describe, expect, it, jest } from '@jest/globals'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import { bridgifyObject, makeLocalBridge, update, watchMethod } from 'yaob'

import { waitForWalletOtherMethods } from '../../util/waitForWalletOtherMethods'

interface FakeWallet {
  id: string
  otherMethods: object
  watch: typeof watchMethod
}

/** Sends a wallet-shaped object across a local bridge, as the core does. */
function bridgeWallet(otherMethods: object): {
  server: FakeWallet
  wallet: EdgeCurrencyWallet
} {
  const server: FakeWallet = bridgifyObject({
    id: 'wallet-id',
    otherMethods: bridgifyObject(otherMethods),
    watch: watchMethod
  })
  const wallet = makeLocalBridge(server) as unknown as EdgeCurrencyWallet
  return { server, wallet }
}

describe('waitForWalletOtherMethods', () => {
  it('resolves for methods that crossed the bridge', async () => {
    const { wallet } = bridgeWallet({ sign: async () => 'signed' })

    // The bridge hides methods from Object.keys:
    expect(Object.keys(wallet.otherMethods)).toEqual([])
    await expect(waitForWalletOtherMethods(wallet, 1000)).resolves.toBe(
      undefined
    )
  })

  it('resolves when the methods arrive later', async () => {
    const { server, wallet } = bridgeWallet({})

    const promise = waitForWalletOtherMethods(wallet, 1000)
    server.otherMethods = bridgifyObject({ sign: async () => 'signed' })
    update(server)
    // The bridge batches updates on a timer:
    await jest.advanceTimersByTimeAsync(0)
    await expect(promise).resolves.toBe(undefined)
  })

  it('times out for a wallet with no methods', async () => {
    const { wallet } = bridgeWallet({})

    const promise = waitForWalletOtherMethods(wallet, 10)
    const assertion = expect(promise).rejects.toThrow(
      'Timed out waiting for wallet wallet-id engine methods'
    )
    await jest.advanceTimersByTimeAsync(10)
    await assertion
  })
})
