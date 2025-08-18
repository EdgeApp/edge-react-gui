# Simplex Provider vs Ramp Plugin Comparison Report

This document provides a detailed comparison between the legacy `simplexProvider.ts` implementation and the new `simplexRampPlugin.ts` implementation, highlighting key differences and potential inconsistencies.

## 1. Direction Support Differences

### Old Provider (simplexProvider.ts)
- **Buy only**: Strictly enforces buy-only support
- Direction check in `getSupportedAssets`: `if (direction !== 'buy' || regionCode.countryCode === 'GB')`
- Direction check in `getQuote`: `if (direction !== 'buy')`
- Direction check in deeplink handler: `if (link.direction !== 'buy') return`

### New Plugin (simplexRampPlugin.ts)
- **Buy only**: Same restriction but implemented differently
- Separate validation function: `validateDirection(direction: 'buy' | 'sell'): boolean`
- Consistent checks in both `checkSupport` and `fetchQuote`
- Same deeplink handler check: `if (link.direction !== 'buy') return`

**Consistency**: ✅ Both implementations only support 'buy' direction

## 2. Region/Country Validation Differences

### Old Provider (simplexProvider.ts)
- **GB restriction**: Combined with direction check: `if (direction !== 'buy' || regionCode.countryCode === 'GB')`
- **Daily check**: Uses `isDailyCheckDue(lastChecked)` for 24-hour caching
- **Storage**: Uses module-level variables for caching
- **Validation**: Direct `validateExactRegion` call in `getSupportedAssets` and `getQuote`

### New Plugin (simplexRampPlugin.ts)
- **GB restriction**: Separate check in `validateRegion`: `if (regionCode.countryCode === 'GB') return false`
- **TTL-based caching**: Uses 2-minute TTL (`PROVIDER_CONFIG_TTL_MS = 2 * 60 * 1000`)
- **Storage**: Uses instance-level `providerConfig` with `lastUpdated` timestamp
- **Validation**: Wrapped in try-catch for better error handling

**Inconsistency**: ⚠️ Caching duration differs significantly (24 hours vs 2 minutes)

## 3. Fiat Currency Support Differences

### Old Provider (simplexProvider.ts)
- **Format**: Stores with 'iso:' prefix: `allowedCurrencyCodes.fiat['iso:' + fc.ticker_symbol] = fc`
- **API endpoint**: `https://api.simplexcc.com/v2/supported_fiat_currencies`
- **Storage**: Global `allowedCurrencyCodes` object

### New Plugin (simplexRampPlugin.ts)
- **Format**: Same 'iso:' prefix: `newConfig.fiat['iso:' + fc.ticker_symbol] = fc`
- **API endpoint**: Same URL via constant `SIMPLEX_API_URL`
- **Validation**: Adds 'iso:' prefix during validation: `validateFiat('iso:${fiatAsset.currencyCode}')`

**Consistency**: ✅ Both use the same fiat currency format and API

## 4. Crypto Currency Support Differences

### Old Provider (simplexProvider.ts)
- **Token support**: Uses `getTokenId` to check token validity
- **Storage**: Adds tokens with `addTokenToArray({ tokenId }, tokens)`
- **Validation**: Implicit through presence in `allowedCurrencyCodes`

### New Plugin (simplexRampPlugin.ts)
- **Token support**: Only supports native currencies (tokenId === null)
- **Storage**: Adds with `addTokenToArray({ tokenId: null }, tokens)`
- **Validation**: Explicit check: `if (cryptoAsset.tokenId === null)`
- **Error handling**: Returns `{ supported: false }` for tokens

**Inconsistency**: ⚠️ New plugin explicitly rejects tokens while old provider could support them

## 5. Payment Type Support Differences

### Old Provider (simplexProvider.ts)
- **Supported types**: `applepay: true, credit: true, googlepay: true`
- **Validation**: Checks array of payment types
- **Error**: Throws `FiatProviderError` with `errorType: 'paymentUnsupported'`

### New Plugin (simplexRampPlugin.ts)
- **Supported types**: Defined in types file with same values
- **Quote response**: Always returns `paymentType: 'credit'` in quotes
- **No validation**: Doesn't validate payment types in `checkSupport` or `fetchQuote`

**Inconsistency**: ⚠️ New plugin doesn't validate payment types and always returns 'credit'

## 6. Quote Workflow Differences

### Old Provider (simplexProvider.ts)
- **JWT endpoint**: `v1/jwtSign/simplex` for quote JWT
- **Quote URL**: `https://partners.simplex.com/api/quote?partner=${partner}&t=${token}`
- **Expiration**: 8 seconds (`Date.now() + 8000`)
- **Multiple payment type checks**: Validates payment types twice

### New Plugin (simplexRampPlugin.ts)
- **JWT endpoint**: Same endpoint via centralized function
- **Quote URL**: Same URL structure
- **Expiration**: Same 8 seconds
- **Settlement range**: Adds new feature: `10-60 minutes`

**Enhancement**: ✅ New plugin adds settlement range information

## 7. Error Handling Differences

### Old Provider (simplexProvider.ts)
- **Network errors**: Uses `.catch(e => undefined)` pattern
- **Generic errors**: Throws `new Error('Simplex unknown error')`
- **Toast messages**: Uses `NOT_SUCCESS_TOAST_HIDE_MS` constant

### New Plugin (simplexRampPlugin.ts)
- **Network errors**: More explicit error logging
- **Error propagation**: Re-throws `FiatProviderError` instances
- **Toast messages**: Direct `showToast` calls with same timeout

**Improvement**: ✅ New plugin has better error logging and handling

## 8. API Endpoint Differences

### Old Provider (simplexProvider.ts)
- **Hardcoded URLs**: Direct string literals in code
- **JWT endpoint**: `v1/jwtSign/${jwtTokenProvider}` for approval

### New Plugin (simplexRampPlugin.ts)
- **Centralized URLs**: Constants in types file
- **Same endpoints**: Uses identical API URLs
- **Better organization**: All URLs in one place

**Improvement**: ✅ New plugin has better URL management

## Key Inconsistencies Summary

1. **Caching Duration**: 24 hours vs 2 minutes - This could impact API rate limits
2. **Token Support**: Old supports tokens, new explicitly rejects them
3. **Payment Type Validation**: New plugin doesn't validate payment types
4. **WebView Handling**: New uses platform-specific libraries (SafariView/CustomTabs)
5. **User ID Generation**: Different fallback patterns when makeUuid unavailable

## Recommendations

1. **Align caching duration**: Consider if 2-minute TTL is too aggressive
2. **Clarify token support**: Document why tokens are not supported in new plugin
3. **Add payment type validation**: Implement validation in checkSupport/fetchQuote
4. **Document behavior changes**: Create migration guide for these differences
5. **Test edge cases**: Verify behavior when makeUuid is unavailable
