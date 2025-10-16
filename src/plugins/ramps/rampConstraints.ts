import type {
  FiatPaymentType,
  FiatPluginRegionCode
} from '../gui/fiatPluginTypes'
import type { CryptoAsset } from './rampPluginTypes'

export interface RampConstraintParams {
  rampPluginId: string
  cryptoAsset: CryptoAsset
  fiatCurrencyCode: string
  direction: 'buy' | 'sell'
  regionCode: FiatPluginRegionCode
  paymentType: FiatPaymentType
}

export function validateRampConstraintParams(
  params: RampConstraintParams
): boolean {
  for (const constraint of constraintGenerator(params)) {
    if (!constraint) {
      return false
    }
  }
  return true
}

export function* constraintGenerator(
  params: RampConstraintParams
): Generator<boolean, void> {
  // Restrict ACH to only US
  if (params.paymentType === 'ach') {
    yield params.regionCode.countryCode === 'US'
  }
}
