# Payment Type Icons

This document explains how to use the payment type icon mapping system for displaying appropriate icons for different payment methods in the fiat plugin system.

## Overview

The payment type icon system provides a consistent way to map `FiatPaymentType` values to their corresponding theme icon keys. This ensures that payment methods are displayed with the correct visual representation across the application.

## Usage

### Basic Usage

```typescript
import { getPaymentTypeIcon } from '../util/paymentTypeIcons'
import { useTheme } from '../services/ThemeContext'

const MyComponent = () => {
  const theme = useTheme()
  const paymentType = 'applepay' // FiatPaymentType
  
  const icon = getPaymentTypeIcon(paymentType, theme)
  // Returns: { uri: 'path/to/apple-pay-icon.png' }
}
```

### Integration with PaymentOptionCard

When rendering payment options from quotes, use the first payment type to determine the icon:

```typescript
const QuoteResult = ({ quote }) => {
  const theme = useTheme()
  
  // Get icon for the first payment type, fallback to partner icon
  const paymentTypeIcon = quote.paymentTypes[0]
    ? getPaymentTypeIcon(quote.paymentTypes[0], theme)
    : undefined
  const icon = paymentTypeIcon ?? { uri: quote.partnerIcon }
  
  return (
    <PaymentOptionCard
      title={quote.paymentTypes.join(', ')}
      icon={icon}
      // ... other props
    />
  )
}
```

## Payment Type Mappings

### Direct Mappings

These payment types have dedicated icons in the theme:

- `applepay` → `paymentTypeLogoApplePay`
- `credit` → `paymentTypeLogoCreditCard`
- `fasterpayments` → `paymentTypeLogoFasterPayments`
- `googlepay` → `paymentTypeLogoGooglePay`
- `ideal` → `paymentTypeLogoIdeal`
- `interac` → `paymentTypeLogoInterac`
- `payid` → `paymentTypeLogoPayid`
- `paypal` → `paymentTypeLogoPaypal`
- `pix` → `paymentTypeLogoPix`
- `revolut` → `paymentTypeLogoRevolut`
- `venmo` → `paymentTypeLogoVenmo`

### Fallback Mappings

These payment types use the generic bank transfer icon as a fallback:

- `ach` → `paymentTypeLogoBankTransfer`
- `colombiabank` → `paymentTypeLogoBankTransfer`
- `directtobank` → `paymentTypeLogoBankTransfer`
- `iach` → `paymentTypeLogoBankTransfer`
- `iobank` → `paymentTypeLogoBankTransfer`
- `mexicobank` → `paymentTypeLogoBankTransfer`
- `pse` → `paymentTypeLogoBankTransfer`
- `sepa` → `paymentTypeLogoBankTransfer`
- `spei` → `paymentTypeLogoBankTransfer`
- `turkishbank` → `paymentTypeLogoBankTransfer`
- `wire` → `paymentTypeLogoBankTransfer`

## API Reference

### `getPaymentTypeIcon(paymentType: FiatPaymentType, theme: Theme): ImageProp | undefined`

Returns the theme icon for a given payment type.

**Parameters:**
- `paymentType`: The payment type to get the icon for
- `theme`: The theme object containing the icon images

**Returns:**
- `ImageProp`: The icon image object (`{ uri: string } | number`)
- `undefined`: If the payment type doesn't have a corresponding icon

### `getPaymentTypeThemeKey(paymentType: FiatPaymentType): keyof Theme | null`

Returns just the theme key for a payment type without requiring the theme object.

**Parameters:**
- `paymentType`: The payment type to get the theme key for

**Returns:**
- `keyof Theme`: The theme key string
- `null`: If the payment type doesn't have a corresponding theme key

## Adding New Payment Types

To add support for a new payment type:

1. Add the payment type to the `FiatPaymentType` union in `fiatPluginTypes.ts`
2. Add the corresponding icon to the theme in `types/Theme.ts`
3. Update the `paymentTypeToThemeKey` mapping in `util/paymentTypeIcons.ts`
4. Add the icon assets to all theme variations (edgeLight, edgeDark, etc.)

## Notes

- Payment types that are primarily bank-based use the generic bank transfer icon as a reasonable fallback
- The system is designed to be extensible - new payment types can be added without breaking existing functionality
- Always provide a fallback (like the partner icon) when using payment type icons in case the mapping returns undefined