import { f, opt, s } from '../schema'
import { endpoint, group } from '../types'
import { sessionId, walletId } from './common'

export const transactionsGroup = group({
  id: 'transactions',
  title: 'Transactions',
  doc: 'Reading transaction history, exporting it, and editing its metadata.',
  endpoints: [
    endpoint({
      id: 'getTransactions',
      coreCall: 'wallet.getTransactions',
      summary: 'List or export transactions',
      description:
        'Reads history, fills in the same display metadata and historical fiat the GUI shows, and optionally formats the result as CSV, QBO, or Bitwave. All of that happens on this one GET.',
      method: 'GET',
      path: '/account/{sessionId}/wallets/{walletId}/get-transactions',
      source: 'src/cli/engine/routes/transactions.ts',
      cli: [
        {
          command: 'get-transactions',
          usage:
            'get-transactions <walletId> [--token-id=<id>] [--limit=<n>] [--offset=<n>] [--start-date=<ISO>] [--end-date=<ISO>] [--search-string=<text>] [--fiat=<CODE>] [--export-format=csv,qbo,bitwave] [--out=<path>] [--bitwave-account=<id>]',
          flags: [
            { flag: '--token-id=<id>', maps: 'tokenId', target: 'query' },
            { flag: '--limit=<n>', maps: 'limit', target: 'query' },
            { flag: '--offset=<n>', maps: 'offset', target: 'query' },
            {
              flag: '--start-date=<ISO>',
              maps: 'startDate',
              target: 'query',
              doc: 'Use the `=` form so a timezone offset is not parsed as a new argument.'
            },
            { flag: '--end-date=<ISO>', maps: 'endDate', target: 'query' },
            {
              flag: '--search-string=<text>',
              maps: 'searchString',
              target: 'query'
            },
            { flag: '--fiat=<CODE>', maps: 'fiat', target: 'query' },
            {
              flag: '--export-format=<list>',
              maps: 'exportFormat',
              target: 'query'
            },
            {
              flag: '--bitwave-account=<id>',
              maps: 'bitwaveAccountId',
              target: 'query'
            },
            {
              flag: '--out=<path>',
              maps: '—',
              target: 'client',
              doc: 'Client-side only: where to write the returned files.'
            }
          ],
          example: 'edge-cli get-transactions abc123 --limit=20 --fiat=USD',
          notes:
            '`--out` is required with `--export-format` and is a usage error without it. One format writes that path; several treat it as a stem and append `.csv` / `.qbo` / `.bitwave.csv`. Paths resolve from the current directory.'
        }
      ],
      pathParams: [sessionId, walletId],
      query: [
        { name: 'tokenId', schema: s.string(), default: 'null (native)' },
        {
          name: 'limit',
          schema: s.int(),
          default: 'unlimited',
          doc: 'Omitting it returns **every** transaction from `offset` onward.'
        },
        { name: 'offset', schema: s.int(), default: '0' },
        {
          name: 'startDate',
          schema: s.date(),
          doc: 'ISO-8601, or epoch milliseconds.'
        },
        { name: 'endDate', schema: s.date() },
        {
          name: 'searchString',
          schema: s.string(),
          doc: 'Matches payee, category, notes, and txid.'
        },
        {
          name: 'spamThreshold',
          schema: s.amount(),
          default: 'the account’s local-settings setting',
          doc: 'Native-amount floor. Omitted, the engine applies the GUI “Hide spam transactions” setting (`spamFilterOn`, default `true`) with a threshold near $0.001. Passing it always overrides. Filters rows only; metadata is untouched.'
        },
        {
          name: 'fiat',
          schema: s.string({ example: 'USD' }),
          default: 'the account’s defaultIsoFiat',
          doc: 'Three-letter ISO 4217 code. Fills `metadata.exchangeAmount` from the rates server at each transaction’s date.'
        },
        {
          name: 'exportFormat',
          schema: s.string({ example: 'csv,qbo' }),
          doc: 'Comma list of `csv`, `qbo`, `bitwave`. Switches the response to the file shape. Unknown values are `400`.'
        },
        {
          name: 'bitwaveAccountId',
          schema: s.string(),
          doc: 'Bitwave account id. A `400` unless `exportFormat` includes `bitwave`.'
        }
      ],
      success: {
        status: 200,
        schema: s.union(
          s.object([
            f('transactions', s.array(s.core('EdgeTransaction'))),
            f('total', s.int(42), 'Total **before** `limit` and `offset`.'),
            f('isoFiat', s.string({ example: 'iso:USD' }))
          ]),
          s.object([
            f('ok', s.boolean()),
            f('isoFiat', s.string({ example: 'iso:USD' })),
            f('total', s.int()),
            f(
              'files',
              s.array(
                s.object([
                  f('format', s.string({ enum: ['csv', 'qbo', 'bitwave'] })),
                  f('contents', s.string(), 'The whole file as a string.')
                ])
              )
            )
          ])
        ),
        doc: 'The first shape without `exportFormat`, the second with it. The two are mutually exclusive — an export response carries no `transactions` array.'
      },
      errors: [
        'BAD_REQUEST',
        'MISSING_BITWAVE_ACCOUNT_ID',
        'WALLET_NOT_FOUND',
        'AMBIGUOUS_WALLET_ID'
      ],
      notes: [
        '`metadata.name`, `.category`, and `.notes` are overlaid using the GUI’s merge: non-empty values on disk win, otherwise computed defaults such as `Expense:` or a localized “Sent Bitcoin”. The overlay is **response-only** — it never calls `saveTxMetadata`.',
        'Historical fiat is written onto `metadata.exchangeAmount[isoFiat]`, skipping keys already non-zero, and is likewise response-only.',
        '`limit` and `offset` are applied **before** the metadata overlay and fiat fill, so a large page costs proportionally more rates-server work.',
        'Bitwave export is the one GET in the API that can **write**: passing `bitwaveAccountId` persists it to `exportTxInfo.json` on the wallet disklet with `isExportBitwave: true`. Omit it and the saved id is used; if none is saved you get `400 MISSING_BITWAVE_ACCOUNT_ID`. It never falls back to the Edge wallet id.'
      ]
    }),

    endpoint({
      id: 'getNumTransactions',
      coreCall: 'wallet.getNumTransactions',
      summary: 'Count transactions',
      description: 'Cheaper than listing when you only need the total.',
      method: 'GET',
      path: '/account/{sessionId}/wallets/{walletId}/get-num-transactions',
      source: 'src/cli/engine/routes/transactions.ts',
      cli: [
        {
          command: 'get-num-transactions',
          usage: 'get-num-transactions <walletId> [--token-id=<id>]',
          flags: [
            {
              flag: '--token-id=<id>',
              maps: 'tokenId',
              target: 'query'
            }
          ],
          example: 'edge-cli get-num-transactions abc123'
        }
      ],
      pathParams: [sessionId, walletId],
      query: [
        { name: 'tokenId', schema: s.string(), default: 'null (native)' }
      ],
      success: {
        status: 200,
        schema: s.object([f('numTransactions', s.int(42))])
      },
      errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],
      notes: [
        'Unfiltered: `spamThreshold`, dates, and `searchString` do not apply, so this can exceed `total` from `get-transactions`.'
      ]
    }),

    endpoint({
      id: 'saveTxMetadata',
      summary: 'Save transaction metadata',
      description:
        'One of only two routes that write transaction metadata to disk.',
      coreCall: 'wallet.saveTxMetadata',
      method: 'POST',
      path: '/account/{sessionId}/wallets/{walletId}/save-tx-metadata',
      source: 'src/cli/engine/routes/transactions.ts',
      cli: [
        {
          command: 'save-tx-metadata',
          usage:
            "save-tx-metadata <walletId> --txid=<txid> --metadata='<json>' [--token-id=<id>]",
          flags: [
            {
              flag: '--txid=<txid>',
              maps: 'txid',
              target: 'body'
            },
            {
              flag: "--metadata='<json>'",
              maps: 'metadata',
              target: 'body'
            },
            {
              flag: '--token-id=<id>',
              maps: 'tokenId',
              target: 'body'
            }
          ],
          example:
            'edge-cli save-tx-metadata abc123 --txid=deadbeef --metadata=\'{"name":"Coffee"}\''
        }
      ],
      pathParams: [sessionId, walletId],
      body: s.object([
        f('txid', s.string()),
        opt('tokenId', s.tokenId()),
        f(
          'metadata',
          s.core(
            'EdgeMetadataChange',
            'name, category, notes, exchangeAmount, …'
          )
        )
      ]),
      bodyDoc: 'Fields match `EdgeSaveTxMetadataOptions`.',
      success: { status: 204 },
      errors: ['BAD_REQUEST', 'WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],
      notes: [
        '`metadata` is an `EdgeMetadataChange`, so an explicit `null` on a field clears it while an omitted field is left alone.'
      ]
    }),

    endpoint({
      id: 'saveTxAction',
      summary: 'Save a transaction action',
      coreCall: 'wallet.saveTxAction',
      method: 'POST',
      path: '/account/{sessionId}/wallets/{walletId}/save-tx-action',
      source: 'src/cli/engine/routes/transactions.ts',
      cli: [
        {
          command: 'save-tx-action',
          usage:
            "save-tx-action <walletId> --txid=<txid> --saved-action='<json>' [--asset-action='<json>'] [--token-id=<id>]",
          flags: [
            {
              flag: '--txid=<txid>',
              maps: 'txid',
              target: 'body'
            },
            {
              flag: "--saved-action='<json>'",
              maps: 'savedAction',
              target: 'body'
            },
            {
              flag: "--asset-action='<json>'",
              maps: 'assetAction',
              target: 'body'
            },
            {
              flag: '--token-id=<id>',
              maps: 'tokenId',
              target: 'body'
            }
          ],
          example:
            'edge-cli save-tx-action abc123 --txid=deadbeef --saved-action=\'{"actionType":"swap"}\''
        }
      ],
      pathParams: [sessionId, walletId],
      body: s.object([
        f('txid', s.string()),
        opt('tokenId', s.tokenId()),
        f('savedAction', s.core('EdgeTxAction')),
        opt('assetAction', s.core('EdgeAssetAction'))
      ]),
      bodyDoc: 'Fields match `EdgeSaveTxActionOptions`.',
      success: { status: 204 },
      errors: ['BAD_REQUEST', 'WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],
      notes: [
        'When `assetAction` is omitted it defaults to `{ assetActionType: "transfer" }`.'
      ]
    })
  ]
})
