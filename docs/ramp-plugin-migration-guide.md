# Ramp Plugin Migration Guide

This document describes how to migrate ramp plugins from the legacy fiat provider architecture to the new ramp plugin architecture, removing the `showUi` dependency and using direct API access instead.

## Overview

The `FiatPluginUi` interface wraps many different APIs and services. To improve code clarity and reduce abstraction, ramp plugins should directly import and use the specific services they need.

## Migration Map

### Toast & Error Messages

**Before:**

```typescript
await showUi.showToast(message)
await showUi.showError(error)
await showUi.showToastSpinner(message, promise)
```

**After:**

```typescript
import {
  showToast,
  showError,
  showToastSpinner
} from '../../../components/services/AirshipInstance'

showToast(message)
showError(error)
await showToastSpinner(message, promise)
```

### Modals

**Before:**

```typescript
await showUi.buttonModal({ buttons, title, message })
await showUi.listModal(params)
```

**After:**

```typescript
import { Airship } from '../../../components/services/AirshipInstance'
import { ButtonsModal } from '../../../components/modals/ButtonsModal'
import { RadioListModal } from '../../../components/modals/RadioListModal'

await Airship.show(bridge => (
  <ButtonsModal
    bridge={bridge}
    buttons={buttons}
    title={title}
    message={message}
  />
))

await Airship.show(bridge => <RadioListModal bridge={bridge} {...params} />)
```

### Navigation

**Before:**

```typescript
showUi.enterAmount(params)
showUi.openWebView(params)
showUi.exitScene()
```

**After:**

```typescript
// Use the navigation prop from RampApproveQuoteParams
navigation.navigate('guiPluginEnterAmount', params)
navigation.navigate('guiPluginWebView', params)
navigation.pop()
```

### External WebView & Deeplinks

**Before:**

```typescript
await showUi.openExternalWebView({
  url,
  providerId,
  deeplinkHandler: async (link) => { ... }
})
```

**After:**

```typescript
import { Platform, Linking } from 'react-native'
import SafariView from 'react-native-safari-view'
import { CustomTabs } from 'react-native-custom-tabs'
import {
  registerRampDeeplinkHandler,
  unregisterRampDeeplinkHandler
} from '../rampDeeplinkHandler'

// Register handler
registerRampDeeplinkHandler(direction, providerId, deeplinkHandler)

// Open external webview
if (redirectExternal) {
  await Linking.openURL(url)
} else if (Platform.OS === 'ios') {
  await SafariView.show({ url })
} else {
  await CustomTabs.openURL(url)
}

// Cleanup when done
unregisterRampDeeplinkHandler()
```

### Permissions

**Before:**

```typescript
const success = await showUi.requestPermission(['camera'], displayName, true)
if (!success) {
  // Permission was denied
  await showUi.showToast(lstrings.fiat_plugin_cannot_continue_camera_permission)
}
```

**After:**

```typescript
import { requestPermissionOnSettings } from '../../../components/services/PermissionsManager'

const deniedPermission = await requestPermissionOnSettings(
  disklet,
  'camera',
  displayName,
  true
)
if (deniedPermission) {
  // Permission was denied
  showToast(lstrings.fiat_plugin_cannot_continue_camera_permission)
  return
}
```

**⚠️ IMPORTANT: Boolean Logic Inversion**

The `showUi.requestPermission` function returns `true` when permission is **granted** and `false` when **denied**.

The `requestPermissionOnSettings` function returns `true` when permission is **denied** and `false` when **granted**.

This inverted boolean logic must be handled correctly during migration to avoid incorrect permission handling.

### Wallet Operations

**Before:**

```typescript
await showUi.send(sendParams)
await showUi.saveTxMetadata(params)
await showUi.saveTxAction(params)
```

**After:**

```typescript
// For send, navigate to send scene
navigation.navigate('send2', {
  ...sendParams,
  onDone: (error, tx) => { ... },
  onBack: () => { ... }
})

// For tx operations, use the wallet directly
await wallet.saveTxMetadata({ txid, tokenId, metadata })
await wallet.saveTxAction({ txid, tokenId, assetAction, savedAction })
```

### Analytics

**Before:**

```typescript
await showUi.trackConversion(event, opts)
```

**After:**

```typescript
// Use the onLogEvent prop from RampApproveQuoteParams
onLogEvent(event, opts)
```

### Utilities

**Before:**

```typescript
await showUi.setClipboard(value)
await showUi.waitForAnimationFrame()
```

**After:**

```typescript
import Clipboard from '@react-native-clipboard/clipboard'

Clipboard.setString(value)
await new Promise(resolve => requestAnimationFrame(resolve))
```

## RampApproveQuoteParams Interface

The updated interface provides direct access to needed dependencies:

```typescript
export interface RampApproveQuoteParams {
  coreWallet: EdgeCurrencyWallet
  account: EdgeAccount
  navigation: NavigationBase
  onLogEvent: OnLogEvent
  disklet: Disklet
}
```

## Implementation Notes

1. **Import statements**: Add necessary imports at the top of the plugin file
2. **Permission boolean logic**: Pay special attention to the inverted boolean logic for `requestPermissionOnSettings`
3. **Error handling**: Ensure proper error handling when using direct APIs
4. **Cleanup**: Remember to unregister deeplink handlers when appropriate
5. **Testing**: Test all flows thoroughly after migration, especially permission flows
6. **Type safety**: Use proper TypeScript types for all imported functions

## Environment Configuration

When creating a new ramp plugin, you must properly configure the plugin's initialization options to ensure type safety and centralized configuration management. This involves three steps:

### 1. Create Init Options Cleaner

In your plugin's types file (e.g., `moonpayRampTypes.ts`), create an `asInitOptions` cleaner that validates the structure of your plugin's initialization options:

```typescript
// Init options cleaner for moonpay ramp plugin
export const asInitOptions = asString // For simple API key

// For more complex init options:
export const asInitOptions = asObject({
  apiKey: asString,
  environment: asOptional(asValue('production', 'sandbox'), 'production'),
  webhookUrl: asOptional(asString)
})
```

The cleaner should match the expected initialization options structure for your specific plugin.

### 2. Use Cleaner in Plugin Factory

In your plugin factory function (e.g., `moonpayRampPlugin.ts`), import and use the cleaner to validate the `initOptions` parameter:

```typescript
import { asInitOptions } from './moonpayRampTypes'

export const moonpayRampPlugin: RampPluginFactory = {
  pluginId: 'moonpay',
  storeId: 'com.moonpay',
  displayName: 'Moonpay',

  create: async (params: RampPluginFactoryParams): Promise<RampPlugin> => {
    const { initOptions } = params

    // Validate and extract init options
    const apiKey = asInitOptions(initOptions)

    // Use the validated options in your plugin
    // ...
  }
}
```

### 3. Register in envConfig

Add an entry to `RAMP_PLUGIN_INITS` in `src/envConfig.ts` that uses your cleaner. Import with an alias to avoid naming conflicts:

```typescript
import { asInitOptions as asMoonpayInitOptions } from './plugins/ramps/moonpay/moonpayRampTypes'
import { asInitOptions as asPaybisInitOptions } from './plugins/ramps/paybis/paybisRampTypes'

export const ENV_CONFIG = makeConfig(
  asObject({
    // ... other config
    RAMP_PLUGIN_INITS: asOptional(
      asObject<Record<string, unknown>>({
        moonpay: asOptional(asMoonpayInitOptions),
        paybis: asOptional(asPaybisInitOptions)
        // Add your plugin here with its cleaner
      })
    )
  })
)
```

### Why This Is Required

- **Type Safety**: Ensures initialization options are properly typed and validated at runtime
- **Centralized Configuration**: All plugin configurations are managed in one place (`envConfig.ts`)
- **Environment Management**: Allows different configurations for development, staging, and production
- **Error Prevention**: Catches configuration errors early with clear error messages

### Complete Example: Moonpay Plugin

Here's how the Moonpay plugin implements environment configuration:

**1. In `moonpayRampTypes.ts`:**

```typescript
import { asString } from 'cleaners'

// Simple string cleaner for API key
export const asInitOptions = asString
```

**2. In `moonpayRampPlugin.ts`:**

```typescript
import { asInitOptions } from './moonpayRampTypes'

export const moonpayRampPlugin: RampPluginFactory = {
  // ... plugin metadata

  create: async (params: RampPluginFactoryParams): Promise<RampPlugin> => {
    const { initOptions } = params
    const apiKey = asInitOptions(initOptions)

    // Now apiKey is guaranteed to be a string
    const client = new MoonpayClient({ apiKey })
    // ...
  }
}
```

**3. In `envConfig.ts`:**

```typescript
import { asInitOptions as asMoonpayInitOptions } from './plugins/ramps/moonpay/moonpayRampTypes'

// In the ENV_CONFIG:
RAMP_PLUGIN_INITS: asOptional(
  asObject<Record<string, unknown>>({
    moonpay: asOptional(asMoonpayInitOptions)
    // Other plugins...
  })
)
```

This setup ensures that when the app loads plugin configurations from environment variables or config files, they are properly validated before being passed to the plugin factories.

## Complete Migration Example

Here's a comparison showing a typical permission request migration:

**Legacy Provider (paybisProvider.ts):**

```typescript
const success = await showUi.requestPermission(
  ['camera'],
  pluginDisplayName,
  true
)
if (!success) {
  await showUi.showToast(lstrings.fiat_plugin_cannot_continue_camera_permission)
}
```

**New Ramp Plugin (paybisRampPlugin.ts):**

```typescript
const deniedPermission = await requestPermissionOnSettings(
  disklet,
  'camera',
  pluginDisplayName,
  true
)
if (deniedPermission) {
  showToast(lstrings.fiat_plugin_cannot_continue_camera_permission)
  return
}
```

Note the inverted boolean logic: `!success` becomes `deniedPermission`.

## New Features in Ramp Plugin Architecture

### Settlement Range

The new ramp plugin architecture introduces a `settlementRange` field in quote results that provides users with transparency about transaction completion times. This feature was not available in the legacy provider architecture.

#### Interface

The `settlementRange` field uses the following structure:

```typescript
interface SettlementRange {
  min: {
    value: number
    unit: 'minutes' | 'hours' | 'days'
  }
  max: {
    value: number
    unit: 'minutes' | 'hours' | 'days'
  }
}
```

#### Purpose

This field helps users understand when they can expect their transaction to complete, improving the user experience by setting clear expectations for settlement times.

#### Example Implementation

Here's an example of how to include settlement range in your ramp plugin's quote response:

```typescript
// Example from Simplex plugin
const quote: RampQuote = {
  pluginId: 'simplex',
  direction: 'buy',
  fiatAmount: 100,
  cryptoAmount: 0.0025,
  // ... other quote fields
  settlementRange: {
    min: { value: 10, unit: 'minutes' },
    max: { value: 60, unit: 'minutes' }
  }
}
```

This example indicates that the transaction will typically complete between 10 and 60 minutes.

#### Migration Note

When migrating from the legacy provider architecture, you'll need to:
1. Add the `settlementRange` field to your quote responses
2. Map provider-specific settlement time data to the standardized format
3. Use reasonable defaults if the provider doesn't supply exact settlement times

The settlement range feature enhances user trust and reduces support inquiries by providing upfront visibility into transaction processing times.

## Replacing getSupportedAssets with checkSupport

The ramp plugin architecture has been simplified by replacing the `getSupportedAssets` method with a simpler `checkSupport` method. The new `checkSupport` method serves the same purpose of validating whether a plugin supports a specific request, but with a simpler interface.

### Migration Steps

1. **Replace `getSupportedAssets` method with `checkSupport` method**
2. **Extract validation logic into reusable helper functions**
3. **Have `checkSupport` return `{ supported: true/false }` instead of asset maps**
4. **Include ALL `checkSupport` logic as guards in `fetchQuote`**
5. **Different error handling**:
   - `checkSupport`: Never throws, returns `{ supported: false }` for any validation failure
   - `fetchQuote`: Throws errors when support checks fail or for API/network errors

### Important: Guard Logic Must Be Duplicated

**ALL validation logic from `checkSupport` MUST be included as guards in `fetchQuote`.** This is a critical architectural requirement. The `checkSupport` method is called by the UI to filter available plugins, but `fetchQuote` can still be called directly and must enforce the same validation rules.

#### Error Handling Differences

The two methods handle validation failures differently:

- **`checkSupport`**: NEVER throws errors. Always returns `{ supported: false }` for any validation failure
- **`fetchQuote`**: SHOULD throw `FiatProviderError` when validation fails, allowing the UI to handle and display appropriate error messages

This difference exists because:

- `checkSupport` is used for filtering and should fail silently
- `fetchQuote` is used for actual operations and should provide clear error feedback

#### Using FiatProviderError

When throwing errors from `fetchQuote`, always use `FiatProviderError` with the appropriate error type:

```typescript
import { FiatProviderError } from '../gui/fiatProviderTypes'

// Asset not supported
throw new FiatProviderError({
  providerId: pluginId,
  errorType: 'assetUnsupported'
})

// Payment method not supported
throw new FiatProviderError({
  providerId: pluginId,
  errorType: 'paymentUnsupported'
})

// Region restricted
throw new FiatProviderError({
  providerId: pluginId,
  errorType: 'regionRestricted',
  displayCurrencyCode: request.displayCurrencyCode
})

// Fiat currency not supported
throw new FiatProviderError({
  providerId: pluginId,
  errorType: 'fiatUnsupported',
  fiatCurrencyCode: request.fiatCurrencyCode,
  paymentMethod: 'credit',
  pluginDisplayName: 'Plugin Name'
})

// Over limit
throw new FiatProviderError({
  providerId: pluginId,
  errorType: 'overLimit',
  errorAmount: 10000,
  displayCurrencyCode: 'USD'
})

// Under limit
throw new FiatProviderError({
  providerId: pluginId,
  errorType: 'underLimit',
  errorAmount: 10,
  displayCurrencyCode: 'USD'
})
```

### Important: Migrating Provider Initialization Logic

When migrating from the legacy provider architecture, the initialization logic that `getSupportedAssets` performed (fetching supported assets, countries, payment methods, etc.) should be preserved but moved to an internal `fetchProviderConfig` function with caching.

#### Implementation Pattern

**1. Create a cache structure with TTL:**

```typescript
interface ProviderConfigCache {
  data: ProviderConfig | null
  timestamp: number
}

const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes
let configCache: ProviderConfigCache = {
  data: null,
  timestamp: 0
}
```

**2. Implement `fetchProviderConfig` as an internal function:**

```typescript
async function fetchProviderConfig(): Promise<ProviderConfig> {
  const now = Date.now()

  // Check if cache is valid
  if (configCache.data && now - configCache.timestamp < CACHE_TTL_MS) {
    return configCache.data
  }

  // Fetch fresh configuration
  const config = await fetchProviderConfigFromAPI()

  // Update cache
  configCache = {
    data: config,
    timestamp: now
  }

  return config
}
```

**3. Call `fetchProviderConfig` from within `fetchQuote`:**

```typescript
fetchQuote: async request => {
  try {
    // Fetch provider configuration (will use cache if valid)
    const providerConfig = await fetchProviderConfig()

    // Use the config to validate the request
    const { supportedAssets, supportedCountries, paymentMethods } =
      providerConfig

    // Validate region
    if (!supportedCountries.includes(request.regionCode.countryCode)) {
      return [] // Return empty array for unsupported regions
    }

    // Check if assets are supported
    if (!isAssetSupported(request, supportedAssets)) {
      return [] // Return empty array for unsupported assets
    }

    // Proceed with quote fetching...
  } catch (error) {
    // Only throw for actual API/network failures
    throw error
  }
}
```

#### Key Benefits of This Pattern

1. **Preserves initialization logic**: The same workflow that `getSupportedAssets` performed is maintained
2. **Efficient caching**: Provider configuration is cached for 2 minutes to reduce API calls
3. **Automatic refresh**: Cache automatically refreshes when TTL expires
4. **Internal implementation**: Configuration fetching is an implementation detail, not exposed in the plugin interface
5. **Consistent state**: All quote requests use the same provider configuration within the cache window

### Example Migration

**Before (Legacy Provider):**

```typescript
getSupportedAssets: async (request) => {
  const { direction, paymentTypes, regionCode } = request

  // Fetch provider configuration
  const config = await api.getConfiguration()

  // Initialize provider state
  const supportedAssets = config.assets
  const supportedCountries = config.countries

  // Validate region
  validateRegion(pluginId, regionCode, supportedCountries)

  // Check country restrictions
  if (regionCode.countryCode === 'GB') {
    throw new FiatProviderError({ errorType: 'assetUnsupported' })
  }

  // Return supported assets
  return supportedAssets
},

fetchQuote: async (request) => {
  // Fetch quotes...
}
```

**After (Ramp Plugin with Internal Config):**

```typescript
// Internal cache structure
interface ConfigCache {
  data: {
    assets: AssetMap
    countries: string[]
    paymentMethods: PaymentMethod[]
  } | null
  timestamp: number
}

const CACHE_TTL_MS = 2 * 60 * 1000
let configCache: ConfigCache = { data: null, timestamp: 0 }

// Internal function to fetch provider configuration
async function fetchProviderConfig() {
  const now = Date.now()

  // Return cached data if still valid
  if (configCache.data && now - configCache.timestamp < CACHE_TTL_MS) {
    return configCache.data
  }

  // Fetch fresh configuration from API
  const config = await api.getConfiguration()

  // Update cache
  configCache = {
    data: {
      assets: config.assets,
      countries: config.countries,
      paymentMethods: config.paymentMethods
    },
    timestamp: now
  }

  return configCache.data
}

fetchQuote: async request => {
  const { regionCode, direction } = request

  try {
    // Get provider configuration (cached or fresh)
    const config = await fetchProviderConfig()

    // Validate region using cached config
    if (!config.countries.includes(regionCode.countryCode)) {
      return [] // Return empty array for unsupported regions
    }

    // Check country restrictions
    if (regionCode.countryCode === 'GB') {
      return [] // Return empty array for unsupported countries
    }

    // Check if assets are supported using cached config
    if (!isAssetSupported(request, config.assets)) {
      return [] // Return empty array for unsupported assets
    }

    // Proceed with quote fetching...
  } catch (error) {
    // Only throw for actual API/network failures
    console.error('Failed to fetch provider config:', error)
    throw error
  }
}
```

### UI Integration

The UI no longer needs a separate hook to check plugin support. Instead, it passes all plugins to `useRampQuotes`:

**Before:**

```typescript
import { useSupportedPlugins } from '../../hooks/useSupportedPlugins'

const { data: supportedPlugins } = useSupportedPlugins({ ... })
const quotes = useRampQuotes({ plugins: supportedPlugins })
```

**After:**

```typescript
const rampPlugins = useSelector(state => state.rampPlugins.plugins)
const quotes = useRampQuotes({ plugins: rampPlugins })
```

### Benefits of the New Architecture

1. **Simpler Interface**: `checkSupport` returns a simple boolean response instead of complex asset maps
2. **Focused Purpose**: Clear separation between support checking (`checkSupport`) and quote fetching (`fetchQuote`)
3. **Better Performance**: Lightweight support checks can be done quickly without fetching full asset configurations
4. **Cleaner Code**: Less data transformation and simpler return types
5. **Easier Plugin Development**: Clear distinction between validation and business logic

## checkSupport Method - Replacement for getSupportedAssets

The new ramp plugin architecture replaces `getSupportedAssets` with a simpler `checkSupport` method that validates whether a specific request is supported.

### Purpose of checkSupport vs getSupportedAssets

The old `getSupportedAssets` method served two purposes:

1. Initializing provider configuration (supported assets, countries, payment methods)
2. Returning a complete asset map for the UI to filter

The new `checkSupport` method has a single, focused purpose:

- Validate whether a specific buy/sell request is supported by the plugin

Key differences:

- **No payment types needed**: The request doesn't include payment types
- **Boolean response**: Simply returns `{ supported: true/false }`
- **No asset maps**: Doesn't return full asset configuration
- **Faster checks**: Can return early without fetching full provider config if basic validation fails

### Extracting Validation Logic

When migrating from `getSupportedAssets` to `checkSupport`, extract the validation logic into reusable helper functions that can be shared between `checkSupport` and `fetchQuote`.

### Implementation Pattern

**1. Create internal helper functions for validation:**

```typescript
// Internal helper to validate the support request
function validateSupportRequest(request: CheckSupportRequest): void {
  const { direction, paymentMethods, regionCode } = request

  // Basic validation
  if (!['buy', 'sell'].includes(direction)) {
    throw new Error(`Invalid direction: ${direction}`)
  }

  if (!regionCode.countryCode) {
    throw new Error('Country code is required')
  }

  // Validate payment methods if provided
  if (paymentMethods && paymentMethods.length === 0) {
    throw new Error('At least one payment method must be specified')
  }
}

// Internal helper to check if assets are supported
async function checkAssetSupport(
  request: CheckSupportRequest,
  providerConfig: ProviderConfig
): Promise<boolean> {
  const { fiatCurrencyCode, tokenId, direction, regionCode } = request
  const { supportedAssets, blockedCountries } = providerConfig

  // Check country restrictions
  if (blockedCountries.includes(regionCode.countryCode)) {
    return false
  }

  // Check if the asset pair is supported
  const assetKey = `${direction}:${fiatCurrencyCode}:${tokenId}`
  return supportedAssets.has(assetKey)
}

// Internal helper to check payment method support
function checkPaymentMethodSupport(
  request: CheckSupportRequest,
  providerConfig: ProviderConfig
): boolean {
  const { paymentMethods, direction } = request

  // If no payment methods specified, assume all are acceptable
  if (!paymentMethods || paymentMethods.length === 0) {
    return true
  }

  // Check if at least one requested payment method is supported
  const supportedMethods = providerConfig.paymentMethods[direction] || []
  return paymentMethods.some(method => supportedMethods.includes(method))
}
```

**2. Implement checkSupport using the helper functions:**

```typescript
checkSupport: async (
  request: CheckSupportRequest
): Promise<CheckSupportResponse> => {
  try {
    // Validate the request structure
    validateSupportRequest(request)

    // Quick checks before fetching provider config
    const { regionCode, fiatCurrencyCode } = request

    // Example: Early return for known unsupported regions
    if (UNSUPPORTED_REGIONS.includes(regionCode.countryCode)) {
      return { supported: false }
    }

    // Example: Early return for known unsupported currencies
    if (!SUPPORTED_FIAT_CODES.includes(fiatCurrencyCode)) {
      return { supported: false }
    }

    // Fetch provider configuration (with caching)
    const providerConfig = await fetchProviderConfig()

    // Check asset support
    const assetSupported = await checkAssetSupport(request, providerConfig)
    if (!assetSupported) {
      return { supported: false }
    }

    // Check payment method support
    const paymentSupported = checkPaymentMethodSupport(request, providerConfig)
    if (!paymentSupported) {
      return { supported: false }
    }

    // All checks passed
    return { supported: true }
  } catch (error) {
    // Important: Return { supported: false } for validation failures
    // Only throw for actual system errors (network issues, etc.)
    if (error instanceof ValidationError) {
      console.warn('Validation failed in checkSupport:', error.message)
      return { supported: false }
    }

    // Rethrow system errors
    console.error('System error in checkSupport:', error)
    throw error
  }
}
```

**3. Reuse the same helpers in fetchQuote with different error handling:**

```typescript
fetchQuote: async (request: FetchQuoteRequest): Promise<RampQuote[]> => {
  // IMPORTANT: Include ALL checkSupport validation logic as guards
  // But throw errors instead of returning empty arrays

  // Use the same validation helper
  validateSupportRequest(request)

  // Fetch provider configuration
  const providerConfig = await fetchProviderConfig()

  // Use the same support checking helpers - but THROW on failure
  const assetSupported = await checkAssetSupport(request, providerConfig)
  if (!assetSupported) {
    throw new FiatProviderError({
      providerId: pluginId,
      errorType: 'assetUnsupported'
    })
  }

  const paymentSupported = checkPaymentMethodSupport(request, providerConfig)
  if (!paymentSupported) {
    throw new FiatProviderError({
      providerId: pluginId,
      errorType: 'paymentUnsupported'
    })
  }

  // Check region support - THROW on failure
  if (!checkRegionSupport(request.regionCode, providerConfig)) {
    throw new FiatProviderError({
      providerId: pluginId,
      errorType: 'regionRestricted',
      displayCurrencyCode: request.displayCurrencyCode
    })
  }

  // Proceed with quote fetching
  const quotes = await fetchQuotesFromAPI(request, providerConfig)

  return quotes.map(quote => ({
    // Map to RampQuote format
    ...quote,
    pluginId,
    direction: request.direction
  }))
}
```

### Complete Example: Moonpay Plugin

Here's a complete example showing how to implement `checkSupport` with proper error handling and shared validation logic:

```typescript
// Example implementation - adapt types to your actual plugin structure
import { FiatProviderError } from '../gui/fiatProviderTypes'

// Constants
const SUPPORTED_FIAT_CODES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
const BLOCKED_REGIONS = ['US-NY', 'US-WA'] // New York and Washington state
const CACHE_TTL_MS = 2 * 60 * 1000

// Cache structure
interface MoonpayConfig {
  supportedAssets: Map<string, AssetInfo>
  blockedCountries: string[]
  paymentMethods: {
    buy: PaymentMethodId[]
    sell: PaymentMethodId[]
  }
}

let configCache: { data: MoonpayConfig | null; timestamp: number } = {
  data: null,
  timestamp: 0
}

// Validation error class
class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Helper: Validate request structure
function validateSupportRequest(request: any): void {
  const { direction, regionCode, fiatCurrencyCode, cryptoAsset } = request

  if (!direction || !['buy', 'sell'].includes(direction)) {
    throw new ValidationError(`Invalid direction: ${direction}`)
  }

  if (!regionCode?.countryCode) {
    throw new ValidationError('Country code is required')
  }

  if (!fiatCurrencyCode) {
    throw new ValidationError('Fiat currency code is required')
  }

  if (!cryptoAsset) {
    throw new ValidationError('Crypto asset is required')
  }
}

// Helper: Check region support
function checkRegionSupport(
  regionCode: { countryCode: string; stateCode?: string },
  config: MoonpayConfig
): boolean {
  // Check blocked countries
  if (config.blockedCountries.includes(regionCode.countryCode)) {
    return false
  }

  // Check blocked regions (state level)
  if (regionCode.stateCode) {
    const regionKey = `${regionCode.countryCode}-${regionCode.stateCode}`
    if (BLOCKED_REGIONS.includes(regionKey)) {
      return false
    }
  }

  return true
}

// Helper: Check asset support
function checkAssetSupport(request: any, config: MoonpayConfig): boolean {
  const { direction, fiatCurrencyCode, cryptoAsset } = request

  // Quick check for supported fiat
  if (!SUPPORTED_FIAT_CODES.includes(fiatCurrencyCode)) {
    return false
  }

  // Check in provider's asset map
  const assetKey = `${direction}:${fiatCurrencyCode}:${cryptoAsset.pluginId}:${cryptoAsset.tokenId}`
  return config.supportedAssets.has(assetKey)
}

// Helper: Check payment method support
function checkPaymentMethodSupport(
  request: any,
  config: MoonpayConfig
): boolean {
  const { paymentTypes, direction } = request

  // If no payment methods specified, consider it supported
  if (!paymentTypes || paymentTypes.length === 0) {
    return true
  }

  // Check if any requested method is supported
  const supportedMethods = config.paymentMethods[direction] || []
  return paymentTypes.some(method => supportedMethods.includes(method))
}

// Helper: Fetch provider configuration with caching
async function fetchProviderConfig(): Promise<MoonpayConfig> {
  const now = Date.now()

  // Return cached data if still valid
  if (configCache.data && now - configCache.timestamp < CACHE_TTL_MS) {
    return configCache.data
  }

  // Fetch fresh configuration
  const response = await moonpayApi.getConfiguration()

  // Transform API response to internal format
  const config: MoonpayConfig = {
    supportedAssets: new Map(
      response.currencies.map(c => [
        `${c.type}:${c.fiatCode}:${c.cryptoCode}`,
        c
      ])
    ),
    blockedCountries: response.blockedCountries,
    paymentMethods: {
      buy: response.buyMethods,
      sell: response.sellMethods
    }
  }

  // Update cache
  configCache = { data: config, timestamp: now }

  return config
}

// Main plugin implementation (simplified example)
export const moonpayRampPlugin = {
  pluginId: 'moonpay',

  checkSupport: async (request: any): Promise<{ supported: boolean }> => {
    try {
      // Step 1: Validate request structure
      validateSupportRequest(request)

      // Step 2: Quick local checks (no API calls)
      if (!SUPPORTED_FIAT_CODES.includes(request.fiatCurrencyCode)) {
        return { supported: false }
      }

      // Step 3: Fetch provider configuration
      const config = await fetchProviderConfig()

      // Step 4: Check region support
      if (!checkRegionSupport(request.regionCode, config)) {
        return { supported: false }
      }

      // Step 5: Check asset support
      if (!checkAssetSupport(request, config)) {
        return { supported: false }
      }

      // Step 6: Check payment method support
      if (!checkPaymentMethodSupport(request, config)) {
        return { supported: false }
      }

      // All checks passed
      return { supported: true }
    } catch (error) {
      // Validation errors = not supported
      if (error instanceof ValidationError) {
        console.warn('checkSupport validation failed:', error.message)
        return { supported: false }
      }

      // Network/API errors should be thrown
      console.error('checkSupport system error:', error)
      throw error
    }
  },

  fetchQuote: async (request: any): Promise<any[]> => {
    // IMPORTANT: Include ALL checkSupport logic as guards
    // But THROW errors instead of returning { supported: false }

    // Reuse the same validation
    validateSupportRequest(request)

    // Reuse the same config fetching
    const config = await fetchProviderConfig()

    // Reuse the same support checks - but THROW FiatProviderError on failure
    if (!checkRegionSupport(request.regionCode, config)) {
      throw new FiatProviderError({
        providerId: 'moonpay',
        errorType: 'regionRestricted',
        displayCurrencyCode: request.displayCurrencyCode
      })
    }

    if (!checkAssetSupport(request, config)) {
      throw new FiatProviderError({
        providerId: 'moonpay',
        errorType: 'assetUnsupported'
      })
    }

    if (!checkPaymentMethodSupport(request, config)) {
      throw new FiatProviderError({
        providerId: 'moonpay',
        errorType: 'paymentUnsupported'
      })
    }

    // Fetch actual quotes
    const apiQuotes = await moonpayApi.getQuotes({
      baseCurrency: request.fiatCurrencyCode,
      quoteCurrency: request.displayCurrencyCode,
      baseCurrencyAmount: request.fiatAmount,
      paymentMethod: request.paymentTypes?.[0] || 'card',
      areFeesIncluded: true
    })

    // Transform to RampQuote format
    return apiQuotes.map(quote => ({
      pluginId: 'moonpay',
      direction: request.direction,
      fiatAmount: quote.baseCurrencyAmount,
      cryptoAmount: quote.quoteCurrencyAmount,
      fiatCurrencyCode: request.fiatCurrencyCode,
      displayCurrencyCode: request.displayCurrencyCode,
      paymentMethodId: quote.paymentMethod,
      partnerFee: quote.feeAmount,
      totalFee: quote.totalFeeAmount,
      rate: quote.quoteCurrencyPrice,
      expirationDate: new Date(quote.expiresAt)
    }))
  }
}
```

### Key Implementation Guidelines

1. **Different error handling between methods**:
   - `checkSupport`: NEVER throws - returns `{ supported: false }` for any failure
   - `fetchQuote`: ALWAYS throws `FiatProviderError` when validation fails
2. **Duplicate ALL validation logic**: Every check in `checkSupport` MUST also exist as a guard in `fetchQuote`
3. **Use FiatProviderError**: Always throw `FiatProviderError` with appropriate error types in `fetchQuote`
4. **Share validation logic**: Extract common validation into helper functions used by both methods
5. **Early returns in checkSupport**: Perform quick local checks before making API calls
6. **Provide specific error details**: Use the correct `errorType` and include relevant fields (amounts, currency codes)
7. **Cache provider config**: Reuse the cached provider configuration pattern for both methods
8. **Consistent validation**: Both methods must enforce the exact same business rules

## UI Integration

The UI now uses the `useSupportedPlugins` hook which calls `checkSupport` on all plugins to filter for supported ones:

**Current flow:**

```typescript
import { useSupportedPlugins } from '../../hooks/useSupportedPlugins'

// The hook internally calls checkSupport on each plugin
const { data: supportedPlugins } = useSupportedPlugins({
  direction: 'buy',
  regionCode: { countryCode: 'US', stateCode: 'CA' },
  fiatCurrencyCode: 'USD',
  tokenId: 'ethereum:null',
  paymentMethods: ['credit', 'bank']
})

// Only supported plugins are passed to quote fetching
const quotes = useRampQuotes({
  plugins: supportedPlugins,
  request: quoteRequest
})
```

The `useSupportedPlugins` hook:

- Calls `checkSupport` on all available plugins in parallel
- Filters out plugins that return `{ supported: false }`
- Only passes supported plugins to the quote fetching stage
- Provides better user experience by not showing unsupported providers

## Benefits

- **Reduced abstraction**: Direct usage of APIs makes code easier to understand
- **Better type safety**: TypeScript can properly type-check direct API usage
- **Improved maintainability**: Less wrapper code to maintain
- **Clearer dependencies**: It's obvious what external APIs each plugin uses
