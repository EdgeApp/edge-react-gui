# Localization Guidelines

## Core Principle

**ALWAYS put strings displayed in the UI in the `@src/locales/en_US.ts` file for localization.** Use `lstrings.string_name` to access the string.

## String Naming Convention

### Basic Strings

- Use descriptive, hierarchical naming: `component_context_description`
- Example: `trade_region_select_buy_crypto`, `settings_account_title`

### Parameterized Strings

If a string uses sprintf and `%s` or replacements, suffix the string with parameter indicators:

- **Single parameter**: `_s` suffix
  - Example: `buy_1s: 'Buy %1$s'`
- **Two parameters**: `_2s` suffix
  - Example: `error_balance_below_minimum_to_stake_2s: 'Your balance of %1$s does not meet the minimum %2$s required to stake.'`
- **Multiple parameters**: `_ns` suffix (where n is the number)
  - Example: `_3s`, `_4s`, `_5s` etc.

## Implementation Steps

1. **Identify hardcoded strings** in UI components
2. **Add strings to `en_US.ts`** with appropriate naming and parameter suffixes
3. **Replace hardcoded strings** with `lstrings.string_name` references
4. **Import lstrings** from `'../../locales/strings'` (adjust path as needed)

## Examples

### Before (Hardcoded)

```tsx
<EdgeText>Buy Crypto</EdgeText>
<EdgeText>Start in 4 Easy Steps</EdgeText>
<EdgeText>{`Step 1: Select Your Region`}</EdgeText>
```

### After (Localized)

```tsx
// In en_US.ts
export const strings = {
  trade_region_select_buy_crypto: 'Buy Crypto',
  trade_region_select_start_steps: 'Start in 4 Easy Steps',
  trade_region_select_step_1: ' Select Your Region for personalized options',
  // ...
}

// In component
import { lstrings } from '../../locales/strings'

<EdgeText>{lstrings.trade_region_select_buy_crypto}</EdgeText>
<EdgeText>{lstrings.trade_region_select_start_steps}</EdgeText>
<EdgeText>{lstrings.trade_region_select_step_1}</EdgeText>
```

### Parameterized Example

```tsx
// In en_US.ts
buy_1s: 'Buy %1$s',
error_balance_below_minimum_2s: 'Balance %1$s below minimum %2$s',

// In component
<EdgeText>{sprintf(lstrings.buy_1s, currencyCode)}</EdgeText>
<EdgeText>{sprintf(lstrings.error_balance_below_minimum_2s, balance, minimum)}</EdgeText>
```

## Benefits

- **Internationalization ready**: All strings can be translated to other languages
- **Consistency**: Centralized string management prevents duplicates
- **Maintainability**: Easy to update strings across the entire app
- **Type safety**: TypeScript ensures string keys exist

## Remember

This is a **mandatory** practice for all UI strings. No exceptions should be made for hardcoded strings in user-facing components.
