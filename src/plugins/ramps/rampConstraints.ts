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

  // Venmo payment method is only supported in the USA
  if (params.paymentType === 'venmo') {
    yield params.regionCode.countryCode === 'US'
  }

  // Constrain Revolut to the supported regions
  if (params.paymentType === 'revolut') {
    const forCountries = `
      AU, BR, AT, BE, BG, CY, CZ, DE, DK, EE, ES, FI,
      FR, GR, HR, HU, IE, IS, IT, LI, LT, LU, LV,
      MT, NL, NO, PL, PT, RO, SE, SI, SK, JP, NZ,
      SG, CH, GB, IO, IM, JE, GG, GF, GP, YT,
      MQ, RE, MF `
      .replace(/\s/g, '')
      .split(',')

    yield forCountries.includes(params.regionCode.countryCode)
  }

  if (params.paymentType === 'paypal') {
    const forCountries = `
      AE, AR, AT, AU, BE, BR, CA, CH, CL, CO,
      CZ, DE, DK, EG, ES, FI, FR, GH, GR, HK,
      HU, IE, IN, IT, JP, KE, KR, MX, MY,
      NG, NL, NO, NZ, PE, PH, PL, PT, RU, SA,
      SE, SG, TH, TR, TZ, US, VN, ZA`
      .replace(/\s/g, '')
      .split(',')

    yield forCountries.includes(params.regionCode.countryCode)
  }

  //
  // Paybis
  //

  // Paybis is not supported in the UK (Great Britain)
  if (params.rampPluginId === 'paybis') {
    yield params.regionCode.countryCode !== 'GB'
  }
  // Disable sell for Paybis because they no longer support sell
  if (params.rampPluginId === 'paybis') {
    yield params.direction !== 'sell'
  }
  // Filter out credit for sell in US for Paybis (kept in-case they support sell
  // again in the future)
  if (params.rampPluginId === 'paybis') {
    yield !(
      params.direction === 'sell' &&
      params.regionCode.countryCode === 'US' &&
      params.paymentType === 'credit'
    )
  }
}
