import { asNumber, asObject, asOptional } from 'cleaners'

export const asAppleAdsAttribution = asObject({
  campaignId: asOptional(asNumber),
  keywordId: asOptional(asNumber)
})

export type AppleAdsAttribution = ReturnType<typeof asAppleAdsAttribution>
