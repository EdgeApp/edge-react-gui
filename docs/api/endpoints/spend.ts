import { f, opt, s } from '../schema'
import { endpoint, group } from '../types'
import { objectId, sessionId, walletId } from './common'

const spendConvenience = [
  opt(
    'to',
    s.string({ example: 'bitcoin:bc1…?label=Coffee' }),
    'Address or BIP21 URI, run through `wallet.parseUri`.'
  ),
  opt('nativeAmount', s.amount('1000')),
  opt('amount', s.amount('1000'), 'Alias of `nativeAmount`.'),
  opt('tokenId', s.tokenId()),
  opt(
    'metadata',
    s.core('EdgeMetadata'),
    'Wins over anything parsed out of the URI.'
  )
]

export const spendGroup = group({
  id: 'spend',
  title: 'Spending',
  doc: 'Two ways to send funds. `POST …/spend` does the whole thing in one call. The staged workflow — `make-spend` → `sign-tx` → `broadcast-tx` → `save-tx` — hands back an [object handle](#object-handles) at each step so you can inspect fees before committing.\n\nEvery body here accepts either a full `spendInfo` object or the flatter convenience fields the CLI uses.',
  endpoints: [
    endpoint({
      id: 'getMaxSpendable',
      coreCall: 'wallet.getMaxSpendable',
      summary: 'Largest sendable amount',
      description:
        'The amount that empties the wallet after fees, for a “send max” button.',
      method: 'POST',
      path: '/account/{sessionId}/wallets/{walletId}/get-max-spendable',
      source: 'src/cli/engine/routes/spend.ts',
      cli: [
        {
          command: 'get-max-spendable',
          usage:
            'get-max-spendable <walletId> --to=<get-addresses> [--token-id=<id>]',
          flags: [
            { flag: '--to=<get-addresses>', maps: 'to', target: 'body' },
            { flag: '--token-id=<id>', maps: 'tokenId', target: 'body' }
          ],
          example: 'edge-cli get-max-spendable abc123 --to=bc1qexample'
        }
      ],
      pathParams: [sessionId, walletId],
      body: s.object([
        opt('spendInfo', s.core('EdgeSpendInfo')),
        ...spendConvenience
      ]),
      bodyDoc:
        'No amount needed — that is what you are asking for. A destination is still required, since fees depend on it.',
      success: {
        status: 200,
        schema: s.object([f('nativeAmount', s.amount('12345'))])
      },
      errors: [
        'INSUFFICIENT_FUNDS',
        'BAD_REQUEST',
        'WALLET_NOT_FOUND',
        'NETWORK_ERROR'
      ]
    }),

    endpoint({
      id: 'spend',
      coreCall: null,
      coreNote:
        'GUI composite: makeSpend then signTx, broadcastTx and saveTx in one call.',
      summary: 'Send funds',
      description:
        '`makeSpend` → `signTx` → optionally `broadcastTx` and `saveTx`, in one request. A completed spend leaves no handle behind.',
      method: 'POST',
      path: '/account/{sessionId}/wallets/{walletId}/spend',
      source: 'src/cli/engine/routes/spend.ts',
      cli: [
        {
          command: 'spend',
          usage:
            'spend <walletId> --to=<get-addresses> --native-amount=<amount> [--token-id=<id>] [--dry-run]',
          flags: [
            { flag: '--to=<get-addresses>', maps: 'to', target: 'body' },
            {
              flag: '--native-amount=<n>',
              maps: 'nativeAmount',
              target: 'body'
            },
            { flag: '--token-id=<id>', maps: 'tokenId', target: 'body' },
            { flag: '--dry-run', maps: 'dryRun', target: 'body' }
          ],
          example:
            'edge-cli spend abc123 --to=bc1qexample --native-amount=1000 --dry-run'
        },
        {
          command: 'spend-max',
          usage:
            'spend-max <walletId> --to=<get-addresses> [--token-id=<id>] [--dry-run]',
          summary: 'Same route with `useMax` set.',
          flags: [
            { flag: '--to=<get-addresses>', maps: 'to', target: 'body' },
            { flag: '--dry-run', maps: 'dryRun', target: 'body' }
          ],
          example: 'edge-cli spend-max abc123 --to=bc1qexample --dry-run'
        }
      ],
      pathParams: [sessionId, walletId],
      body: s.object([
        opt('spendInfo', s.core('EdgeSpendInfo')),
        ...spendConvenience,
        opt(
          'useMax',
          s.boolean(),
          'Replace the first target’s amount with `getMaxSpendable`. Default `false`.'
        ),
        opt(
          'dryRun',
          s.boolean(),
          'Build only — never signs or broadcasts. Default `false`.'
        ),
        opt('broadcast', s.boolean(), 'Default **`true`**.'),
        opt('save', s.boolean(), 'Default **`true`**.')
      ]),
      bodyDoc:
        '`broadcast` and `save` both default to `true`, so a bare body with `to` and an amount **sends real funds**. Set `dryRun` to inspect first.',
      success: {
        status: 200,
        schema: s.union(
          s.object([
            f('transaction', s.core('EdgeTransaction')),
            opt(
              'saveError',
              s.string(),
              'Present only when the broadcast succeeded but saving failed.'
            )
          ]),
          s.ref('TransactionHandle')
        ),
        doc: 'A completed spend returns `{ transaction }`. With `dryRun`, a [TransactionHandle](#schema-TransactionHandle) instead.'
      },
      errors: [
        'INSUFFICIENT_FUNDS',
        'DUST_SPEND',
        'PENDING_FUNDS',
        'SPEND_TO_SELF',
        'NO_AMOUNT_SPECIFIED',
        'BAD_REQUEST',
        'WALLET_NOT_FOUND',
        'NETWORK_ERROR'
      ],
      notes: [
        'BIP21 `label` and `message` from `to` become `metadata.name` and `.notes`. An explicit `metadata` object wins. A bare get-addresses with no URI fields and no metadata is not tagged on disk.',
        '**`saveError` is the case to handle.** Once a transaction is broadcast the money is gone, so a failure inside `saveTx` cannot throw — it would hide the txid of a real payment. The engine returns `200` with the transaction plus `saveError`. Treat that as “sent, but not recorded locally”.',
        'A `dryRun` handle expires in 5 minutes. Release it with `DELETE …/objects/{objectId}` if you abandon the spend.'
      ]
    }),

    endpoint({
      id: 'makeSpend',
      coreCall: 'wallet.makeSpend',
      summary: 'Build an unsigned transaction',
      description:
        'First step of the staged workflow. Nothing is signed and no funds move.',
      method: 'POST',
      path: '/account/{sessionId}/wallets/{walletId}/make-spend',
      source: 'src/cli/engine/routes/spend.ts',
      cli: [
        {
          command: 'make-spend',
          usage:
            "make-spend <walletId> --to=<get-addresses> --native-amount=<amount> [--token-id=<id>] | --spend-info='<json>'",
          flags: [
            { flag: '--to=<get-addresses>', maps: 'to', target: 'body' },
            {
              flag: '--native-amount=<n>',
              maps: 'nativeAmount',
              target: 'body'
            },
            { flag: "--spend-info='<json>'", maps: 'spendInfo', target: 'body' }
          ],
          example:
            'edge-cli make-spend abc123 --to=bc1qexample --native-amount=1000'
        }
      ],
      pathParams: [sessionId, walletId],
      body: s.object([
        opt('spendInfo', s.core('EdgeSpendInfo')),
        ...spendConvenience
      ]),
      bodyDoc: 'An amount is required here, unlike `get-max-spendable`.',
      success: { status: 200, schema: s.ref('TransactionHandle') },
      errors: [
        'INSUFFICIENT_FUNDS',
        'DUST_SPEND',
        'NO_AMOUNT_SPECIFIED',
        'BAD_REQUEST',
        'WALLET_NOT_FOUND'
      ],
      notes: ['Inspect `transaction.networkFee` on the result before signing.']
    }),

    endpoint({
      id: 'signTx',
      coreCall: 'wallet.signTx',
      summary: 'Sign a staged transaction',
      method: 'POST',
      path: '/account/{sessionId}/wallets/{walletId}/sign-tx',
      source: 'src/cli/engine/routes/spend.ts',
      cli: [
        {
          command: 'sign-tx',
          usage: 'sign-tx <walletId> --object-id=<objectId>',
          flags: [
            { flag: '--object-id=<id>', maps: 'objectId', target: 'body' }
          ],
          example: 'edge-cli sign-tx abc123 --object-id=tx_3fK9…'
        }
      ],
      pathParams: [sessionId, walletId],
      body: s.object([
        f('objectId', s.string({ example: 'tx_3fK9…' }), 'From `make-spend`.')
      ]),
      success: {
        status: 200,
        schema: s.ref('TransactionHandle'),
        doc: 'Same `objectId`, now signed, with `expiresAt` pushed out another 5 minutes.'
      },
      errors: [
        'OBJECT_NOT_FOUND',
        'OBJECT_EXPIRED',
        'OBJECT_KIND_MISMATCH',
        'OBJECT_WALLET_MISMATCH',
        'OBJECT_SESSION_MISMATCH',
        'BAD_REQUEST'
      ]
    }),

    endpoint({
      id: 'broadcastTx',
      coreCall: 'wallet.broadcastTx',
      summary: 'Broadcast a signed transaction',
      description:
        '**The irreversible step.** Once this returns, the funds have left the wallet.',
      method: 'POST',
      path: '/account/{sessionId}/wallets/{walletId}/broadcast-tx',
      source: 'src/cli/engine/routes/spend.ts',
      cli: [
        {
          command: 'broadcast-tx',
          usage: 'broadcast-tx <walletId> --object-id=<objectId>',
          flags: [
            { flag: '--object-id=<id>', maps: 'objectId', target: 'body' }
          ],
          example: 'edge-cli broadcast-tx abc123 --object-id=tx_3fK9…'
        }
      ],
      pathParams: [sessionId, walletId],
      body: s.object([f('objectId', s.string(), 'From `sign-tx`.')]),
      success: {
        status: 200,
        schema: s.ref('TransactionHandle'),
        doc: 'The handle survives so you can still call `save-tx`.'
      },
      errors: [
        'OBJECT_NOT_FOUND',
        'OBJECT_EXPIRED',
        'OBJECT_WALLET_MISMATCH',
        'BAD_REQUEST',
        'NETWORK_ERROR'
      ],
      notes: [
        'Broadcasting does not record the transaction locally. Follow with `save-tx` or it will be missing from history until a sync picks it up.'
      ]
    }),

    endpoint({
      id: 'saveTx',
      coreCall: 'wallet.saveTx',
      summary: 'Record a transaction and release its handle',
      description:
        'Final step: persists via `saveTx` plus the metadata re-apply that spend uses, then deletes the handle.',
      method: 'POST',
      path: '/account/{sessionId}/wallets/{walletId}/save-tx',
      source: 'src/cli/engine/routes/spend.ts',
      cli: [
        {
          command: 'save-tx',
          usage: 'save-tx <walletId> --object-id=<objectId>',
          flags: [
            { flag: '--object-id=<id>', maps: 'objectId', target: 'body' }
          ],
          example: 'edge-cli save-tx abc123 --object-id=tx_3fK9…'
        }
      ],
      pathParams: [sessionId, walletId],
      body: s.object([f('objectId', s.string())]),
      success: { status: 200, schema: s.ref('OkObject') },
      errors: [
        'OBJECT_NOT_FOUND',
        'OBJECT_EXPIRED',
        'OBJECT_WALLET_MISMATCH',
        'BAD_REQUEST'
      ],
      notes: [
        'The handle is gone afterwards; a second call returns `404 OBJECT_NOT_FOUND`.'
      ]
    }),

    endpoint({
      id: 'accelerate',
      coreCall: 'wallet.accelerate',
      summary: 'Fee-bump a pending transaction',
      description:
        'Replace-by-fee, where the plugin supports it. Returns a new unsigned transaction to sign and broadcast.',
      method: 'POST',
      path: '/account/{sessionId}/wallets/{walletId}/accelerate',
      source: 'src/cli/engine/routes/spend.ts',
      cli: [
        {
          command: 'accelerate',
          usage: 'accelerate <walletId> --object-id=<objectId>',
          flags: [
            {
              flag: '--object-id=<id>',
              maps: 'objectId',
              target: 'body'
            }
          ],
          example: 'edge-cli accelerate abc123 --object-id=tx_3fK9…'
        }
      ],
      pathParams: [sessionId, walletId],
      body: s.object([
        opt('objectId', s.string(), 'Handle of the transaction to accelerate.'),
        opt(
          'transaction',
          s.core('EdgeTransaction'),
          'Or the transaction object itself.'
        )
      ]),
      bodyDoc:
        'One of `objectId` or `transaction` is required. There is no `txid` form.',
      success: {
        status: 200,
        schema: s.ref('TransactionHandle'),
        doc: 'Given `objectId`, the same handle is updated; given `transaction`, a new handle is created.'
      },
      errors: [
        'BAD_REQUEST',
        'OBJECT_NOT_FOUND',
        'OBJECT_EXPIRED',
        'OBJECT_WALLET_MISMATCH',
        'WALLET_NOT_FOUND'
      ],
      notes: [
        'A plugin that cannot accelerate returns `400 BAD_REQUEST` rather than a null transaction.'
      ]
    }),

    endpoint({
      id: 'sweepPrivateKeys',
      coreCall: 'wallet.sweepPrivateKeys',
      summary: 'Sweep private keys into this wallet',
      description:
        'Builds a transaction moving everything from an external private key into this wallet.',
      method: 'POST',
      path: '/account/{sessionId}/wallets/{walletId}/sweep-private-keys',
      source: 'src/cli/engine/routes/spend.ts',
      cli: [
        {
          command: 'sweep-private-keys',
          usage: "sweep-private-keys <walletId> --spend-info='<json>'",
          flags: [
            {
              flag: "--spend-info='<json>'",
              maps: 'spendInfo',
              target: 'body'
            }
          ],
          example:
            'edge-cli sweep-private-keys abc123 --spend-info=\'{"privateKeys":["…"]}\''
        }
      ],
      pathParams: [sessionId, walletId],
      body: s.object([
        f(
          'spendInfo',
          s.core('EdgeSpendInfo', 'With the keys to sweep in `privateKeys`.')
        )
      ]),
      bodyDoc:
        'Requires a full `spendInfo`. The convenience fields and a bare `privateKey` are not accepted.',
      success: { status: 200, schema: s.ref('TransactionHandle') },
      errors: [
        'BAD_REQUEST',
        'INSUFFICIENT_FUNDS',
        'WALLET_NOT_FOUND',
        'NETWORK_ERROR'
      ],
      notes: [
        'Returns an unsigned handle — sign, broadcast, and save it like any staged spend.'
      ]
    }),

    endpoint({
      id: 'signBytes',
      coreCall: 'wallet.signBytes',
      summary: 'Sign arbitrary bytes',
      description:
        'Message signing and proof-of-ownership, for plugins that support it.',
      method: 'POST',
      path: '/account/{sessionId}/wallets/{walletId}/sign-bytes',
      source: 'src/cli/engine/routes/spend.ts',
      cli: [
        {
          command: 'sign-bytes',
          usage: 'sign-bytes <walletId> --bytes=<base64>',
          flags: [
            {
              flag: '--bytes=<base64>',
              maps: 'bytes',
              target: 'body'
            }
          ],
          example: 'edge-cli sign-bytes abc123 --bytes=aGVsbG8='
        }
      ],
      pathParams: [sessionId, walletId],
      body: s.object([
        opt(
          'bytes',
          s.string({ format: 'byte' }),
          'Base64. Defaults to empty when absent.'
        ),
        opt('data', s.string({ format: 'byte' }), 'Legacy alias for `bytes`.'),
        opt('otherParams', s.map(s.unknown()), 'Plugin-specific options.')
      ]),
      success: {
        status: 200,
        schema: s.object([
          f('signature', s.string({ format: 'byte' }), 'Base64.')
        ])
      },
      errors: ['BAD_REQUEST', 'WALLET_NOT_FOUND'],
      notes: [
        'Invalid base64 decodes to empty rather than erroring, so validate before sending.'
      ]
    }),

    endpoint({
      id: 'getPaymentProtocolInfo',
      coreCall: 'wallet.getPaymentProtocolInfo',
      summary: 'Fetch a BIP70 payment request',
      method: 'GET',
      path: '/account/{sessionId}/wallets/{walletId}/get-payment-protocol-info',
      source: 'src/cli/engine/routes/spend.ts',
      cli: [
        {
          command: 'get-payment-protocol-info',
          usage:
            'get-payment-protocol-info <walletId> --payment-protocol-url=<url>',
          flags: [
            {
              flag: '--payment-protocol-url=<url>',
              maps: 'paymentProtocolUrl',
              target: 'query'
            }
          ],
          example:
            "edge-cli get-payment-protocol-info abc123 --payment-protocol-url='https://…'"
        }
      ],
      pathParams: [sessionId, walletId],
      query: [
        {
          name: 'url',
          schema: s.string(),
          required: true,
          doc: 'The payment-request URL.'
        }
      ],
      success: {
        status: 200,
        schema: s.core(
          'EdgePaymentProtocolInfo',
          'domain, memo, merchant, nativeAmount, spendTargets, …'
        )
      },
      errors: ['BAD_REQUEST', 'WALLET_NOT_FOUND', 'NETWORK_ERROR'],
      notes: [
        'Feed `spendTargets` from the result into `make-spend` to pay it.'
      ]
    }),

    endpoint({
      id: 'getObject',
      coreCall: null,
      coreNote:
        'Engine handle store; core identifies these values by object reference.',
      summary: 'Inspect an object handle',
      description:
        'Works for every handle kind: transactions, pending logins, swap quotes.',
      method: 'GET',
      path: '/account/{sessionId}/objects/{objectId}',
      source: 'src/cli/engine/routes/spend.ts',
      cli: [
        {
          command: 'object-get',
          usage: 'object-get <objectId>',
          example: 'edge-cli object-get tx_3fK9…'
        }
      ],
      pathParams: [sessionId, objectId],
      success: {
        status: 200,
        schema: s.object([
          f(
            '…ObjectHandle',
            s.ref('ObjectHandle'),
            'Every [ObjectHandle](#schema-ObjectHandle) field, spread inline.'
          ),
          f(
            'value',
            s.unknown(),
            'The live core object, shape depending on `kind`.'
          )
        ])
      },
      errors: ['OBJECT_NOT_FOUND', 'OBJECT_EXPIRED', 'OBJECT_SESSION_MISMATCH'],
      notes: [
        'Reading does **not** extend the TTL. Only a step that updates the value does.'
      ]
    }),

    endpoint({
      id: 'deleteObject',
      coreCall: null,
      coreNote:
        'Engine handle store; core identifies these values by object reference.',
      summary: 'Release an object handle',
      description:
        'Runs the handle’s cleanup — closing a swap quote, cancelling a pending login — instead of waiting out the TTL.',
      method: 'POST',
      path: '/account/{sessionId}/objects/{objectId}/delete',
      source: 'src/cli/engine/routes/spend.ts',
      cli: [
        {
          command: 'object-delete',
          usage: 'object-delete <objectId>',
          example: 'edge-cli object-delete tx_3fK9…'
        }
      ],
      pathParams: [sessionId, objectId],
      success: { status: 200, schema: s.ref('OkObject') },
      errors: ['OBJECT_NOT_FOUND', 'OBJECT_EXPIRED', 'OBJECT_SESSION_MISMATCH']
    })
  ]
})
