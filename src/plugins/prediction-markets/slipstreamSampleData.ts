import {
  asPredictionMarkets,
  type PredictionMarket,
  type PredictionMarketCategory
} from './slipstreamTypes'

/**
 * Bundled sample markets, shaped exactly like `GET /connect/markets/{category}`
 * responses. Shown (with an in-UI notice) when no Slipstream Connect API key
 * is configured, so the prediction market scenes stay fully browsable.
 *
 * The literals run through `asPredictionMarkets` so they are guaranteed to
 * match what a live API response would produce.
 */
const sampleData = {
  sports: [
    {
      id: 'hyperliquid:@107|polymarket:0x2a3f9c41',
      title: 'Lakers vs Celtics: Lakers win',
      category: 'sports',
      league: 'nba',
      legs: [
        {
          venue: 'polymarket',
          market_id: '0x2a3f9c41',
          outcome_id: '71943382',
          url: 'https://polymarket.com/event/lakers-vs-celtics',
          volume_24h: '184200.5',
          resolution_date: '2026-08-21T02:30:00Z'
        },
        { venue: 'hyperliquid', market_id: '@107', outcome_id: '#107' }
      ],
      venue_prices: [
        { venue: 'hyperliquid', best_ask: '0.64', best_bid: '0.62' },
        { venue: 'polymarket', best_ask: '0.62', best_bid: '0.60' }
      ],
      book: {
        bids: [
          { price: '0.62', size: '1200', venue: 'hyperliquid' },
          { price: '0.60', size: '2400', venue: 'polymarket' },
          { price: '0.59', size: '900', venue: 'polymarket' }
        ],
        asks: [
          { price: '0.62', size: '800', venue: 'polymarket' },
          { price: '0.63', size: '1500', venue: 'polymarket' },
          { price: '0.64', size: '650', venue: 'hyperliquid' }
        ],
        best_bid: '0.62',
        best_ask: '0.62'
      }
    },
    {
      id: 'kalshi:KXNFLGAME|polymarket:0x8b1d2e77',
      title: 'Chiefs win Super Bowl LXI',
      category: 'sports',
      league: 'nfl',
      legs: [
        {
          venue: 'polymarket',
          market_id: '0x8b1d2e77',
          outcome_id: '55018221',
          url: 'https://polymarket.com/event/super-bowl-lxi',
          volume_24h: '96411.0',
          resolution_date: '2027-02-08T04:00:00Z'
        },
        { venue: 'kalshi', market_id: 'KXNFLGAME', outcome_id: 'KXNFLGAME-YES' }
      ],
      venue_prices: [
        { venue: 'polymarket', best_ask: '0.18', best_bid: '0.17' },
        { venue: 'kalshi', best_ask: '0.19', best_bid: '0.16' }
      ],
      book: {
        bids: [
          { price: '0.17', size: '5200', venue: 'polymarket' },
          { price: '0.16', size: '3100', venue: 'kalshi' }
        ],
        asks: [
          { price: '0.18', size: '4400', venue: 'polymarket' },
          { price: '0.19', size: '2800', venue: 'kalshi' }
        ],
        best_bid: '0.17',
        best_ask: '0.18'
      }
    }
  ],
  crypto: [
    {
      id: 'hyperliquid:@212|polymarket:0x91c4aa08',
      title: 'Bitcoin above $150k on Dec 31',
      category: 'crypto',
      legs: [
        {
          venue: 'polymarket',
          market_id: '0x91c4aa08',
          outcome_id: '83726190',
          url: 'https://polymarket.com/event/bitcoin-150k-2026',
          volume_24h: '412876.2',
          resolution_date: '2027-01-01T00:00:00Z'
        },
        { venue: 'hyperliquid', market_id: '@212', outcome_id: '#212' }
      ],
      venue_prices: [
        { venue: 'polymarket', best_ask: '0.41', best_bid: '0.40' },
        { venue: 'hyperliquid', best_ask: '0.43', best_bid: '0.39' }
      ],
      book: {
        bids: [
          { price: '0.40', size: '8800', venue: 'polymarket' },
          { price: '0.39', size: '4100', venue: 'hyperliquid' }
        ],
        asks: [
          { price: '0.41', size: '6200', venue: 'polymarket' },
          { price: '0.43', size: '2900', venue: 'hyperliquid' }
        ],
        best_bid: '0.40',
        best_ask: '0.41'
      }
    },
    {
      id: 'polymarket:0x5e77b3c2',
      title: 'ETH flips BTC market cap this decade',
      category: 'crypto',
      legs: [
        {
          venue: 'polymarket',
          market_id: '0x5e77b3c2',
          outcome_id: '61054433',
          url: 'https://polymarket.com/event/eth-flips-btc',
          volume_24h: '15320.8',
          resolution_date: '2030-01-01T00:00:00Z'
        }
      ],
      venue_prices: [
        { venue: 'polymarket', best_ask: '0.07', best_bid: '0.06' }
      ],
      book: {
        bids: [{ price: '0.06', size: '12000', venue: 'polymarket' }],
        asks: [{ price: '0.07', size: '9500', venue: 'polymarket' }],
        best_bid: '0.06',
        best_ask: '0.07'
      }
    }
  ],
  macro: [
    {
      id: 'kalshi:KXFEDCUT|polymarket:0x33d90f15',
      title: 'Fed cuts rates at the next FOMC meeting',
      category: 'macro',
      legs: [
        {
          venue: 'polymarket',
          market_id: '0x33d90f15',
          outcome_id: '90211675',
          url: 'https://polymarket.com/event/fed-cut-next-fomc',
          volume_24h: '287554.1',
          resolution_date: '2026-09-17T18:00:00Z'
        },
        { venue: 'kalshi', market_id: 'KXFEDCUT', outcome_id: 'KXFEDCUT-YES' }
      ],
      venue_prices: [
        { venue: 'polymarket', best_ask: '0.72', best_bid: '0.71' },
        { venue: 'kalshi', best_ask: '0.74', best_bid: '0.70' }
      ],
      book: {
        bids: [
          { price: '0.71', size: '10400', venue: 'polymarket' },
          { price: '0.70', size: '5600', venue: 'kalshi' }
        ],
        asks: [
          { price: '0.72', size: '7700', venue: 'polymarket' },
          { price: '0.74', size: '3900', venue: 'kalshi' }
        ],
        best_bid: '0.71',
        best_ask: '0.72'
      }
    }
  ],
  politics: [
    {
      id: 'kalshi:KXPRES28|polymarket:0xa10c44d9',
      title: 'Incumbent party wins 2028 US election',
      category: 'politics',
      legs: [
        {
          venue: 'polymarket',
          market_id: '0xa10c44d9',
          outcome_id: '47700912',
          url: 'https://polymarket.com/event/2028-us-election',
          volume_24h: '731209.9',
          resolution_date: '2028-11-08T05:00:00Z'
        },
        { venue: 'kalshi', market_id: 'KXPRES28', outcome_id: 'KXPRES28-YES' }
      ],
      venue_prices: [
        { venue: 'polymarket', best_ask: '0.52', best_bid: '0.51' },
        { venue: 'kalshi', best_ask: '0.53', best_bid: '0.50' }
      ],
      book: {
        bids: [
          { price: '0.51', size: '22000', venue: 'polymarket' },
          { price: '0.50', size: '15000', venue: 'kalshi' }
        ],
        asks: [
          { price: '0.52', size: '18000', venue: 'polymarket' },
          { price: '0.53', size: '9000', venue: 'kalshi' }
        ],
        best_bid: '0.51',
        best_ask: '0.52'
      }
    }
  ]
}

export const predictionMarketSampleData: Record<
  PredictionMarketCategory,
  PredictionMarket[]
> = {
  sports: asPredictionMarkets(sampleData.sports),
  crypto: asPredictionMarkets(sampleData.crypto),
  macro: asPredictionMarkets(sampleData.macro),
  politics: asPredictionMarkets(sampleData.politics)
}
