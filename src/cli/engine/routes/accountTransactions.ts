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

/**
 * Amounts are the chain's smallest unit, as an integer string.
 *
 * Not a number: a 256-bit amount does not fit one, and parsing it would drop
 * digits without failing. Not an exchange-denomination figure either --
 * converting one needs the asset's denomination, which is the caller's to
 * apply and not something a cross-asset query can assume.
 */
const asNativeAmount: (raw: unknown) => string = raw => {
  if (typeof raw !== 'string' || !/^-?\d+$/.test(raw)) {
    throw new TypeError('Expected an integer amount in the smallest unit')
  }
  return raw
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
  tokenIds?: Array<string | null>
  txids?: string[]
  direction?: string
  startDate?: Date
  endDate?: Date
  minAmount?: string
  maxAmount?: string
  minFee?: string
  maxFee?: string
  minBlockHeight?: number
  maxBlockHeight?: number
  searchString?: string
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
    tokenIds: valid.tokenIds,
    txids: valid.txids,
    direction: valid.direction as 'send' | 'receive' | undefined,
    afterDate: valid.startDate,
    beforeDate: valid.endDate,
    minNativeAmount: valid.minAmount,
    maxNativeAmount: valid.maxAmount,
    minNetworkFee: valid.minFee,
    maxNetworkFee: valid.maxFee,
    minBlockHeight: valid.minBlockHeight,
    maxBlockHeight: valid.maxBlockHeight,
    searchString: valid.searchString,
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
      asNativeAmount,
      "The chain's smallest unit, as an integer string: 150000000, not 1.5."
    )
  ),
  maxAmount: asOptional(
    doc(asNativeAmount, 'Upper bound, same units as minAmount.')
  ),
  minFee: asOptional(
    doc(asNativeAmount, "This asset's network fee, same units as minAmount.")
  ),
  maxFee: asOptional(doc(asNativeAmount, 'Upper bound, same units as minFee.')),
  minBlockHeight: asOptional(
    doc(asQueryInteger, 'Inclusive. Zero matches unconfirmed transactions.')
  ),
  maxBlockHeight: asOptional(doc(asQueryInteger, 'Inclusive.')),
  searchString: asOptional(
    doc(
      asString,
      'Free text over the name, notes and category the user wrote. Matches anywhere inside a word.'
    )
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
      'Include transactions the user annotated on another device that this one has not seen.'
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
 * @note One result per transaction, whatever it touched. A swap that moved
 *   two assets is one `EdgeTx` with two entries in `nativeAmounts`, not two
 *   results.
 * @note Amount and fee filters take the chain's smallest unit as an integer
 *   string, because a 256-bit amount does not fit a number and converting
 *   from a display figure needs a denomination this query does not have.
 * @note A page can hold fewer than `limit` transactions: the limit counts
 *   index rows, and a transaction touching two assets has two. Use `cursor`
 *   to tell whether there is more, never the length of the array.
 * @returns `{ transactions, cursor }`. `cursor` is absent once the result set
 *   is exhausted; pass it back as `after` to read the next page.
 */
export const queryAccountTransactions = route({
  core: 'account.transactions.queryTxs',
  method: 'GET',
  path: '/account/{sessionId}/transactions',
  cli: {
    command: 'query-transactions',
    flags: {
      walletId: { maps: 'walletIds', repeat: true },
      pluginId: { maps: 'pluginIds', repeat: true },
      tokenId: { maps: 'tokenIds', repeat: true },
      txid: { maps: 'txids', repeat: true }
    }
  },
  query: asObject({
    ...FILTER_QUERY,
    sort: asOptional(
      doc(
        asValue('date', 'nativeAmount', 'networkFee', 'blockHeight'),
        'Defaults to date. Anything but date needs the query narrowed by a wallet, asset or date range, since no index orders the whole account by amount.'
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
        'Cursor from a previous page. Opaque: pass it back unmodified, and only with the sort that produced it.'
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
    if (after != null && after !== '') query.after = after

    /*
     * Sorting by anything but a date needs the query narrowed first.
     *
     * The core's indexes lead with a date, a wallet or an asset, so nothing
     * orders the whole account by amount without reading all of it -- and the
     * core refuses that rather than taking seconds over it. Catching it here
     * means the caller is told they asked for something impossible, rather
     * than being handed an internal error for a mistake of their own.
     */
    if (
      query.sort != null &&
      query.sort.field !== 'date' &&
      query.walletIds == null &&
      query.pluginIds == null &&
      query.tokenIds == null &&
      query.afterDate == null &&
      query.beforeDate == null
    ) {
      throw engineError(
        'BAD_REQUEST',
        `Sorting by ${query.sort.field} needs the query narrowed by a wallet, plugin, asset or date range. No index orders the whole account by it.`,
        400
      )
    }

    const page = await store.queryTxs(query)
    return { transactions: page.transactions, cursor: page.cursor }
  }
})

/**
 * Count and summarize transactions across every wallet.
 *
 * Computed over the whole matching set rather than by paging through it, so
 * it does not take a `limit`. Takes the same filters as `query-transactions`.
 *
 * @note No amount total. Summing would mean arithmetic on amounts inside the
 *   database, which it does not do -- a caller wanting one reads the
 *   transactions and adds the exact `nativeAmounts` strings with `BigInt`.
 * @returns `{ count, earliestDate, latestDate }`.
 */
export const summarizeAccountTransactions = route({
  core: 'account.transactions.queryTxs',
  method: 'GET',
  path: '/account/{sessionId}/transactions/summary',
  cli: {
    command: 'summarize-transactions',
    flags: {
      walletId: { maps: 'walletIds', repeat: true },
      pluginId: { maps: 'pluginIds', repeat: true },
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

    // One call, not two: a summary and a page answer the same predicate, and
    // `details` is what lets the core compile it once.
    const page = await store.queryTxs({
      ...buildQuery(ctx.query.valid),
      details: 'summary'
    })
    return page.summary
  }
})
