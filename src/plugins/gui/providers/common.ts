import { asObject, asString } from 'cleaners'

import { FiatPluginRegionCode } from '../fiatPluginTypes'
import { FiatProviderError, FiatProviderExactRegions, FiatProviderSupportedRegions } from '../fiatProviderTypes'

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

export const validateExactRegion = (providerId: string, regionCode: FiatPluginRegionCode, supportedRegions: FiatProviderExactRegions): void => {
  const { countryCode, stateProvinceCode } = regionCode
  const countryInfo = supportedRegions[countryCode]
  if (countryInfo == null || countryInfo === false) {
    throw new FiatProviderError({ providerId, errorType: 'regionRestricted' })
  }

  if (countryInfo === true) {
    return
  }

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

export const addExactRegion = (allowedCountryCodes: FiatProviderExactRegions, countryCode: string, stateProvinceCode?: string): void => {
  if (stateProvinceCode == null) {
    allowedCountryCodes[countryCode] = true
  } else {
    const oldCountry = allowedCountryCodes[countryCode]
    let newCountry: FiatProviderExactRegions['cc'] = {}
    if (typeof oldCountry === 'object') newCountry = { ...oldCountry }
    if (newCountry.forStateProvinces == null) {
      newCountry.forStateProvinces = [stateProvinceCode]
    } else {
      if (!newCountry.forStateProvinces.includes(stateProvinceCode)) {
        newCountry.forStateProvinces.push(stateProvinceCode)
      }
    }
    allowedCountryCodes[countryCode] = newCountry
  }
}

export const asStandardApiKeys = asObject({
  apiKey: asString
})
