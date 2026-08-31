import { getLocales } from 'expo-localization'

/**
 * Device locale helpers via expo-localization.
 */

export const getDeviceLocales = (): Array<{ languageTag: string }> => {
  return getLocales()
}

export const getNumberFormatSettings = (): {
  decimalSeparator: string
  groupingSeparator: string
} => {
  const [first] = getLocales()
  return {
    decimalSeparator: first?.decimalSeparator ?? '.',
    groupingSeparator: first?.digitGroupingSeparator ?? ','
  }
}

export const getCountry = (): string => {
  return getLocales()[0]?.regionCode ?? 'US'
}

export const getCurrencies = (): string[] => {
  const codes: string[] = []
  for (const locale of getLocales()) {
    if (locale.currencyCode != null && locale.currencyCode !== '') {
      codes.push(locale.currencyCode)
    }
  }
  return codes
}
