import { describe, expect, it } from '@jest/globals'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

import { getSignerSeed } from '../../plugins/stake-plugins/util/signer'

const privateKey = '1234567890abcdef'.repeat(4)

const makeAccount = (keys: object): EdgeAccount =>
  ({ getRawPrivateKey: async () => keys } as unknown as EdgeAccount)

const wallet = {
  id: 'wallet-id',
  currencyInfo: { pluginId: 'fantom' }
} as unknown as EdgeCurrencyWallet

describe('getSignerSeed', () => {
  it('returns the hex key stored under the plugin name', async () => {
    const account = makeAccount({
      fantomKey: privateKey,
      fantomMnemonic: 'seed words'
    })

    expect(await getSignerSeed(account, wallet)).toBe(privateKey)
  })

  it('finds the key of a wallet split from another EVM chain', async () => {
    // The core renames `ethereumKey` to `fantomKey` on split but leaves the
    // mnemonic under the source chain's name:
    const account = makeAccount({
      fantomKey: privateKey,
      ethereumMnemonic: 'seed words'
    })

    expect(await getSignerSeed(account, wallet)).toBe(privateKey)
  })

  it('throws when nothing is stored under the plugin name', async () => {
    const account = makeAccount({ ethereumKey: privateKey })

    await expect(getSignerSeed(account, wallet)).rejects.toThrow(
      'Missing private key for fantom wallet'
    )
  })
})
