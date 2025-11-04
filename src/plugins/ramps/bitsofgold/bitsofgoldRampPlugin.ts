import { guiPlugins } from '../../../constants/plugins/GuiPlugins'
import type { RampPluginFactory, SettlementRange } from '../rampPluginTypes'
import { createExternalRampPlugin } from '../utils/createExternalRampPlugin'
import { asInitOptions } from './bitsofgoldRampTypes'

const SETTLEMENT_ONE_TO_FORTY_EIGHT_HOURS: SettlementRange = {
  min: { value: 1, unit: 'hours' },
  max: { value: 48, unit: 'hours' }
}

export const bitsofgoldRampPlugin: RampPluginFactory = config => {
  const initOptions = asInitOptions(config.initOptions)

  return createExternalRampPlugin(
    'bitsofgold',
    {
      guiPlugin: guiPlugins.bitsofgold,
      partnerIcon: initOptions.partnerIcon,
      buy: {
        paymentTypes: ['wire'],
        countries: ['IL'],
        fiatCurrencyCodes: ['ILS'],
        cryptoAssets: [
          { pluginId: 'bitcoin', tokenId: null },
          { pluginId: 'ethereum', tokenId: null }
        ],
        settlementRange: SETTLEMENT_ONE_TO_FORTY_EIGHT_HOURS,
        deepPath: '/order/buy',
        deepQuery: {
          order_id: 'null',
          page: '0'
        }
      },
      sell: {
        paymentTypes: ['wire'],
        countries: ['IL'],
        fiatCurrencyCodes: ['ILS'],
        cryptoAssets: [
          { pluginId: 'bitcoin', tokenId: null },
          { pluginId: 'ethereum', tokenId: null }
        ],
        settlementRange: SETTLEMENT_ONE_TO_FORTY_EIGHT_HOURS,
        deepPath: '/order/sell',
        deepQuery: {
          order_id: 'null',
          page: '0',
          utm_source: 'Edge',
          utm_medium: 'mobile_app',
          utm_campaign: 'co',
          etag: 'true'
        }
      }
    },
    config
  )
}
