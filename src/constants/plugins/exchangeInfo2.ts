import { asArray, asBoolean, asEither, asNumber, asObject, asOptional, asUnknown, asString } from 'cleaners'
import { asEdgeTokenId } from '../../types/types'

// Cleaner for provider priority mapping
const asProviderPriority = asObject(asObject(asNumber))

// Cleaner for disable assets mapping - can be boolean or array of strings
const asDisableAssets = asObject(asEither(asBoolean, asArray(asEdgeTokenId)))

// Cleaner for disable providers mapping - can be boolean or object with asset-specific settings
const asDisableProviders = asObject(asEither(asBoolean, asObject(asEither(asBoolean, asArray(asEdgeTokenId)))))

// Cleaner for provider info (like thorchain midgard servers)
const asProviderInfo = asObject(asUnknown)

// Cleaner for disable regions - array of region objects with country code and optional state/province restrictions
const asDisableRegion = asObject({
  countryCode: asString,
  stateProvinces: asOptional(asArray(asString), () => []),
  disableProviders: asOptional(asDisableProviders, () => ({}))
})

// Cleaner for buy/sell section
const asBuySellSection = asObject({
  providerPriority: asOptional(asProviderPriority, () => ({})),
  disableAssets: asOptional(asDisableAssets, () => ({})),
  disableProviders: asOptional(asDisableProviders, () => ({})),
  disableRegions: asOptional(asArray(asDisableRegion), () => [])
})

// Cleaner for swap section
const asSwapSection = asObject({
  providerInfo: asOptional(asObject(asProviderInfo), () => ({})),
  providerPriority: asOptional(asProviderPriority, () => ({})),
  disableProviders: asOptional(asDisableProviders, () => ({})),
  disableAssets: asOptional(asDisableAssets, () => ({}))
})

// Main cleaner for exchangeInfo2
export const asExchangeInfo2 = asObject({
  exchangeInfo2: asObject({
    buy: asOptional(asBuySellSection, () => ({
      providerPriority: {},
      disableAssets: {},
      disableProviders: {},
      disableRegions: []
    })),
    sell: asOptional(asBuySellSection, () => ({
      providerPriority: {},
      disableAssets: {},
      disableProviders: {},
      disableRegions: []
    })),
    swap: asOptional(asSwapSection, () => ({
      providerInfo: {},
      providerPriority: {},
      disableProviders: {},
      disableAssets: {}
    }))
  })
})

export type ExchangeInfo2 = ReturnType<typeof asExchangeInfo2>
