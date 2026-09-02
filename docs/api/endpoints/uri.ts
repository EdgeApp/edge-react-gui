import { f, opt, s } from '../schema'
import { endpoint, group } from '../types'
import { sessionId, walletId } from './common'

export const uriGroup = group({
  id: 'uri',
  title: 'Payment URIs',
  doc: 'Parsing and building BIP21-style payment URIs through the wallet’s own plugin, so chain-specific quirks are handled for you.',
  endpoints: [
    endpoint({
      id: 'parseUri',
      coreCall: 'wallet.parseUri',
      summary: 'Parse a payment URI or get-addresses',
      description:
        'What the GUI get-addresses tile does when you paste or scan something.',
      method: 'POST',
      path: '/account/{sessionId}/wallets/{walletId}/parse-uri',
      source: 'src/cli/engine/routes/uri.ts',
      cli: [
        {
          command: 'parse-uri',
          usage: 'parse-uri <walletId> --uri=<uri> [--currency-code=<code>]',
          flags: [
            {
              flag: '--uri=<uri>',
              maps: 'uri',
              target: 'body'
            },
            {
              flag: '--currency-code=<code>',
              maps: 'currencyCode',
              target: 'body'
            }
          ],
          example: "edge-cli parse-uri abc123 --uri='bitcoin:bc1…?amount=0.01'"
        }
      ],
      pathParams: [sessionId, walletId],
      body: s.object([
        f(
          'uri',
          s.string({ example: 'bitcoin:bc1…?amount=0.01&label=Coffee' }),
          'A URI or a bare get-addresses.'
        ),
        opt(
          'currencyCode',
          s.string(),
          'Disambiguates on chains that carry several assets.'
        )
      ]),
      success: {
        status: 200,
        schema: s.core(
          'EdgeParsedUri',
          'publicAddress, nativeAmount, currencyCode, metadata, paymentProtocolUrl, …'
        )
      },
      errors: ['BAD_REQUEST', 'WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID'],
      notes: [
        '`POST …/spend` and `…/make-spend` run `to` through this same call, so parsing separately is only needed when you want to inspect or confirm first.'
      ]
    }),

    endpoint({
      id: 'encodeUri',
      coreCall: 'wallet.encodeUri',
      summary: 'Build a payment URI',
      description: 'For a receive screen or QR code.',
      method: 'POST',
      path: '/account/{sessionId}/wallets/{walletId}/encode-uri',
      source: 'src/cli/engine/routes/uri.ts',
      cli: [
        {
          command: 'encode-uri',
          usage:
            'encode-uri <walletId> --public-address=<addr> [--native-amount=<n>] [--label=<text>] [--message=<text>] [--currency-code=<code>]',
          flags: [
            {
              flag: '--public-address=<addr>',
              maps: 'publicAddress',
              target: 'body'
            },
            {
              flag: '--native-amount=<n>',
              maps: 'nativeAmount',
              target: 'body'
            },
            {
              flag: '--label=<text>',
              maps: 'label',
              target: 'body'
            },
            {
              flag: '--message=<text>',
              maps: 'message',
              target: 'body'
            },
            {
              flag: '--currency-code=<code>',
              maps: 'currencyCode',
              target: 'body'
            }
          ],
          example:
            'edge-cli encode-uri abc123 --public-address=bc1qexample --native-amount=1000'
        }
      ],
      pathParams: [sessionId, walletId],
      body: s.object([
        f('publicAddress', s.string({ example: 'bc1…' })),
        opt('nativeAmount', s.amount('1000')),
        opt(
          'label',
          s.string(),
          'BIP21 `label` — becomes `metadata.name` when parsed back.'
        ),
        opt(
          'message',
          s.string(),
          'BIP21 `message` — becomes `metadata.notes`.'
        ),
        opt('currencyCode', s.string())
      ]),
      bodyDoc:
        'Only these five fields are read; a full `EdgeEncodeUri` with extras will have the rest ignored.',
      success: {
        status: 200,
        schema: s.object([
          f('uri', s.string({ example: 'bitcoin:bc1…?amount=0.00001' }))
        ])
      },
      errors: ['BAD_REQUEST', 'WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID']
    })
  ]
})
