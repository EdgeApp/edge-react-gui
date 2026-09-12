import { asBoolean, asObject, asOptional, asString, asValue } from 'cleaners'
import type { EdgeAccount, EdgeAccountTxQuery } from 'edge-core-js'

import { doc } from '../doc'
import { engineError } from '../errors'
import { route } from '../route'
import { asCoreValue, asQueryDate, asQueryInteger } from '../schemas'
import { getAccount } from './helpers'

type EdgeAccountTxSortField = NonNullable<EdgeAccountTxQuery['sort']>['field']

/**
 * A query string carries one value per key, so list filters arrive as comma
 * separated text rather than repeated keys.
 */
const asCommaList = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(item => String(item))
  if (typeof raw !== 'string') throw new TypeError('Expected a comma list')
  return raw
    .split(',')
    .map(part => part.trim())
    .filter(part => part !== '')
}

/** `tokenId` filters accept the literal `null` for a chain's own asset. */
const asTokenIdList = (raw: unknown): Array<string | null> =>
  asCommaList(raw).map(part => (part === 'null' ? null : part))

const asQueryNumber = (raw: unknown): number => {
  if (typeof raw === 'number') return raw
  if (typeof raw !== 'string' || raw === '') {
    throw new TypeError('Expected a number')
  }
  const n = Number(raw)
  if (!Number.isFinite(n)) throw new TypeError('Expected a number')
  return n
}

/** Reads the account-wide store, or explains why it is not there. */
function getStore(
  account: EdgeAccount
): NonNullable<EdgeAccount['transactions']> {
  const store = account.transactions
  if (store == null) {
    throw engineError(
      'TRANSACTION_DATABASE_OFF',
      'The transaction database is not running. Start the engine with the transactionDatabase option.',
      409
    )
  }
  return store
}

function buildQuery(valid: {
  walletIds?: string[]
  pluginIds?: string[]
  currencyCodes?: string[]
  tokenIds?: Array<string | null>
  txids?: string[]
  direction?: string
  startDate?: Date
  endDate?: Date
  minAmount?: number
  maxAmount?: number
  hasMetadata?: boolean
  includeOrphans?: boolean
  sort?: string
  sortDirection?: string
  limit?: number
  offset?: number
}): EdgeAccountTxQuery {
  const sortField = valid.sort as EdgeAccountTxSortField | undefined
  const sortDirection = valid.sortDirection as 'asc' | 'desc' | undefined

  return {
    walletIds: valid.walletIds,
    pluginIds: valid.pluginIds,
    currencyCodes: valid.currencyCodes,
    tokenIds: valid.tokenIds,
    txids: valid.txids,
    direction: valid.direction as 'send' | 'receive' | undefined,
    afterDate: valid.startDate,
    beforeDate: valid.endDate,
    minCryptoExchangeAmount: valid.minAmount,
    maxCryptoExchangeAmount: valid.maxAmount,
    hasMetadata: valid.hasMetadata,
    includeOrphans: valid.includeOrphans,
    sort:
      sortField == null && sortDirection == null
        ? undefined
        : { field: sortField ?? 'date', direction: sortDirection ?? 'desc' },
    limit: valid.limit,
    offset: valid.offset
  }
}

const FILTER_QUERY = {
  walletIds: asOptional(
    doc(asCommaList, 'Repeatable. Defaults to every wallet.')
  ),
  pluginIds: asOptional(
    doc(
      asCommaList,
      'Repeatable, such as `--plugin-id=bitcoin --plugin-id=ethereum`.'
    )
  ),
  currencyCodes: asOptional(
    doc(
      asCommaList,
      'Repeatable, such as `--currency-code=BTC --currency-code=USDC`.'
    )
  ),
  tokenIds: asOptional(
    doc(asTokenIdList, 'Repeatable. Use `null` for the chain asset.')
  ),
  txids: asOptional(doc(asCommaList, 'Repeatable.')),
  direction: asOptional(
    doc(asValue('send', 'receive'), 'Which way funds moved.')
  ),
  startDate: asOptional(doc(asQueryDate, 'ISO-8601, or epoch milliseconds.')),
  endDate: asOptional(doc(asQueryDate, 'ISO-8601, or epoch milliseconds.')),
  minAmount: asOptional(
    doc(
      asQueryNumber,
      'Crypto amount in the exchange denomination (1.5, not 150000000), compared absolutely.'
    )
  ),
  maxAmount: asOptional(
    doc(asQueryNumber, 'Upper bound, same units as minAmount.')
  ),
  hasMetadata: asOptional(
    doc(
      asBoolean,
      'Only transactions that do, or do not, carry saved metadata.'
    )
  ),
  includeOrphans: asOptional(
    doc(
      asBoolean,
      'Include transactions whose chain data a resync removed but whose metadata survives.'
    )
  )
}

/**
 * Query transactions across every wallet in the account at once.
 *
 * Unlike `get-transactions`, this reads the account-wide transaction database
 * rather than one wallet's history, so a single call spans every plugin. It
 * requires the engine to be running with the transaction database enabled.
 *
 * @note Results are one row per asset a transaction touched, so a swap that
 *   moved two assets appears twice, once per asset.
 * @note `minAmount` / `maxAmount` are exchange-denomination amounts, never
 *   native units, because native units are not comparable across chains.
 * @returns `{ transactions, cursor }`. `cursor` is absent once the result set
 *   is exhausted; pass it back as `after` to read the next page.
 */
export const queryAccountTransactions = route({
  core: 'account.transactions.queryTransactions',
  method: 'GET',
  path: '/account/{sessionId}/transactions',
  cli: {
    command: 'query-transactions',
    flags: {
      walletId: { maps: 'walletIds', repeat: true },
      pluginId: { maps: 'pluginIds', repeat: true },
      currencyCode: { maps: 'currencyCodes', repeat: true },
      tokenId: { maps: 'tokenIds', repeat: true },
      txid: { maps: 'txids', repeat: true }
    }
  },
  query: asObject({
    ...FILTER_QUERY,
    sort: asOptional(
      doc(
        asValue('date', 'cryptoExchangeAmount', 'blockHeight'),
        'Defaults to date.'
      )
    ),
    sortDirection: asOptional(
      doc(asValue('asc', 'desc'), 'Defaults to desc, newest first.')
    ),
    limit: asOptional(doc(asQueryInteger, 'Defaults to 50, capped at 500.')),
    offset: asOptional(doc(asQueryInteger, 'Prefer `after` for deep paging.')),
    after: asOptional(
      doc(
        asString,
        'Cursor from a previous page, as `effectiveDate:txid:tokenId`. Only valid with the date sort.'
      )
    )
  }).withRest,
  returns: doc(asCoreValue, '`{ transactions, cursor }`'),
  errors: ['BAD_REQUEST', 'TRANSACTION_DATABASE_OFF'],

  async handler(ctx) {
    const account = getAccount(ctx)
    const store = getStore(account)
    const query = buildQuery(ctx.query.valid)

    const { after } = ctx.query.valid
    if (after != null && after !== '') {
      const parts = after.split(':')
      if (parts.length < 2) {
        throw engineError(
          'BAD_REQUEST',
          'Query "after" must look like effectiveDate:txid:tokenId',
          400
        )
      }
      query.after = {
        effectiveDate: Number(parts[0]),
        txid: parts[1],
        tokenId: parts.slice(2).join(':')
      }
    }

    const page = await store.queryTransactions(query)
    return {
      transactions: page.transactions,
      cursor:
        page.cursor == null
          ? undefined
          : `${page.cursor.effectiveDate}:${page.cursor.txid}:${page.cursor.tokenId}`
    }
  }
})

/**
 * Count and summarize transactions across every wallet.
 *
 * Computed in SQL over the matching set, so it does not page through results.
 * Takes the same filters as `query-transactions`.
 *
 * @returns `{ count, walletCount, orphanCount, earliestDate, latestDate }`.
 */
export const summarizeAccountTransactions = route({
  core: 'account.transactions.summarize',
  method: 'GET',
  path: '/account/{sessionId}/transactions/summary',
  cli: {
    command: 'summarize-transactions',
    flags: {
      walletId: { maps: 'walletIds', repeat: true },
      pluginId: { maps: 'pluginIds', repeat: true },
      currencyCode: { maps: 'currencyCodes', repeat: true },
      tokenId: { maps: 'tokenIds', repeat: true },
      txid: { maps: 'txids', repeat: true }
    }
  },
  query: asObject({ ...FILTER_QUERY }).withRest,
  returns: doc(asCoreValue, 'Counts and the date range of the matching set.'),
  errors: ['BAD_REQUEST', 'TRANSACTION_DATABASE_OFF'],

  async handler(ctx) {
    const account = getAccount(ctx)
    const store = getStore(account)
    return await store.summarize(buildQuery(ctx.query.valid))
  }
})
