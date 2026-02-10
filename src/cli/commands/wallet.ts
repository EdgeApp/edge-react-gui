import type {
  EdgeCurrencyWallet,
  EdgeSpendInfo,
  EdgeWalletStates
} from 'edge-core-js'

import { command, UsageError } from '../command'
import { requireAccount, type Session } from '../util/session'

// ============================================================================
// Utility functions
// ============================================================================

/** Normalize the string "null" (from CLI argv) to actual null. */
function parseTokenId(arg: string | undefined): string | null {
  if (arg == null || arg === 'null') return null
  return arg
}

/**
 * Get the exchange denomination multiplier for a wallet's native currency or token.
 */
function getMultiplier(
  wallet: EdgeCurrencyWallet,
  tokenId: string | null
): string {
  if (tokenId == null) {
    // Native currency - use first denomination (exchange denomination)
    const denom = wallet.currencyInfo.denominations[0]
    return denom?.multiplier ?? '1'
  } else {
    // Token - look up in currencyConfig
    const token = wallet.currencyConfig.allTokens[tokenId]
    if (token == null) {
      throw new Error(`Unknown token: ${tokenId}`)
    }
    const denom = token.denominations[0]
    return denom?.multiplier ?? '1'
  }
}

/**
 * Get the currency code for a wallet's native currency or token.
 */
function getCurrencyCode(
  wallet: EdgeCurrencyWallet,
  tokenId: string | null
): string {
  if (tokenId == null) {
    return wallet.currencyInfo.currencyCode
  } else {
    const token = wallet.currencyConfig.allTokens[tokenId]
    if (token == null) {
      throw new Error(`Unknown token: ${tokenId}`)
    }
    return token.currencyCode
  }
}

/**
 * Convert exchange amount (e.g., "0.001" BTC) to native amount (e.g., "100000" satoshis).
 */
function exchangeToNative(exchangeAmount: string, multiplier: string): string {
  const exchange = parseFloat(exchangeAmount)
  const mult = parseFloat(multiplier)
  return Math.round(exchange * mult).toString()
}

/**
 * Convert native amount to exchange amount.
 */
function nativeToExchange(nativeAmount: string, multiplier: string): string {
  const native = parseFloat(nativeAmount)
  const mult = parseFloat(multiplier)
  return (native / mult).toString()
}

/**
 * Find a wallet by ID (supports partial matching).
 */
function findWallet(
  session: Session,
  walletIdPrefix: string
): EdgeCurrencyWallet {
  const account = requireAccount(session)
  const walletIds = Object.keys(account.currencyWallets)

  // Try exact match first
  if (account.currencyWallets[walletIdPrefix] != null) {
    return account.currencyWallets[walletIdPrefix]
  }

  // Try partial match
  const matches = walletIds.filter(id => id.startsWith(walletIdPrefix))
  if (matches.length === 0) {
    throw new Error(`No wallet found matching: ${walletIdPrefix}`)
  }
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous wallet ID "${walletIdPrefix}" matches: ${matches.join(', ')}`
    )
  }

  return account.currencyWallets[matches[0]]
}

// ============================================================================
// Phase 1 Commands
// ============================================================================

command(
  'wallet-create',
  {
    usage: '<walletType> [<name>]',
    help: 'Create a new currency wallet (e.g., wallet:bitcoin)',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length < 1 || argv.length > 2) throw new UsageError(this)
    const account = requireAccount(session)

    const walletType = argv[0]
    const name = argv[1]

    const wallet = await account.createCurrencyWallet(walletType, {
      name
    })

    console.log({
      walletId: wallet.id,
      type: wallet.type,
      name: wallet.name,
      currencyCode: wallet.currencyInfo.currencyCode
    })
  }
)

command(
  'wallet-list',
  {
    help: 'Lists the currency wallets in an account',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 0) throw new UsageError(this)

    const account = requireAccount(session)

    // Wait for wallets to load
    await account.waitForAllWallets()

    const wallets = []
    for (const walletId of account.activeWalletIds) {
      const wallet = account.currencyWallets[walletId]
      if (wallet == null) continue

      wallets.push({
        id: walletId,
        name: wallet.name ?? '(unnamed)',
        type: wallet.type,
        currencyCode: wallet.currencyInfo.currencyCode,
        syncRatio: `${Math.round(wallet.syncRatio * 100)}%`
      })
    }

    if (wallets.length === 0) {
      console.log('No wallets found. Use wallet-create to create one.')
    } else {
      console.log(wallets)
    }
  }
)

command(
  'wallet-info',
  {
    usage: '<walletId>',
    help: 'Get detailed info about a specific wallet',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)

    await account.waitForAllWallets()
    const wallet = findWallet(session, argv[0])

    console.log({
      id: wallet.id,
      name: wallet.name,
      type: wallet.type,
      currencyCode: wallet.currencyInfo.currencyCode,
      pluginId: wallet.currencyInfo.pluginId,
      created: wallet.created?.toISOString(),
      blockHeight: wallet.blockHeight,
      syncRatio: `${Math.round(wallet.syncRatio * 100)}%`,
      paused: wallet.paused,
      fiatCurrencyCode: wallet.fiatCurrencyCode,
      enabledTokenIds: wallet.enabledTokenIds
    })
  }
)

command(
  'balance',
  {
    usage: '<walletId> [<tokenId>]',
    help: 'Get wallet balance in native and exchange denomination',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length < 1 || argv.length > 2) throw new UsageError(this)
    const account = requireAccount(session)

    await account.waitForAllWallets()
    const wallet = findWallet(session, argv[0])
    const tokenId = parseTokenId(argv[1])

    const nativeBalance = wallet.balanceMap.get(tokenId) ?? '0'
    const multiplier = getMultiplier(wallet, tokenId)
    const exchangeBalance = nativeToExchange(nativeBalance, multiplier)
    const currencyCode = getCurrencyCode(wallet, tokenId)

    console.log({
      walletId: wallet.id,
      tokenId,
      currencyCode,
      nativeBalance,
      exchangeBalance,
      exchangeDenomination: `${exchangeBalance} ${currencyCode}`
    })
  }
)

command(
  'address',
  {
    usage: '<walletId>',
    help: 'Get receive address for a wallet',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)

    await account.waitForAllWallets()
    const wallet = findWallet(session, argv[0])

    const addresses = await wallet.getAddresses({ tokenId: null })

    if (addresses.length === 0) {
      console.log('No addresses available')
    } else {
      // Format addresses by type
      const result: Record<string, string> = {
        walletId: wallet.id
      }
      for (const addr of addresses) {
        result[addr.addressType] = addr.publicAddress
      }
      console.log(result)
    }
  }
)

command(
  'tx-list',
  {
    usage:
      '<walletId> [<tokenId>] [<limit>] [<startDate>] [<endDate>] [<search>]',
    help: 'List transactions for a wallet',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length < 1 || argv.length > 6) throw new UsageError(this)
    const account = requireAccount(session)

    await account.waitForAllWallets()
    const wallet = findWallet(session, argv[0])
    const tokenId = parseTokenId(argv[1])
    const limit = argv[2] != null ? parseInt(argv[2], 10) : 10
    const startDate = argv[3] != null ? new Date(argv[3]) : undefined
    const endDate = argv[4] != null ? new Date(argv[4]) : undefined
    const searchString = argv[5]

    const transactions = await wallet.getTransactions({
      tokenId,
      startDate,
      endDate,
      searchString
    })

    const multiplier = getMultiplier(wallet, tokenId)
    const currencyCode = getCurrencyCode(wallet, tokenId)

    // Limit and format transactions
    const formatted = transactions.slice(0, limit).map(tx => ({
      txid: tx.txid,
      date: tx.date != null ? new Date(tx.date * 1000).toISOString() : null,
      nativeAmount: tx.nativeAmount,
      exchangeAmount: `${nativeToExchange(
        tx.nativeAmount,
        multiplier
      )} ${currencyCode}`,
      confirmations: tx.confirmations,
      blockHeight: tx.blockHeight
    }))

    if (formatted.length === 0) {
      console.log('No transactions found')
    } else {
      console.log({
        walletId: wallet.id,
        tokenId,
        count: transactions.length,
        showing: formatted.length,
        transactions: formatted
      })
    }
  }
)

command(
  'spend',
  {
    usage: '<walletId> <address> <amount> [<tokenId>] [dry-run]',
    help: 'Send funds to an address (amount in exchange denomination, e.g., 0.001 BTC)',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length < 3 || argv.length > 5) throw new UsageError(this)
    const account = requireAccount(session)

    const [walletIdPrefix, address, exchangeAmount] = argv
    const remaining = argv.slice(3)
    const dryRun = remaining.includes('dry-run')
    const tokenId = parseTokenId(remaining.find(a => a !== 'dry-run'))

    await account.waitForAllWallets()
    const wallet = findWallet(session, walletIdPrefix)

    const multiplier = getMultiplier(wallet, tokenId)
    const nativeAmount = exchangeToNative(exchangeAmount, multiplier)
    const currencyCode = getCurrencyCode(wallet, tokenId)

    const spendInfo: EdgeSpendInfo = {
      tokenId,
      spendTargets: [
        {
          publicAddress: address,
          nativeAmount
        }
      ]
    }

    // Create the transaction
    const tx = await wallet.makeSpend(spendInfo)

    console.log({
      action: dryRun ? 'DRY RUN - not broadcast' : 'Preparing transaction',
      walletId: wallet.id,
      tokenId,
      to: address,
      amount: `${exchangeAmount} ${currencyCode}`,
      nativeAmount,
      networkFee: tx.networkFee,
      networkFeeExchange: `${nativeToExchange(
        tx.networkFee,
        getMultiplier(wallet, null)
      )} ${wallet.currencyInfo.currencyCode}`
    })

    if (dryRun) {
      return
    }

    // Sign and broadcast
    const signedTx = await wallet.signTx(tx)
    const broadcastTx = await wallet.broadcastTx(signedTx)
    await wallet.saveTx(broadcastTx)

    console.log({
      status: 'SUCCESS',
      txid: broadcastTx.txid
    })
  }
)

// ============================================================================
// Phase 2 Commands
// ============================================================================

command(
  'wallet-rename',
  {
    usage: '<walletId> <newName>',
    help: 'Rename a wallet',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 2) throw new UsageError(this)
    const account = requireAccount(session)

    await account.waitForAllWallets()
    const wallet = findWallet(session, argv[0])
    const newName = argv[1]

    await wallet.renameWallet(newName)

    console.log({
      walletId: wallet.id,
      name: newName,
      status: 'Wallet renamed successfully'
    })
  }
)

command(
  'wallet-archive',
  {
    usage: '<walletId>',
    help: 'Archive a wallet (hide from active list)',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)

    await account.waitForAllWallets()
    const wallet = findWallet(session, argv[0])

    const opts: EdgeWalletStates = {}
    opts[wallet.id] = { archived: true }
    await account.changeWalletStates(opts)

    console.log({
      walletId: wallet.id,
      status: 'Wallet archived'
    })
  }
)

command(
  'wallet-unarchive',
  {
    usage: '<walletId>',
    help: 'Unarchive a wallet (restore to active list)',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)

    // Need to find wallet by ID directly since it may be archived
    const walletId = argv[0]

    const opts: EdgeWalletStates = {}
    opts[walletId] = { archived: false }
    await account.changeWalletStates(opts)

    console.log({
      walletId,
      status: 'Wallet unarchived'
    })
  }
)

command(
  'max-spendable',
  {
    usage: '<walletId> <address> [<tokenId>]',
    help: 'Calculate maximum spendable amount',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length < 2 || argv.length > 3) throw new UsageError(this)
    const account = requireAccount(session)

    await account.waitForAllWallets()
    const wallet = findWallet(session, argv[0])
    const address = argv[1]
    const tokenId = parseTokenId(argv[2])

    const maxNative = await wallet.getMaxSpendable({
      tokenId,
      spendTargets: [{ publicAddress: address }]
    })

    const multiplier = getMultiplier(wallet, tokenId)
    const maxExchange = nativeToExchange(maxNative, multiplier)
    const currencyCode = getCurrencyCode(wallet, tokenId)

    console.log({
      walletId: wallet.id,
      tokenId,
      currencyCode,
      maxNativeAmount: maxNative,
      maxExchangeAmount: maxExchange,
      formatted: `${maxExchange} ${currencyCode}`
    })
  }
)

command(
  'spend-max',
  {
    usage: '<walletId> <address> [<tokenId>] [dry-run]',
    help: 'Send maximum available balance to an address',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length < 2 || argv.length > 4) throw new UsageError(this)
    const account = requireAccount(session)

    const [walletIdPrefix, address] = argv
    const remaining = argv.slice(2)
    const dryRun = remaining.includes('dry-run')
    const tokenId = parseTokenId(remaining.find(a => a !== 'dry-run'))

    await account.waitForAllWallets()
    const wallet = findWallet(session, walletIdPrefix)

    // Get max spendable amount
    const maxNative = await wallet.getMaxSpendable({
      tokenId,
      spendTargets: [{ publicAddress: address }]
    })

    if (maxNative === '0') {
      console.log('No funds available to spend')
      return
    }

    const multiplier = getMultiplier(wallet, tokenId)
    const maxExchange = nativeToExchange(maxNative, multiplier)
    const currencyCode = getCurrencyCode(wallet, tokenId)

    const spendInfo: EdgeSpendInfo = {
      tokenId,
      spendTargets: [
        {
          publicAddress: address,
          nativeAmount: maxNative
        }
      ]
    }

    // Create the transaction
    const tx = await wallet.makeSpend(spendInfo)

    console.log({
      action: dryRun ? 'DRY RUN - not broadcast' : 'Preparing transaction',
      walletId: wallet.id,
      tokenId,
      to: address,
      amount: `${maxExchange} ${currencyCode}`,
      nativeAmount: maxNative,
      networkFee: tx.networkFee,
      networkFeeExchange: `${nativeToExchange(
        tx.networkFee,
        getMultiplier(wallet, null)
      )} ${wallet.currencyInfo.currencyCode}`
    })

    if (dryRun) {
      return
    }

    // Sign and broadcast
    const signedTx = await wallet.signTx(tx)
    const broadcastTx = await wallet.broadcastTx(signedTx)
    await wallet.saveTx(broadcastTx)

    console.log({
      status: 'SUCCESS',
      txid: broadcastTx.txid
    })
  }
)

command(
  'export-public',
  {
    usage: '<walletId>',
    help: 'Export public key for display (xpub, address, etc.)',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)

    await account.waitForAllWallets()
    const wallet = findWallet(session, argv[0])

    const publicKey = await account.getDisplayPublicKey(wallet.id)

    console.log({
      walletId: wallet.id,
      type: wallet.type,
      currencyCode: wallet.currencyInfo.currencyCode,
      publicKey
    })
  }
)

command(
  'export-private',
  {
    usage: '<walletId>',
    help: 'Export private key for display (WIF, seed phrase, etc.) - USE WITH CAUTION',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)

    await account.waitForAllWallets()
    const wallet = findWallet(session, argv[0])

    const privateKey = await account.getDisplayPrivateKey(wallet.id)

    console.log({
      walletId: wallet.id,
      type: wallet.type,
      currencyCode: wallet.currencyInfo.currencyCode,
      privateKey,
      warning: 'KEEP THIS SECRET - Anyone with this key can steal your funds!'
    })
  }
)

// ============================================================================
// Phase 3 Commands - Token Support
// ============================================================================

command(
  'token-list',
  {
    usage: '<walletId>',
    help: 'List available tokens for a wallet with enabled status',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)

    await account.waitForAllWallets()
    const wallet = findWallet(session, argv[0])

    const allTokens = wallet.currencyConfig.allTokens
    const enabledTokenIds = wallet.enabledTokenIds

    const tokens = Object.entries(allTokens).map(([tokenId, token]) => ({
      tokenId,
      currencyCode: token.currencyCode,
      displayName: token.displayName,
      enabled: enabledTokenIds.includes(tokenId)
    }))

    // Sort by enabled status (enabled first), then by currencyCode
    tokens.sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
      return a.currencyCode.localeCompare(b.currencyCode)
    })

    if (tokens.length === 0) {
      console.log({
        walletId: wallet.id,
        message: 'No tokens available for this wallet type'
      })
    } else {
      console.log({
        walletId: wallet.id,
        currencyCode: wallet.currencyInfo.currencyCode,
        totalTokens: tokens.length,
        enabledCount: enabledTokenIds.length,
        tokens
      })
    }
  }
)

command(
  'token-enable',
  {
    usage: '<walletId> <tokenId>',
    help: 'Enable a token on a wallet',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 2) throw new UsageError(this)
    const account = requireAccount(session)

    await account.waitForAllWallets()
    const wallet = findWallet(session, argv[0])
    const tokenId = argv[1]

    // Verify token exists
    const token = wallet.currencyConfig.allTokens[tokenId]
    if (token == null) {
      throw new Error(`Unknown token ID: ${tokenId}`)
    }

    // Check if already enabled
    if (wallet.enabledTokenIds.includes(tokenId)) {
      console.log({
        walletId: wallet.id,
        tokenId,
        currencyCode: token.currencyCode,
        status: 'Token already enabled'
      })
      return
    }

    // Enable the token
    const newEnabledTokenIds = [...wallet.enabledTokenIds, tokenId]
    await wallet.changeEnabledTokenIds(newEnabledTokenIds)

    console.log({
      walletId: wallet.id,
      tokenId,
      currencyCode: token.currencyCode,
      displayName: token.displayName,
      status: 'Token enabled successfully'
    })
  }
)

command(
  'token-disable',
  {
    usage: '<walletId> <tokenId>',
    help: 'Disable a token on a wallet',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 2) throw new UsageError(this)
    const account = requireAccount(session)

    await account.waitForAllWallets()
    const wallet = findWallet(session, argv[0])
    const tokenId = argv[1]

    // Verify token exists
    const token = wallet.currencyConfig.allTokens[tokenId]
    if (token == null) {
      throw new Error(`Unknown token ID: ${tokenId}`)
    }

    // Check if already disabled
    if (!wallet.enabledTokenIds.includes(tokenId)) {
      console.log({
        walletId: wallet.id,
        tokenId,
        currencyCode: token.currencyCode,
        status: 'Token already disabled'
      })
      return
    }

    // Disable the token
    const newEnabledTokenIds = wallet.enabledTokenIds.filter(
      id => id !== tokenId
    )
    await wallet.changeEnabledTokenIds(newEnabledTokenIds)

    console.log({
      walletId: wallet.id,
      tokenId,
      currencyCode: token.currencyCode,
      displayName: token.displayName,
      status: 'Token disabled successfully'
    })
  }
)

command(
  'token-detected',
  {
    usage: '<walletId>',
    help: 'List tokens detected on-chain but not yet enabled',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)

    await account.waitForAllWallets()
    const wallet = findWallet(session, argv[0])

    const detectedTokenIds = wallet.detectedTokenIds
    const enabledTokenIds = wallet.enabledTokenIds
    const allTokens = wallet.currencyConfig.allTokens

    // Filter to only show detected tokens that aren't enabled
    const unenabled = detectedTokenIds.filter(
      id => !enabledTokenIds.includes(id)
    )

    const tokens = unenabled.map(tokenId => {
      const token = allTokens[tokenId]
      return {
        tokenId,
        currencyCode: token?.currencyCode ?? 'Unknown',
        displayName: token?.displayName ?? 'Unknown Token'
      }
    })

    if (tokens.length === 0) {
      console.log({
        walletId: wallet.id,
        message: 'No new tokens detected on-chain'
      })
    } else {
      console.log({
        walletId: wallet.id,
        detectedCount: tokens.length,
        tokens
      })
    }
  }
)

// ============================================================================
// Existing commands (preserved)
// ============================================================================

command(
  'wallet-undelete',
  {
    help: "Removes a key's deleted flag",
    usage: '<wallet-id>',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)

    const walletId = argv[0]

    const opts: EdgeWalletStates = {}
    opts[walletId] = { deleted: false }
    await account.changeWalletStates(opts)
  }
)
