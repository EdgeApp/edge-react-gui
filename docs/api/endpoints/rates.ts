import { f, opt, s } from '../schema'
import { endpoint, group } from '../types'

export const ratesGroup = group({
  id: 'rates',
  title: 'Exchange rates',
  doc: 'Historical and current rates through the same `rates3` / `rates4` batching queue the GUI uses. No session required.',
  endpoints: [
    endpoint({
      id: 'queryRates',
      coreCall: null,
      coreNote:
        'GUI code (src/util/exchangeRates): getHistoricalCryptoRate / getHistoricalFiatRate.',
      summary: 'Batch rate lookups',
      description:
        'Crypto and fiat in one request. Concurrent lookups share a single upstream `POST v3/rates` batch.',
      method: 'POST',
      path: '/rates/query',
      source: 'src/cli/engine/routes/rates.ts',
      cli: [
        {
          command: 'rates-query',
          usage: "rates-query --body='<json>'",
          flags: [
            { flag: "--body='<json>'", maps: 'the whole body', target: 'body' }
          ],
          example: `edge-cli rates-query --body='{"crypto":[{"pluginId":"bitcoin"}]}'`
        }
      ],
      body: s.object([
        opt(
          'crypto',
          s.array(
            s.object([
              f('pluginId', s.string({ example: 'bitcoin' })),
              opt('tokenId', s.tokenId(), 'Default `null`.'),
              opt(
                'targetFiat',
                s.string({ example: 'iso:USD' }),
                'Default `iso:USD`.'
              ),
              opt('date', s.date(), 'Default now.')
            ])
          )
        ),
        opt(
          'fiat',
          s.array(
            s.object([
              f('fiatCode', s.string({ example: 'EUR' })),
              opt('targetFiat', s.string(), 'Default `iso:USD`.'),
              opt('date', s.date())
            ])
          )
        )
      ]),
      bodyDoc:
        'Supply `crypto`, `fiat`, or both. Omitting `date` sends the current timestamp — there is no separate “live” path.',
      success: {
        status: 200,
        schema: s.object([
          f(
            'crypto',
            s.array(
              s.object([
                f('pluginId', s.string()),
                f('tokenId', s.tokenId()),
                f('targetFiat', s.string()),
                f('date', s.date(), 'The timestamp actually queried.'),
                f('rate', s.number({ example: 29753.12 }))
              ])
            )
          ),
          f(
            'fiat',
            s.array(
              s.object([
                f('fiatCode', s.string()),
                f('targetFiat', s.string()),
                f('date', s.date()),
                f('rate', s.number({ example: 1.08 }))
              ])
            )
          )
        ]),
        doc: 'Both arrays are always present; an omitted request array comes back empty.'
      },
      errors: ['BAD_REQUEST', 'NETWORK_ERROR'],
      notes: [
        'A rate the server cannot supply comes back as `0` rather than an error, so check for zero before dividing.'
      ]
    }),

    endpoint({
      id: 'usdToNative',
      coreCall: null,
      coreNote: 'GUI code (src/util/exchangeRates): getHistoricalCryptoRate.',
      summary: 'Convert USD to a native amount',
      description: 'Turns a fiat notional into the native units a spend needs.',
      method: 'POST',
      path: '/rates/usd-to-native',
      source: 'src/cli/engine/routes/rates.ts',
      cli: [
        {
          command: 'rates-usd-to-native',
          usage:
            'rates-usd-to-native --usd-amount=<n> --plugin-id=<id> [--token-id=<id>]',
          flags: [
            { flag: '--usd-amount=<n>', maps: 'usdAmount', target: 'body' },
            { flag: '--plugin-id=<id>', maps: 'pluginId', target: 'body' },
            { flag: '--token-id=<id>', maps: 'tokenId', target: 'body' }
          ],
          example:
            'edge-cli rates-usd-to-native --usd-amount=90 --plugin-id=bitcoin',
          notes:
            'No flags for `multiplier` or `date`, so the command always uses the default multiplier at the current rate. Both are REST-only.'
        }
      ],
      body: s.object([
        f(
          'usdAmount',
          s.string({ example: '90' }),
          'A **string**, and must parse to a positive finite number.'
        ),
        f('pluginId', s.string({ example: 'bitcoin' })),
        opt('tokenId', s.tokenId()),
        opt(
          'multiplier',
          s.string({ example: '100000000' }),
          'Defaults per plugin; `1e8` as a final fallback.'
        ),
        opt('date', s.date(), 'Default now.')
      ]),
      success: {
        status: 200,
        schema: s.object([
          f(
            'usdAmount',
            s.number({ example: 90 }),
            'Echoed as a **number**, though it is sent as a string.'
          ),
          f('pluginId', s.string()),
          f('tokenId', s.tokenId()),
          f('multiplier', s.string()),
          f('date', s.date()),
          f('rate', s.number({ example: 100000.12 })),
          f(
            'displayAmount',
            s.string({ example: '0.00090000' }),
            'Fixed to 8 decimals.'
          ),
          f('nativeAmount', s.amount('90000'))
        ])
      },
      errors: ['BAD_REQUEST', 'NOT_FOUND', 'NETWORK_ERROR'],
      notes: [
        '`displayAmount` is rounded to 8 decimals before conversion, so assets with more precision lose the tail. For an exact figure, use `POST /v1/rates/query` and do the arithmetic yourself.',
        'Defaults exist only for bitcoin, ethereum, bitcoincash, litecoin, and dogecoin — pass `multiplier` explicitly for anything else.'
      ]
    })
  ]
})
