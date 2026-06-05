import type { EdgeAccount, EdgeWalletInfoFull } from 'edge-core-js'

import { hasBitcoinDepotWallets } from '../../util/bitcoinDepotUtils'

const makeWalletInfo = (
  appIds: string[],
  deleted: boolean = false
): EdgeWalletInfoFull => ({
  id: 'wallet-id',
  type: 'wallet:bitcoin',
  keys: {},
  appIds,
  archived: false,
  deleted,
  hidden: false,
  sortIndex: 0
})

const makeAccount = (allKeys: EdgeWalletInfoFull[]): EdgeAccount =>
  // Partial mock; only `allKeys` is examined by the detection helper.
  ({ allKeys } as unknown as EdgeAccount)

describe('hasBitcoinDepotWallets', () => {
  it('detects a wallet created under a BitcoinDepot appId', () => {
    const account = makeAccount([
      makeWalletInfo(['']),
      makeWalletInfo(['com.bitcoindepot.wallet'])
    ])
    expect(hasBitcoinDepotWallets(account)).toBe(true)
  })

  it('matches appIds case-insensitively', () => {
    const account = makeAccount([makeWalletInfo(['com.BitcoinDepot.wallet'])])
    expect(hasBitcoinDepotWallets(account)).toBe(true)
  })

  it('ignores deleted wallets', () => {
    const account = makeAccount([
      makeWalletInfo(['com.bitcoindepot.wallet'], true)
    ])
    expect(hasBitcoinDepotWallets(account)).toBe(false)
  })

  it('returns false for ordinary Edge wallets', () => {
    const account = makeAccount([
      makeWalletInfo(['']),
      makeWalletInfo(['app.coinhubatm.wallet'])
    ])
    expect(hasBitcoinDepotWallets(account)).toBe(false)
  })

  it('returns false for an account with no wallets', () => {
    const account = makeAccount([])
    expect(hasBitcoinDepotWallets(account)).toBe(false)
  })
})
