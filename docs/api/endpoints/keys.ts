import { f, opt, s } from '../schema'
import { endpoint, group } from '../types'
import { sessionId } from './common'

/** Core takes walletId as an argument here, so it is a query param, not scope. */
const walletIdQuery = {
  name: 'walletId',
  schema: s.string({ example: 'abc123…' }),
  required: true,
  doc: 'Full base58 wallet id.'
}

export const keysGroup = group({
  id: 'keys',
  title: 'Keys',
  doc: 'Raw key infrastructure beneath the wallet API. Several of these return private key material, and the engine has no transport auth — treat any process that can reach the socket as fully trusted.',
  endpoints: [
    endpoint({
      id: 'allKeys',
      summary: 'List every key in the account',
      coreCall: 'account.allKeys',
      method: 'GET',
      path: '/accounts/{sessionId}/all-keys',
      source: 'src/cli/engine/routes/keys.ts',
      cli: [
        { command: 'all-keys', usage: 'all-keys', example: 'edge-cli all-keys' }
      ],
      pathParams: [sessionId],
      success: {
        status: 200,
        schema: s.object([
          f(
            'allKeys',
            s.array(
              s.core(
                'EdgeWalletInfoFull',
                'id, type, keys, archived, deleted, hidden, sortIndex'
              )
            )
          )
        ])
      },
      notes: ['Includes archived and deleted keys, unlike `currency-wallets`.']
    }),

    endpoint({
      id: 'createWallet',
      summary: 'Create a wallet from raw key JSON',
      description:
        'The import path. Use `create-currency-wallet` to make a fresh wallet with generated keys.',
      coreCall: 'account.createWallet',
      method: 'POST',
      path: '/accounts/{sessionId}/create-wallet',
      source: 'src/cli/engine/routes/keys.ts',
      cli: [
        {
          command: 'create-wallet',
          usage: "create-wallet --key-info='<json>'",
          flags: [
            {
              flag: "--key-info='<json>'",
              maps: 'the whole body',
              target: 'body'
            }
          ],
          example: `edge-cli create-wallet --key-info='{"type":"wallet:bitcoin","keys":{…}}'`
        }
      ],
      pathParams: [sessionId],
      body: s.object([
        f('type', s.string({ example: 'wallet:bitcoin' })),
        opt('keys', s.map(s.unknown()), 'Omit to let core generate them.')
      ]),
      success: { status: 200, schema: s.object([f('walletId', s.string())]) },
      errors: ['BAD_REQUEST']
    }),

    endpoint({
      id: 'getWalletInfo',
      summary: 'Read one wallet’s key info',
      coreCall: 'account.getWalletInfo',
      method: 'GET',
      path: '/accounts/{sessionId}/get-wallet-info',
      source: 'src/cli/engine/routes/keys.ts',
      cli: [],
      pathParams: [sessionId],
      query: [
        {
          name: 'id',
          schema: s.string(),
          required: true,
          doc: 'Core calls this `id`.'
        }
      ],
      success: {
        status: 200,
        schema: s.core('EdgeWalletInfoFull'),
        doc: 'Verbatim from core, **including the `keys` object**.'
      },
      errors: ['WALLET_NOT_FOUND'],
      notes: [
        'An exact lookup — unlike the wallet-scoped routes, this does not accept an id prefix.'
      ]
    }),

    endpoint({
      id: 'getRawPrivateKey',
      summary: 'Read raw private key material',
      description:
        '**Secret.** Whatever the plugin stores — seed, mnemonic, xpriv.',
      coreCall: 'account.getRawPrivateKey',
      method: 'GET',
      path: '/accounts/{sessionId}/get-raw-private-key',
      source: 'src/cli/engine/routes/keys.ts',
      cli: [
        {
          command: 'get-raw-private-key',
          usage: 'get-raw-private-key <walletId>',
          example: 'edge-cli get-raw-private-key abc123'
        }
      ],
      pathParams: [sessionId],
      query: [walletIdQuery],
      success: {
        status: 200,
        schema: s.map(s.unknown()),
        doc: 'The plugin’s `JsonObject`, at the top level.'
      },
      errors: ['WALLET_NOT_FOUND']
    }),

    endpoint({
      id: 'getRawPublicKey',
      summary: 'Read raw public key material',
      coreCall: 'account.getRawPublicKey',
      method: 'GET',
      path: '/accounts/{sessionId}/get-raw-public-key',
      source: 'src/cli/engine/routes/keys.ts',
      cli: [],
      pathParams: [sessionId],
      query: [walletIdQuery],
      success: { status: 200, schema: s.map(s.unknown()) },
      errors: ['WALLET_NOT_FOUND']
    }),

    endpoint({
      id: 'getDisplayPrivateKey',
      summary: 'Export the private key for display',
      description:
        '**Secret.** The human-facing form — WIF, seed phrase, whatever the plugin shows in the GUI export screen.',
      coreCall: 'account.getDisplayPrivateKey',
      method: 'GET',
      path: '/accounts/{sessionId}/get-display-private-key',
      source: 'src/cli/engine/routes/keys.ts',
      cli: [
        {
          command: 'get-display-private-key',
          usage: 'get-display-private-key <walletId>',
          example: 'edge-cli get-display-private-key abc123'
        }
      ],
      pathParams: [sessionId],
      query: [walletIdQuery],
      success: { status: 200, schema: s.object([f('key', s.string())]) },
      errors: ['WALLET_NOT_FOUND']
    }),

    endpoint({
      id: 'getDisplayPublicKey',
      summary: 'Export the public key for display',
      description: 'The xpub or equivalent — safe to share for watch-only use.',
      coreCall: 'account.getDisplayPublicKey',
      method: 'GET',
      path: '/accounts/{sessionId}/get-display-public-key',
      source: 'src/cli/engine/routes/keys.ts',
      cli: [
        {
          command: 'get-display-public-key',
          usage: 'get-display-public-key <walletId>',
          example: 'edge-cli get-display-public-key abc123'
        }
      ],
      pathParams: [sessionId],
      query: [walletIdQuery],
      success: { status: 200, schema: s.object([f('key', s.string())]) },
      errors: ['WALLET_NOT_FOUND']
    }),

    endpoint({
      id: 'listSplittableWalletTypes',
      summary: 'List chains a wallet can split into',
      coreCall: 'account.listSplittableWalletTypes',
      method: 'GET',
      path: '/accounts/{sessionId}/list-splittable-wallet-types',
      source: 'src/cli/engine/routes/keys.ts',
      cli: [],
      pathParams: [sessionId],
      query: [walletIdQuery],
      success: {
        status: 200,
        schema: s.object([
          f('walletTypes', s.array(s.string({ example: 'wallet:bitcoincash' })))
        ])
      },
      errors: ['WALLET_NOT_FOUND']
    }),

    endpoint({
      id: 'changeWalletStates',
      summary: 'Archive, delete, hide, or reorder wallets',
      description:
        'The canonical backend for every wallet flag. There are no separate archive / unarchive / undelete verbs.',
      coreCall: 'account.changeWalletStates',
      method: 'POST',
      path: '/accounts/{sessionId}/change-wallet-states',
      source: 'src/cli/engine/routes/keys.ts',
      cli: [
        {
          command: 'change-wallet-states',
          usage:
            'change-wallet-states <walletId> [--archived=true|false] [--deleted=true|false] [--hidden=true|false] [--sort-index=<n>]',
          flags: [
            {
              flag: '--archived=<bool>',
              maps: 'walletStates[id].archived',
              target: 'body'
            },
            {
              flag: '--deleted=<bool>',
              maps: 'walletStates[id].deleted',
              target: 'body'
            },
            {
              flag: '--hidden=<bool>',
              maps: 'walletStates[id].hidden',
              target: 'body'
            },
            {
              flag: '--sort-index=<n>',
              maps: 'walletStates[id].sortIndex',
              target: 'body'
            }
          ],
          example: 'edge-cli change-wallet-states abc123 --archived=true',
          notes: 'Requires at least one flag, and sends a single-wallet map.'
        }
      ],
      pathParams: [sessionId],
      body: s.object([
        f(
          'walletStates',
          s.map(
            s.object([
              opt('archived', s.boolean()),
              opt('deleted', s.boolean()),
              opt('hidden', s.boolean()),
              opt('sortIndex', s.int())
            ])
          ),
          'Core `EdgeWalletStates`: wallet ids to flag changes.'
        )
      ]),
      success: { status: 204 },
      errors: ['BAD_REQUEST']
    })
  ]
})
