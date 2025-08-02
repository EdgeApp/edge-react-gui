# Edge React GUI - Fiat Plugin Architecture

## Overview

The Edge wallet implements a sophisticated plugin architecture for integrating fiat on/off ramp providers. This system enables users to buy and sell cryptocurrency through various payment methods and providers while maintaining a consistent user experience across different regions and currencies.

## Architecture Components

### 1. Directory Structure

```
src/plugins/gui/
├── fiatPlugin.ts                    # Core plugin framework
├── fiatPluginTypes.ts              # Type definitions
├── fiatProviderTypes.ts            # Provider-specific types
├── providers/                      # Individual provider implementations
│   ├── paybisProvider.ts          # Paybis implementation
│   ├── banxaProvider.ts           # Banxa implementation
│   ├── moonpayProvider.ts         # Moonpay implementation
│   └── ...                        # Other providers
├── scenes/                         # Plugin UI scenes
│   ├── FiatPluginWebView.tsx      # WebView wrapper
│   ├── AddressFormScene.tsx       # Address collection
│   └── InfoDisplayScene.tsx       # Information display
└── util/
    └── providerUtils.ts           # Shared utilities

src/constants/plugins/
├── sellPluginList.json            # Sell payment method configurations
├── sellPluginListOverride.json    # Environment-specific overrides
├── buyPluginList.json             # Buy payment method configurations
└── GuiPlugins.ts                  # Plugin registry
```

### 2. Core Type System

#### Payment Types

Defined in `fiatPluginTypes.ts`:

```typescript
export const asFiatPaymentType = asValue(
  'ach', // ACH bank transfer
  'applepay', // Apple Pay
  'credit', // Credit/debit card
  'directtobank', // Direct bank transfer
  'iach', // Instant ACH
  'interac', // Interac e-Transfer (Canada)
  'paypal', // PayPal
  'sepa', // SEPA bank transfer (Europe)
  'venmo' // Venmo
  // ... more payment types
)
```

#### Regional Support

```typescript
interface FiatProviderSupportedRegions {
  [countryCode: string]:
    | {
        notStateProvinces?: string[] // Excluded states/provinces
      }
    | true // All regions supported
}
```

### 3. Plugin Configuration System

#### Sell Plugin List (`sellPluginList.json`)

Each payment method is configured with:

```json
{
  "id": "interac",
  "pluginId": "interac",
  "paymentType": "interac",
  "paymentTypes": ["interac"],
  "title": "Interac e-Transfer",
  "description": "Fee: 3%\nSettlement: Instant",
  "forCountries": ["CA"],
  "notStateProvinces": { "CA": ["QC"] },
  "cryptoCodes": [],
  "paymentTypeLogoKey": "interac",
  "sortIndex": 10
}
```

Key fields:

- **id**: Unique identifier for the plugin
- **paymentType**: Maps to `FiatPaymentType` enum
- **forCountries**: Array of ISO country codes where available
- **notStateProvinces**: Excluded regions within countries
- **sortIndex**: Display order priority

### 4. Provider Implementation Pattern

#### Provider Factory Pattern

Each provider implements the `FiatProviderFactory` interface:

```typescript
export interface FiatProviderFactory {
  providerId: string
  storeId: string
  makeProvider: (params: FiatProviderFactoryParams) => Promise<FiatProvider>
}
```

#### Provider Interface

```typescript
export interface FiatProvider {
  providerId: string
  partnerIcon: string
  pluginDisplayName: string
  getSupportedAssets: (
    params: GetSupportedAssetsParams
  ) => Promise<FiatProviderAssetMap>
  getQuote: (params: FiatProviderGetQuoteParams) => Promise<FiatProviderQuote>
  otherMethods: any
}
```

### 5. Provider Implementation Details

#### Payment Method Mapping

Providers map their internal payment method IDs to Edge payment types:

```typescript
// Example from paybisProvider.ts
const PAYMENT_METHOD_MAP: { [Payment in PaymentMethodId]: FiatPaymentType } = {
  'method-id-trustly': 'iach',
  'method-id-swift-bank-transfer-out': 'iach',
  'method-id-credit-card-out': 'credit',
  'method-id_bridgerpay_directa24_pix_payout': 'pix'
  // ...
}
```

#### Regional Restrictions

```typescript
const SUPPORTED_REGIONS: FiatProviderSupportedRegions = {
  US: {
    notStateProvinces: ['HI', 'NY'] // Exclude Hawaii and New York
  },
  CA: {
    notStateProvinces: ['QC'] // Exclude Quebec
  }
}
```

#### Asset Support Discovery

Providers dynamically fetch supported assets from their APIs:

```typescript
// Dynamic discovery pattern
if (isDailyCheckDue(lastChecked)) {
  const promises = [
    // Fetch supported countries
    providerFetch({ path: 'api/countries' }),
    // Fetch supported cryptocurrencies
    providerFetch({ path: 'api/coins/sell' }),
    // Fetch supported fiat currencies
    providerFetch({ path: 'api/fiats/sell' }),
    // Fetch payment methods
    providerFetch({ path: 'api/payment-methods' })
  ]
  await Promise.all(promises)
  lastChecked = Date.now()
}
```

### 6. Integration Flow

#### 1. Plugin Registration

Plugins are registered in `GuiPlugins.ts`:

```typescript
export const guiPlugins: GuiPlugin[] = [
  { pluginId: 'interac', paymentTypeLogoKey: 'interac' },
  { pluginId: 'ach', paymentTypeLogoKey: 'bank' }
  // ...
]
```

#### 2. Scene Integration

The sell flow integrates plugins through:

1. **Region Selection**: User selects country/region
2. **Payment Method Filtering**: Available methods filtered by region
3. **Provider Matching**: System finds providers supporting the payment type and region
4. **Asset Discovery**: Provider reports supported cryptocurrencies and fiat currencies
5. **Quote Generation**: Provider generates quotes for the transaction
6. **Transaction Execution**: Provider handles the actual transaction flow

#### 3. Provider Selection Logic

```typescript
// Simplified provider selection
const supportedProviders = await Promise.all(
  providers.map(async provider => {
    try {
      const assets = await provider.getSupportedAssets({
        direction: 'sell',
        paymentTypes: ['interac'],
        regionCode: { countryCode: 'CA', stateProvinceCode: 'ON' }
      })
      return { provider, assets }
    } catch (error) {
      return null // Provider doesn't support this configuration
    }
  })
)
```

### 7. Configuration Management

#### Environment Overrides

The system supports environment-specific configurations through override files:

- `sellPluginListOverride.json` - Can disable/modify plugins per environment
- Provider API keys and endpoints configured via environment variables

#### Regional Compliance

Each provider can implement region-specific compliance logic:

```typescript
// Example: Disable sell for debit cards in specific regions
if (
  regionCode.countryCode === 'GB' ||
  (direction === 'sell' &&
    paymentTypes.includes('credit') &&
    regionCode.countryCode === 'US')
) {
  throw new FiatProviderError({
    providerId,
    errorType: 'paymentUnsupported'
  })
}
```

### 8. Error Handling

#### Standardized Error Types

```typescript
export interface FiatProviderError {
  providerId: string
  errorType:
    | 'overLimit'
    | 'underLimit'
    | 'regionUnsupported'
    | 'paymentUnsupported'
    | 'assetUnsupported'
  errorAmount?: number
  displayCurrencyCode?: string
}
```

#### Graceful Degradation

- If a provider fails, others are tried
- If no providers support a payment method, it's hidden from the UI
- Provider failures are logged but don't crash the app

### 9. Testing Strategy

The plugin system includes comprehensive testing:

- **Unit Tests**: Individual provider logic
- **Integration Tests**: Full payment flows
- **Mock Providers**: Testing without real API calls
- **Regional Testing**: Verify correct behavior across different regions

### 10. Adding New Providers

To add a new provider:

1. **Create Provider File**: `src/plugins/gui/providers/newProvider.ts`
2. **Implement Factory Pattern**: Follow existing provider structure
3. **Add Payment Method Mappings**: Map provider's payment methods to Edge types
4. **Configure Regional Support**: Define supported countries/regions
5. **Update Plugin Lists**: Add payment methods to `sellPluginList.json`
6. **Add Tests**: Create comprehensive test coverage
7. **Register Provider**: Add to provider registry

### 11. Key Design Principles

#### Separation of Concerns

- **Payment Methods**: Abstract payment types (e.g., 'interac')
- **Providers**: Concrete implementations (e.g., Paybis, Banxa)
- **Regional Logic**: Centralized country/state restrictions
- **UI Components**: Reusable across different providers

#### Provider Autonomy

Each provider:

- Manages its own API communication
- Defines its own supported assets
- Handles its own error states
- Implements its own regional restrictions

#### User Experience Consistency

Despite provider differences:

- Consistent UI across all providers
- Standardized error messages
- Uniform quote presentation
- Common transaction flow

This architecture enables Edge to integrate with multiple fiat providers while maintaining code quality, user experience consistency, and regulatory compliance across different regions.
