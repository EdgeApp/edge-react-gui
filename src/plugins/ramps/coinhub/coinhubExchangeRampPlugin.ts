import { guiPlugins } from '../../../constants/plugins/GuiPlugins'
import type { RampPluginFactory, SettlementRange } from '../rampPluginTypes'
import { createExternalRampPlugin } from '../utils/createExternalRampPlugin'
import { asInitOptions } from './coinhubRampTypes'

const SETTLEMENT_ONE_TO_FORTY_EIGHT_HOURS: SettlementRange = {
  min: { value: 1, unit: 'hours' },
  max: { value: 48, unit: 'hours' }
}

/**
 * The Coinhub bank-wire and OTC desk. It is a full trading site rather than an
 * embedded purchase flow, so `guiPlugins.coinhubexchange` sends it to the
 * device browser.
 */
export const coinhubExchangeRampPlugin: RampPluginFactory = config => {
  const initOptions = asInitOptions(config.initOptions)

  return createExternalRampPlugin(
    'coinhubexchange',
    {
      partnerIcon: initOptions.partnerIcon,
      guiPlugin: guiPlugins.coinhubexchange,
      buy: {
        paymentTypes: ['wire'],
        countries: ['US'],
        settlementRange: SETTLEMENT_ONE_TO_FORTY_EIGHT_HOURS,
        deepPath: '/'
      },
      sell: {
        paymentTypes: ['wire'],
        countries: ['US'],
        settlementRange: SETTLEMENT_ONE_TO_FORTY_EIGHT_HOURS,
        deepPath: '/'
      }
    },
    config
  )
}
