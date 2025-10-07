// This test file intentionally tests deprecated functionality for backward compatibility
import {
  getRampPluginStoreId,
  RAMP_PLUGIN_STORE_ID_OVERRIDE
} from '../../../../plugins/ramps/utils/rampStoreIds'

describe('getRampPluginStoreId', () => {
  describe('legacy plugins', () => {
    it('should return legacy store IDs for migrated fiat providers', () => {
      // Providers with matching providerId and storeId
      expect(getRampPluginStoreId('banxa')).toBe('banxa')
      expect(getRampPluginStoreId('paybis')).toBe('paybis')
      expect(getRampPluginStoreId('ionia')).toBe('ionia')
      expect(getRampPluginStoreId('revolut')).toBe('revolut')

      // Providers with domain-prefixed storeIds
      expect(getRampPluginStoreId('bity')).toBe('com.bity')
      expect(getRampPluginStoreId('kado')).toBe('money.kado')
      expect(getRampPluginStoreId('moonpay')).toBe('com.moonpay')
      expect(getRampPluginStoreId('mtpelerin')).toBe('com.mtpelerin')
      expect(getRampPluginStoreId('simplex')).toBe('co.edgesecure.simplex')
    })

    it('should handle kadoOtc sharing store with kado', () => {
      expect(getRampPluginStoreId('kadoOtc')).toBe('money.kado')
      expect(getRampPluginStoreId('kado')).toBe('money.kado')
      // Both should resolve to the same store ID
      expect(getRampPluginStoreId('kadoOtc')).toBe(getRampPluginStoreId('kado'))
    })
  })

  describe('new plugins', () => {
    it('should use ramp: prefix for plugins not in override map', () => {
      expect(getRampPluginStoreId('newexchange')).toBe('ramp:newexchange')
      expect(getRampPluginStoreId('cryptopay')).toBe('ramp:cryptopay')
      expect(getRampPluginStoreId('onramp2024')).toBe('ramp:onramp2024')
      expect(getRampPluginStoreId('futurePlugin')).toBe('ramp:futurePlugin')
    })
  })

  describe('override map integrity', () => {
    it('should contain all expected legacy providers', () => {
      const expectedLegacyProviders = [
        'banxa',
        'paybis',
        'ionia',
        'revolut',
        'bity',
        'kado',
        'kadoOtc',
        'moonpay',
        'mtpelerin',
        'simplex'
      ]

      expectedLegacyProviders.forEach(provider => {
        expect(RAMP_PLUGIN_STORE_ID_OVERRIDE).toHaveProperty(provider)
      })
    })

    it('should have exactly 10 legacy providers', () => {
      // This ensures no new providers are accidentally added
      expect(Object.keys(RAMP_PLUGIN_STORE_ID_OVERRIDE)).toHaveLength(10)
    })
  })
})
