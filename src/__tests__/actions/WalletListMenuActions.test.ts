import { describe, expect, it, jest } from '@jest/globals'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

import { getWalletDisplayPublicKeys } from '../../actions/WalletListMenuActions'

describe('getWalletDisplayPublicKeys', () => {
  it.each(['eos', 'telos', 'wax'])(
    'preserves singular display keys for %s',
    async pluginId => {
      const getDisplayPublicKey = jest.fn(
        async (_walletId: string) => `${pluginId}-key`
      )
      const getDisplayPublicKeys = jest.fn(async (_walletId: string) => ({
        bip44: 'unused'
      }))
      const account = {
        getDisplayPublicKey,
        getDisplayPublicKeys
      } as unknown as EdgeAccount
      const wallet = {
        id: `${pluginId}-wallet`,
        currencyInfo: { pluginId }
      } as unknown as EdgeCurrencyWallet

      await expect(
        getWalletDisplayPublicKeys(account, wallet)
      ).resolves.toEqual({ publicKey: `${pluginId}-key` })
      expect(getDisplayPublicKey).toHaveBeenCalledWith(`${pluginId}-wallet`)
      expect(getDisplayPublicKeys).not.toHaveBeenCalled()
    }
  )

  it('uses the plural API for UTXO wallets', async () => {
    const getDisplayPublicKey = jest.fn(async (_walletId: string) => 'unused')
    const getDisplayPublicKeys = jest.fn(async (_walletId: string) => ({
      bip49: 'ypub',
      bip84: 'zpub'
    }))
    const account = {
      getDisplayPublicKey,
      getDisplayPublicKeys
    } as unknown as EdgeAccount
    const wallet = {
      id: 'bitcoin-wallet',
      currencyInfo: { pluginId: 'bitcoin' }
    } as unknown as EdgeCurrencyWallet

    await expect(getWalletDisplayPublicKeys(account, wallet)).resolves.toEqual({
      bip49: 'ypub',
      bip84: 'zpub'
    })
    expect(getDisplayPublicKeys).toHaveBeenCalledWith('bitcoin-wallet')
    expect(getDisplayPublicKey).not.toHaveBeenCalled()
  })
})
