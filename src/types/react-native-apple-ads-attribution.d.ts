declare module 'react-native-apple-ads-attribution' {
  export interface AttributionData {
    keywordId?: string
    campaignId?: string
    adGroupId?: string
    [key: string]: any
  }

  const AppleAdsAttributionInstance: {
    getAttributionData: () => Promise<AttributionData>
  }

  export default AppleAdsAttributionInstance
}
