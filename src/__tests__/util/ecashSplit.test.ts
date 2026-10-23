import { describe, expect, it } from '@jest/globals'
import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeTransaction
} from 'edge-core-js'

import { getEcashSplitStatus } from '../../util/ecashSplit'

const sharedKeys = { publicKeys: { bip49: 'ypubShared', bip84: 'zpubShared' } }
const otherKeys = { publicKeys: { bip49: 'ypubOther', bip84: 'zpubOther' } }

interface FakeWalletOptions {
  keys?: object
  // The EcxProtection.json edge-core-js saved, if any:
  protection?: object
  transactions?: Array<Partial<EdgeTransaction>>
  onStreamClosed?: () => void
}

const makeWallet = (
  pluginId: string,
  opts: FakeWalletOptions = {}
): EdgeCurrencyWallet => {
  const {
    keys = sharedKeys,
    protection,
    transactions = [],
    onStreamClosed
  } = opts
  return {
    currencyInfo: { pluginId },
    disklet: {
      getText: async (path: string) => {
        if (path !== 'EcxProtection.json' || protection == null) {
          throw new Error(`Cannot load "${path}"`)
        }
        return JSON.stringify(protection)
      }
    },
    id: pluginId,
    publicWalletInfo: { id: pluginId, type: `wallet:${pluginId}`, keys },
    streamTransactions: async function* () {
      try {
        yield transactions
      } finally {
        onStreamClosed?.()
      }
    }
  } as unknown as EdgeCurrencyWallet
}

const makeAccount = (wallets: EdgeCurrencyWallet[]): EdgeAccount =>
  ({
    currencyWallets: Object.fromEntries(
      wallets.map(wallet => [wallet.id, wallet])
    )
  } as unknown as EdgeAccount)

const sent = { status: 'sent', txid: 'sweep' }

describe('getEcashSplitStatus', () => {
  const bitcoinWallet = makeWallet('bitcoin')

  it('keeps checking Bitcoin wallets without an eCash split', async () => {
    const account = makeAccount([bitcoinWallet])
    expect(await getEcashSplitStatus(account, bitcoinWallet)).toBe('clear')
  })

  it('keeps checking eCash wallets core never protected', async () => {
    const account = makeAccount([bitcoinWallet, makeWallet('ecashbitcoin')])
    expect(await getEcashSplitStatus(account, bitcoinWallet)).toBe('clear')
  })

  it('warns while the sweep has not gone out', async () => {
    // Right after a split, before the new wallet syncs its balance:
    const ecashWallet = makeWallet('ecashbitcoin', {
      protection: { status: 'pending' }
    })
    const account = makeAccount([bitcoinWallet, ecashWallet])
    expect(await getEcashSplitStatus(account, bitcoinWallet)).toBe('unsent')
  })

  it('warns while the sweep is unconfirmed', async () => {
    const ecashWallet = makeWallet('ecashbitcoinbetanet', {
      protection: sent,
      transactions: [{ txid: 'sweep', confirmations: 'unconfirmed' }]
    })
    const account = makeAccount([bitcoinWallet, ecashWallet])
    expect(await getEcashSplitStatus(account, bitcoinWallet)).toBe(
      'unconfirmed'
    )
  })

  it('finds the sweep by its txid', async () => {
    const ecashWallet = makeWallet('ecashbitcoin', {
      protection: sent,
      transactions: [{ txid: 'other', confirmations: 'confirmed' }]
    })
    const account = makeAccount([bitcoinWallet, ecashWallet])
    expect(await getEcashSplitStatus(account, bitcoinWallet)).toBe(
      'unconfirmed'
    )
  })

  it('settles once the sweep confirms', async () => {
    let isStreamClosed = false
    const ecashWallet = makeWallet('ecashbitcoin', {
      protection: sent,
      transactions: [{ txid: 'sweep', confirmations: 'confirmed' }],
      onStreamClosed: () => {
        isStreamClosed = true
      }
    })
    const account = makeAccount([bitcoinWallet, ecashWallet])
    expect(await getEcashSplitStatus(account, bitcoinWallet)).toBe('settled')
    expect(isStreamClosed).toBe(true)
  })

  it('settles wallets that had nothing to sweep', async () => {
    const ecashWallet = makeWallet('ecashbitcoin', {
      protection: { status: 'empty' }
    })
    const account = makeAccount([bitcoinWallet, ecashWallet])
    expect(await getEcashSplitStatus(account, bitcoinWallet)).toBe('settled')
  })

  it('warns about an unsent sweep ahead of an unconfirmed one', async () => {
    const ecashWallet = makeWallet('ecashbitcoin', {
      protection: sent,
      transactions: [{ txid: 'sweep', confirmations: 'unconfirmed' }]
    })
    const betanetWallet = makeWallet('ecashbitcoinbetanet', {
      protection: { status: 'pending' }
    })
    const account = makeAccount([bitcoinWallet, ecashWallet, betanetWallet])
    expect(await getEcashSplitStatus(account, bitcoinWallet)).toBe('unsent')
  })

  it('keeps checking until every eCash wallet is protected', async () => {
    const ecashWallet = makeWallet('ecashbitcoin', {
      protection: { status: 'empty' }
    })
    const betanetWallet = makeWallet('ecashbitcoinbetanet')
    const account = makeAccount([bitcoinWallet, ecashWallet, betanetWallet])
    expect(await getEcashSplitStatus(account, bitcoinWallet)).toBe('clear')
  })

  it('ignores eCash wallets from another seed', async () => {
    const ecashWallet = makeWallet('ecashbitcoin', {
      keys: otherKeys,
      protection: { status: 'pending' }
    })
    const account = makeAccount([bitcoinWallet, ecashWallet])
    expect(await getEcashSplitStatus(account, bitcoinWallet)).toBe('clear')
  })

  it('settles wallets other than Bitcoin', async () => {
    const litecoinWallet = makeWallet('litecoin')
    const ecashWallet = makeWallet('ecashbitcoin', {
      protection: { status: 'pending' }
    })
    const account = makeAccount([litecoinWallet, ecashWallet])
    expect(await getEcashSplitStatus(account, litecoinWallet)).toBe('settled')
  })
})
