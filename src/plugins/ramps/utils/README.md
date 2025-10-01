# Ramp Plugin Store IDs

## Store ID Convention

All ramp plugins require a unique store ID for persisting data via EdgeDataStore. The store ID is determined by the following rules:

### New Plugins (Standard Convention)
All NEW ramp plugins automatically use the namespaced format:
```
ramp:${pluginId}
```

Examples:
- Plugin ID: `newexchange` → Store ID: `ramp:newexchange`  
- Plugin ID: `cryptopay` → Store ID: `ramp:cryptopay`
- Plugin ID: `onramp2024` → Store ID: `ramp:onramp2024`

### Legacy Plugins (Backward Compatibility)
Plugins migrated from the old fiat provider system MUST maintain their original store IDs to preserve access to existing user data. These are defined in `RAMP_PLUGIN_STORE_ID_OVERRIDE`.

**⚠️ IMPORTANT: The override map should NEVER be edited or have new entries added.**

Legacy examples:
- `paybis` → `paybis` (no prefix)
- `kado` → `money.kado` (domain prefix)  
- `kadoOtc` → `money.kado` (shares store with kado)
- `simplex` → `co.edgesecure.simplex` (full domain)
- `moonpay` → `com.moonpay` (domain prefix)

## Implementation Guide

### Adding a New Ramp Plugin

1. **Create your plugin factory** - No special store ID configuration needed
2. **Register in allRampPlugins.ts** - The plugin will automatically use `ramp:${pluginId}`

```typescript
// Your new plugin - store ID will be 'ramp:mynewplugin'
export const pluginFactories: Record<string, RampPluginFactory> = {
  mynewplugin: myNewPluginFactory
}
```

### Migrating from Old Fiat System

If you're migrating a provider from the old fiat system:

1. **Check if already in override map** - It should already be listed in `RAMP_PLUGIN_STORE_ID_OVERRIDE`
2. **Use existing store ID** - Do NOT add new entries to the override map
3. **If not listed** - This is likely a mistake. The map contains ALL old fiat providers

## Technical Details

The store ID resolution is handled by `getRampPluginStoreId()` which:
1. First checks the legacy override map
2. Falls back to the new convention `ramp:${pluginId}`

This ensures backward compatibility while maintaining a clean convention for all future plugins.

## Why This Approach?

- **Backward Compatibility**: Users don't lose data when providers migrate to the new system
- **Clean Namespace**: New plugins are clearly identified with the `ramp:` prefix
- **No Collisions**: Prevents store ID conflicts between old and new systems
- **Future-Proof**: Clear separation between legacy and modern plugins