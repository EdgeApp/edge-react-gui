import { f, s } from '../schema'
import { endpoint, group } from '../types'
import { sessionId, walletId } from './common'

export const tokensGroup = group({
  id: 'tokens',
  title: 'Tokens',
  doc: 'Which tokens a wallet tracks. “Enabled” tokens are the ones the wallet syncs balances for; “detected” ones were seen on-chain but are not yet enabled.',
  endpoints: [
    endpoint({
      id: 'walletTokens',
      summary: 'List a wallet’s tokens',
      coreCall: null,
      coreNote:
        'Engine composite of EdgeCurrencyConfig token maps plus wallet.enabledTokenIds and wallet.detectedTokenIds.',
      method: 'GET',
      path: '/account/{sessionId}/wallets/{walletId}/tokens',
      source: 'src/cli/engine/routes/tokens.ts',
      cli: [
        {
          command: 'wallet-tokens',
          usage: 'wallet-tokens <walletId>',
          example: 'edge-cli wallet-tokens abc123'
        }
      ],
      pathParams: [sessionId, walletId],
      success: {
        status: 200,
        schema: s.object([
          f(
            'allTokens',
            s.map(s.core('EdgeToken')),
            'Built-in and custom, keyed by tokenId. Large on EVM chains.'
          ),
          f('builtinTokens', s.map(s.core('EdgeToken'))),
          f('customTokens', s.map(s.core('EdgeToken'))),
          f('enabledTokenIds', s.array(s.string())),
          f('detectedTokenIds', s.array(s.string()))
        ])
      },
      errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID']
    }),

    endpoint({
      id: 'changeEnabledTokenIds',
      summary: 'Set the enabled token set',
      description:
        'Absolute: anything missing from `tokenIds` is disabled. Core has only this setter — there is no add or remove call.',
      coreCall: 'wallet.changeEnabledTokenIds',
      method: 'POST',
      path: '/account/{sessionId}/wallets/{walletId}/change-enabled-token-ids',
      source: 'src/cli/engine/routes/tokens.ts',
      cli: [
        {
          command: 'change-enabled-token-ids',
          usage:
            'change-enabled-token-ids <walletId> (--token-ids=<a,b,c> | --add=<id> | --remove=<id>)',
          flags: [
            {
              flag: '--token-ids=<a,b,c>',
              maps: 'tokenIds',
              target: 'body',
              doc: 'Comma list; sent as the complete set.'
            },
            {
              flag: '--add=<id>',
              maps: 'tokenIds',
              target: 'client',
              doc: 'Repeatable. Reads the current set first, then writes it back with this id added.'
            },
            {
              flag: '--remove=<id>',
              maps: 'tokenIds',
              target: 'client',
              doc: 'Repeatable, same read-modify-write.'
            }
          ],
          example: 'edge-cli change-enabled-token-ids abc123 --add=0xa0b8…',
          notes:
            '`--add` / `--remove` are client-side sugar over the single core setter, so they cost an extra `GET …/tokens` first. They cannot be combined with `--token-ids`.'
        }
      ],
      pathParams: [sessionId, walletId],
      body: s.object([
        f('tokenIds', s.array(s.string()), 'The complete desired set.')
      ]),
      success: { status: 200, schema: s.ref('EnabledTokens') },
      errors: ['BAD_REQUEST', 'WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID']
    })
  ]
})
