import { asArray, asNumber, asObject, asOptional, asString } from 'cleaners'

export const asCoinRankingDataPercentChange = asObject({
  hours1: asNumber,
  hours24: asNumber,
  days7: asNumber,
  days30: asNumber,
  year1: asNumber
})

export const asCoinRankingData = asObject({
  allTimeHigh: asOptional(asNumber),
  allTimeHighDate: asOptional(asString),
  allTimeLow: asOptional(asNumber),
  allTimeLowDate: asOptional(asString),
  assetId: asString,
  circulatingSupply: asOptional(asNumber),
  currencyCode: asString,
  currencyName: asString,
  high24h: asOptional(asNumber),
  imageUrl: asString,
  low24h: asOptional(asNumber),
  marketCap: asNumber,
  marketCapChange24h: asOptional(asNumber),
  marketCapChangePercent24h: asOptional(asNumber),
  maxSupply: asOptional(asNumber),
  percentChange: asCoinRankingDataPercentChange,
  price: asNumber,
  priceChange24h: asOptional(asNumber),
  priceChangePercent24h: asOptional(asNumber),
  rank: asNumber,
  totalSupply: asOptional(asNumber),
  volume24h: asNumber
})

export const asCoinranking = asObject({
  data: asArray(asCoinRankingData)
})

export interface CoinRanking {
  coinRankingDatas: CoinRankingData[]
}

export type CoinRankingData = ReturnType<typeof asCoinRankingData>
export type CoinRankingDataPercentChange = ReturnType<typeof asCoinRankingDataPercentChange>

export type PercentChangeTimeFrame = 'hours1' | 'hours24' | 'days7' | 'days30' | 'year1'
export type AssetSubText = 'marketCap' | 'volume24h'
