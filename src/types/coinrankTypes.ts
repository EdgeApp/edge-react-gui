import { asArray, asNumber, asObject, asString } from 'cleaners'

export const asCoinRow = asObject({
  currencyCode: asString,
  currencyName: asString,
  imageUrl: asString,
  marketCap: asNumber,
  price: asNumber,
  percentChange: asObject({
    hours1: asNumber,
    hours24: asNumber,
    days7: asNumber,
    days30: asNumber,
    year1: asNumber
  }),
  rank: asNumber,
  volume24h: asNumber
})
export const asCoinrankings = asObject({
  data: asArray(asCoinRow)
})
export interface CoinRankingParams {}

export interface CoinRowData {
  coinRankings: CoinRow[]
}
export type CoinRow = ReturnType<typeof asCoinRow>

export type PercentChangeTimeFrame = 'hours1' | 'hours24' | 'days7' | 'days30' | 'year1'
export type AssetSubText = 'marketCap' | 'volume24h'
