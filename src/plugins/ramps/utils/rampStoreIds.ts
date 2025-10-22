/**
 * LEGACY STORE ID OVERRIDES - DO NOT EDIT
 *
 * This map contains store ID overrides for ramp plugins that were migrated from
 * the old fiat provider system. These overrides exist ONLY to maintain backward
 * compatibility with existing user data that was stored under the old store IDs.
 *
 * ⚠️ IMPORTANT:
 * - This map should NEVER be edited or have new entries added
 * - This is ONLY for plugins migrated from the old fiat provider system
 * - All NEW ramp plugins MUST use the standard convention: `ramp:${pluginId}`
 * - These overrides are technical debt that we maintain for backward compatibility
 *
 * The entries below represent ALL the old fiat providers that will eventually
 * be migrated to the new ramp plugin system. Once migrated, they must continue
 * using their legacy store IDs to access existing user data.
 *
 * @deprecated This entire map is deprecated. New plugins should not be added here.
 */
export const RAMP_PLUGIN_STORE_ID_OVERRIDE: Record<string, string> = {
  // Providers with matching providerId and storeId:
  banxa: 'banxa',
  paybis: 'paybis',
  ionia: 'ionia',
  revolut: 'revolut',

  // Providers with domain-prefixed storeIds:
  kado: 'money.kado',
  kadoOtc: 'money.kado', // NOTE: Shares store with kado
  moonpay: 'com.moonpay',
  mtpelerin: 'com.mtpelerin',
  simplex: 'co.edgesecure.simplex'
} as const

/**
 * Get the store ID for a ramp plugin.
 *
 * This function implements the store ID convention for ramp plugins:
 * - Legacy plugins (migrated from old fiat system): Use override from RAMP_PLUGIN_STORE_ID_OVERRIDE
 * - New plugins: Use the convention `ramp:${pluginId}`
 *
 * @param pluginId - The unique identifier for the ramp plugin
 * @returns The store ID to use for EdgeDataStore operations
 *
 * @example
 * // Legacy plugin (migrated from old system)
 * getRampPluginStoreId('paybis') // Returns: 'paybis'
 * getRampPluginStoreId('moonpay') // Returns: 'com.moonpay'
 *
 * @example
 * // New plugin (not in legacy map)
 * getRampPluginStoreId('newexchange') // Returns: 'ramp:newexchange'
 * getRampPluginStoreId('cryptopay') // Returns: 'ramp:cryptopay'
 */
export function getRampPluginStoreId(pluginId: string): string {
  // Check if this is a legacy plugin that needs backward compatibility
  const legacyStoreId = RAMP_PLUGIN_STORE_ID_OVERRIDE[pluginId]

  // Use legacy store ID if it exists, otherwise use new convention
  return legacyStoreId ?? `ramp:${pluginId}`
}
