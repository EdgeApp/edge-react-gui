import { asObject, asString } from 'cleaners'

import { FiatPluginRegionCode } from '../fiatPluginTypes'
import { FiatProviderError, FiatProviderSupportedRegions } from '../fiatProviderTypes'

export const RETURN_URL_SUCCESS = 'https://edge.app/redirect/success/'
export const RETURN_URL_FAIL = 'https://edge.app/redirect/fail/'
export const RETURN_URL_CANCEL = 'https://edge.app/redirect/cancel/'
export const RETURN_URL_PAYMENT = 'https://edge.app/redirect/payment/'

export const NOT_SUCCESS_TOAST_HIDE_MS = 5000

/**
 * @param providerId Unique providerId to filter.
 * @param regionCode FiatPluginRegionCode object with country & state/province
 * @param supportedRegions FiatProviderSupportedRegions object
 * @returns void if supported, throws otherwise
 */
export const validateRegion = (providerId: string, regionCode: FiatPluginRegionCode, supportedRegions: FiatProviderSupportedRegions): void => {
  const { countryCode, stateProvinceCode } = regionCode
  const countryInfo = supportedRegions[countryCode]
  if (countryInfo == null) return

  const { forStateProvinces, notStateProvinces } = countryInfo

  if (stateProvinceCode != null) {
    if (notStateProvinces?.includes(stateProvinceCode) === true) {
      throw new FiatProviderError({ providerId, errorType: 'regionRestricted' })
    }
    if (forStateProvinces?.includes(stateProvinceCode) === false) {
      throw new FiatProviderError({ providerId, errorType: 'regionRestricted' })
    }
  }
}

export const asStandardApiKeys = asObject({
  apiKey: asString
})
