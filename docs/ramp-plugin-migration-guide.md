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
import { showToast, showError, showToastSpinner } from '../../../components/services/AirshipInstance'

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
  <ButtonsModal bridge={bridge} buttons={buttons} title={title} message={message} />
))

await Airship.show(bridge => (
  <RadioListModal bridge={bridge} {...params} />
))
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
import { registerRampDeeplinkHandler, unregisterRampDeeplinkHandler } from '../rampDeeplinkHandler'

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

const deniedPermission = await requestPermissionOnSettings(disklet, 'camera', displayName, true)
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
  await showUi.showToast(
    lstrings.fiat_plugin_cannot_continue_camera_permission
  )
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
  showToast(
    lstrings.fiat_plugin_cannot_continue_camera_permission
  )
  return
}
```

Note the inverted boolean logic: `!success` becomes `deniedPermission`.

### Asset Discovery

**Before:**
```typescript
const assets = await provider.getSupportedAssets({
  direction: 'buy',
  paymentTypes: ['credit', 'bank'],
  regionCode: { countryCode: 'US', stateCode: 'CA' }
})
```

**After:**
```typescript
const assets = await plugin.getSupportedAssets({
  direction: 'buy',
  paymentTypes: ['credit', 'bank'],
  regionCode: { countryCode: 'US', stateCode: 'CA' }
})
```

The API remains the same, maintaining compatibility with existing code. Note that the method returns the asset map for the first supported payment type from the provided array.

## Asset Discovery Integration

The ramp plugin architecture includes a `getSupportedAssets` method that allows the UI to check which plugins support specific crypto/fiat/region combinations:

```typescript
// Usage in TradeCreateScene via custom hook
import { useSupportedPlugins } from '../../hooks/useSupportedPlugins'

const { 
  data: supportedPlugins = [], 
  isLoading: isCheckingSupport 
} = useSupportedPlugins({
  selectedWallet,
  selectedCrypto,
  selectedCryptoCurrencyCode,
  selectedFiatCurrencyCode,
  countryCode,
  stateProvinceCode
})

// Only query supported plugins for quotes
const quotePromises = supportedPlugins.map(async (plugin) => {
  return await plugin.fetchQuote(rampQuoteRequest)
})
```

The `useSupportedPlugins` hook:
- Checks all payment types for comprehensive support
- Caches results for 5 minutes to avoid excessive API calls
- Filters plugins based on crypto/fiat/region support
- Returns loading state for UI feedback

## Benefits

- **Reduced abstraction**: Direct usage of APIs makes code easier to understand
- **Better type safety**: TypeScript can properly type-check direct API usage
- **Improved maintainability**: Less wrapper code to maintain
- **Clearer dependencies**: It's obvious what external APIs each plugin uses