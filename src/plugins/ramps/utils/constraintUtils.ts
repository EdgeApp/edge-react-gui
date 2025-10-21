import type { FiatPaymentType } from '../../gui/fiatPluginTypes'
import {
  type RampConstraintParams,
  validateRampConstraintParams
} from '../rampConstraints'
import type {
  RampCheckSupportRequest,
  RampQuoteRequest
} from '../rampPluginTypes'

export const validateRampCheckSupportRequest = (
  rampPluginId: string,
  request: RampCheckSupportRequest,
  paymentType: FiatPaymentType[]
): boolean => {
  return paymentType.some(paymentType => {
    const params: RampConstraintParams = {
      rampPluginId,
      cryptoAsset: {
        pluginId: request.cryptoAsset.pluginId,
        tokenId: request.cryptoAsset.tokenId
      },
      fiatCurrencyCode: request.fiatAsset.currencyCode,
      direction: request.direction,
      regionCode: request.regionCode,
      paymentType
    }
    return validateRampConstraintParams(params)
  })
}

export const validateRampQuoteRequest = (
  rampPluginId: string,
  request: RampQuoteRequest,
  /** It is required to check the payment type when checking the RampQuoteRequest */
  paymentType: FiatPaymentType
): boolean => {
  const params: RampConstraintParams = {
    rampPluginId,
    cryptoAsset: {
      pluginId: request.wallet.currencyInfo.pluginId,
      tokenId: request.tokenId
    },
    fiatCurrencyCode: request.fiatCurrencyCode,
    direction: request.direction,
    regionCode: request.regionCode,
    paymentType
  }
  return validateRampConstraintParams(params)
}
