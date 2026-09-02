import { f, opt, s } from '../schema'
import { endpoint, group } from '../types'
import { sessionId, walletId } from './common'

export const walletsGroup = group({
  id: 'wallets',
  title: 'Wallets',
  doc: 'Account-level wallet listing and creation, then per-wallet calls under `/accounts/{sessionId}/wallets/{walletId}/`. The `{walletId}` segment is scope — it is the receiver of the core call — and accepts a unique prefix, so these routes can also return `404 WALLET_NOT_FOUND` or `409 AMBIGUOUS_WALLET_ID`.',
  endpoints: [
    endpoint({
      id: 'currencyWallets',
      summary: 'List wallets',
      coreCall: 'account.currencyWallets',
      coreNote:
        'Filtered by account.activeWalletIds / archivedWalletIds / hiddenWalletIds.',
      method: 'GET',
      path: '/accounts/{sessionId}/currency-wallets',
      source: 'src/cli/engine/routes/wallets.ts',
      cli: [
        {
          command: 'currency-wallets',
          usage:
            'currency-wallets [--filter=active|archived|hidden|all] [--no-wait]',
          flags: [
            { flag: '--filter=<f>', maps: 'filter', target: 'query' },
            {
              flag: '--no-wait',
              maps: 'waitForAll=false',
              target: 'query',
              doc: 'Inverted: the CLI sends `waitForAll=true` unless you pass this.'
            }
          ],
          example: 'edge-cli currency-wallets --filter=all'
        }
      ],
      pathParams: [sessionId],
      query: [
        {
          name: 'filter',
          schema: s.string({ enum: ['active', 'archived', 'hidden', 'all'] }),
          default: 'active'
        },
        {
          name: 'waitForAll',
          schema: s.boolean(),
          default: 'false',
          doc: 'Await `account.waitForAllWallets()` first. Without it a freshly logged-in account may report fewer wallets than it has.'
        }
      ],
      success: {
        status: 200,
        schema: s.object([
          f('currencyWallets', s.array(s.ref('WalletSummary')))
        ])
      },
      notes: [
        'The REST default for `waitForAll` is `false`; the command defaults it to `true`. A raw HTTP caller that skips it can see an incomplete list.'
      ]
    }),

    endpoint({
      id: 'createCurrencyWallet',
      summary: 'Create a currency wallet',
      coreCall: 'account.createCurrencyWallet',
      method: 'POST',
      path: '/accounts/{sessionId}/create-currency-wallet',
      source: 'src/cli/engine/routes/wallets.ts',
      cli: [
        {
          command: 'create-currency-wallet',
          usage: 'create-currency-wallet <walletType> [--name=<name>]',
          flags: [{ flag: '--name=<name>', maps: 'name', target: 'body' }],
          example:
            "edge-cli create-currency-wallet wallet:bitcoin --name='My BTC'"
        }
      ],
      pathParams: [sessionId],
      body: s.object([
        f('walletType', s.string({ example: 'wallet:bitcoin' })),
        opt('name', s.string()),
        opt('fiatCurrencyCode', s.string({ example: 'iso:USD' })),
        opt(
          'importText',
          s.string(),
          'Seed or key text to import instead of generating.'
        )
      ]),
      bodyDoc:
        'Fields match `EdgeCreateCurrencyWalletOptions`. Use `GET /currency-configs` for valid `walletType` values.',
      success: { status: 200, schema: s.ref('WalletSummary') },
      errors: ['BAD_REQUEST'],
      notes: [
        '`fiatCurrencyCode` and `importText` are REST-only; the command has no flags for them.'
      ]
    }),

    endpoint({
      id: 'createCurrencyWallets',
      summary: 'Create several wallets at once',
      description:
        'Partial success is normal: each entry reports its own outcome and one failure does not roll back the others.',
      coreCall: 'account.createCurrencyWallets',
      method: 'POST',
      path: '/accounts/{sessionId}/create-currency-wallets',
      source: 'src/cli/engine/routes/wallets.ts',
      cli: [],
      pathParams: [sessionId],
      body: s.object([
        f(
          'createWallets',
          s.array(
            s.core(
              'EdgeCreateCurrencyWallet',
              'walletType, name, fiatCurrencyCode, …'
            )
          ),
          'Core parameter name.'
        )
      ]),
      success: {
        status: 200,
        schema: s.object([
          f(
            'results',
            s.array(
              s.object([
                f('ok', s.boolean()),
                opt(
                  'wallet',
                  s.ref('WalletSummary'),
                  'Present when `ok` is `true`.'
                ),
                opt('error', s.string(), 'Message string when `ok` is `false`.')
              ])
            ),
            'Mirrors core’s `EdgeResult[]`.'
          )
        ])
      },
      errors: ['BAD_REQUEST']
    }),

    endpoint({
      id: 'walletInfo',
      summary: 'Wallet detail',
      coreCall: null,
      coreNote:
        'Engine composite of EdgeCurrencyWallet properties plus its EdgeCurrencyConfig token map.',
      method: 'GET',
      path: '/accounts/{sessionId}/wallets/{walletId}',
      source: 'src/cli/engine/routes/wallets.ts',
      cli: [
        {
          command: 'wallet-info',
          usage: 'wallet-info <walletId>',
          example: 'edge-cli wallet-info abc123'
        }
      ],
      pathParams: [sessionId, walletId],
      success: {
        status: 200,
        schema: s.object([
          f(
            '…WalletSummary',
            s.ref('WalletSummary'),
            'Every [WalletSummary](#schema-WalletSummary) field, spread inline.'
          ),
          f('denominations', s.core('EdgeDenomination[]')),
          f('walletSettings', s.core('JsonObject')),
          f(
            'allTokens',
            s.map(s.core('EdgeToken')),
            'Can be large on EVM chains.'
          )
        ])
      },
      errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID']
    }),

    endpoint({
      id: 'renameWallet',
      summary: 'Rename a wallet',
      coreCall: 'wallet.renameWallet',
      method: 'POST',
      path: '/accounts/{sessionId}/wallets/{walletId}/rename-wallet',
      source: 'src/cli/engine/routes/wallets.ts',
      cli: [
        {
          command: 'rename-wallet',
          usage: 'rename-wallet <walletId> --name=<name>',
          flags: [{ flag: '--name=<name>', maps: 'name', target: 'body' }],
          example: "edge-cli rename-wallet abc123 --name='Savings'"
        }
      ],
      pathParams: [sessionId, walletId],
      body: s.object([f('name', s.string())]),
      success: { status: 204 },
      errors: ['BAD_REQUEST', 'WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID']
    }),

    endpoint({
      id: 'setFiatCurrencyCode',
      summary: 'Change a wallet’s fiat currency',
      coreCall: 'wallet.setFiatCurrencyCode',
      method: 'POST',
      path: '/accounts/{sessionId}/wallets/{walletId}/set-fiat-currency-code',
      source: 'src/cli/engine/routes/wallets.ts',
      cli: [],
      pathParams: [sessionId, walletId],
      body: s.object([f('fiatCurrencyCode', s.string({ example: 'iso:EUR' }))]),
      success: { status: 204 },
      errors: ['BAD_REQUEST', 'WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID']
    }),

    endpoint({
      id: 'changePaused',
      summary: 'Pause or resume a wallet engine',
      coreCall: 'wallet.changePaused',
      method: 'POST',
      path: '/accounts/{sessionId}/wallets/{walletId}/change-paused',
      source: 'src/cli/engine/routes/wallets.ts',
      cli: [],
      pathParams: [sessionId, walletId],
      body: s.object([f('paused', s.boolean())]),
      success: { status: 204 },
      errors: ['BAD_REQUEST', 'WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID']
    }),

    endpoint({
      id: 'walletSync',
      summary: 'Nudge a wallet to sync',
      coreCall: 'wallet.sync',
      method: 'POST',
      path: '/accounts/{sessionId}/wallets/{walletId}/sync',
      source: 'src/cli/engine/routes/wallets.ts',
      cli: [],
      pathParams: [sessionId, walletId],
      body: s.object([], { open: true }),
      bodyDoc: 'None.',
      success: { status: 204 },
      errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],
      notes: [
        'Distinct from `POST /accounts/{sessionId}/sync`, which is `account.sync`.'
      ]
    }),

    endpoint({
      id: 'resyncBlockchain',
      summary: 'Rescan the blockchain from scratch',
      description:
        'Drops cached chain state and re-scans. Expensive, and the wallet reports an incomplete balance until it finishes.',
      coreCall: 'wallet.resyncBlockchain',
      method: 'POST',
      path: '/accounts/{sessionId}/wallets/{walletId}/resync-blockchain',
      source: 'src/cli/engine/routes/wallets.ts',
      cli: [],
      pathParams: [sessionId, walletId],
      body: s.object([], { open: true }),
      bodyDoc: 'None.',
      success: { status: 204 },
      errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],
      notes: [
        'Returns when the resync is requested, not when it completes. Watch `syncRatio` for progress.'
      ]
    }),

    endpoint({
      id: 'splitWallet',
      summary: 'Split a wallet into another chain',
      description:
        'Forked-chain support: derive a wallet of a different type from the same keys.',
      coreCall: 'wallet.split',
      method: 'POST',
      path: '/accounts/{sessionId}/wallets/{walletId}/split',
      source: 'src/cli/engine/routes/wallets.ts',
      cli: [],
      pathParams: [sessionId, walletId],
      body: s.object([
        f(
          'splitWallets',
          s.array(
            s.core(
              'EdgeSplitCurrencyWallet',
              'walletType, name, fiatCurrencyCode'
            )
          )
        )
      ]),
      bodyDoc:
        'Query `list-splittable-wallet-types` for valid `walletType` values.',
      success: {
        status: 200,
        schema: s.object([
          f(
            'results',
            s.array(
              s.object([
                f('ok', s.boolean()),
                opt('wallet', s.ref('WalletSummary')),
                opt('error', s.string())
              ])
            )
          )
        ])
      },
      errors: ['BAD_REQUEST', 'WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID']
    }),

    endpoint({
      id: 'dumpData',
      summary: 'Dump wallet engine state',
      description:
        'Plugin-defined debug output. Shape varies by plugin and can be very large.',
      coreCall: 'wallet.dumpData',
      method: 'GET',
      path: '/accounts/{sessionId}/wallets/{walletId}/dump-data',
      source: 'src/cli/engine/routes/wallets.ts',
      cli: [],
      pathParams: [sessionId, walletId],
      success: { status: 200, schema: s.core('EdgeDataDump') },
      errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID']
    }),

    endpoint({
      id: 'balanceMap',
      summary: 'Balances for every asset in the wallet',
      description: 'The native currency plus every enabled token.',
      coreCall: 'wallet.balanceMap',
      coreNote:
        'Rendered as an array, with currencyCode and displayAmount added from the wallet’s denominations.',
      method: 'GET',
      path: '/accounts/{sessionId}/wallets/{walletId}/balance-map',
      source: 'src/cli/engine/routes/wallets.ts',
      cli: [
        {
          command: 'balance-map',
          usage: 'balance-map <walletId> [--token-id=<id>]',
          flags: [
            {
              flag: '--token-id=<id>',
              maps: '—',
              target: 'client',
              doc: 'Client-side filter over the returned array; core has no single-balance accessor.'
            }
          ],
          example: 'edge-cli balance-map abc123'
        }
      ],
      pathParams: [sessionId, walletId],
      success: {
        status: 200,
        schema: s.object([f('balances', s.array(s.ref('Balance')))])
      },
      errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],
      notes: [
        'On the CLI, **omit** `--token-id` for the native asset; do not pass the literal `null`.'
      ]
    }),

    endpoint({
      id: 'getAddresses',
      summary: 'Receive addresses',
      coreCall: 'wallet.getAddresses',
      method: 'GET',
      path: '/accounts/{sessionId}/wallets/{walletId}/get-addresses',
      source: 'src/cli/engine/routes/wallets.ts',
      cli: [
        {
          command: 'get-addresses',
          usage: 'get-addresses <walletId> [--token-id=<id>]',
          flags: [
            { flag: '--token-id=<id>', maps: 'tokenId', target: 'query' }
          ],
          example: 'edge-cli get-addresses abc123'
        }
      ],
      pathParams: [sessionId, walletId],
      query: [
        { name: 'tokenId', schema: s.string(), default: 'null (native)' },
        {
          name: 'forceIndex',
          schema: s.int(),
          doc: 'Core `EdgeGetReceiveAddressOptions.forceIndex`.'
        }
      ],
      success: {
        status: 200,
        schema: s.object([
          f(
            'addresses',
            s.array(
              s.core(
                'EdgeAddress',
                'addressType, publicAddress, nativeBalance, …'
              )
            )
          )
        ])
      },
      errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID']
    })
  ]
})
