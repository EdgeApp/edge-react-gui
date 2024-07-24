import * as React from 'react'
import { Image } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { getCountry } from 'react-native-localize'

import { FLAG_LOGO_URL } from '../../constants/CdnConstants'
import { COUNTRY_CODES } from '../../constants/CountryConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { CountryData } from '../../types/types'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SelectableRow } from '../themed/SelectableRow'
import { ListModal } from './ListModal'

interface Props {
  countryCode: string
  bridge: AirshipBridge<string>
}

export const CountryListModal = ({ countryCode: rawCountryCode, bridge }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const countryCode = rawCountryCode === '' ? getCountry() ?? 'US' : rawCountryCode

  const rowComponent = ({ filename, name, 'alpha-2': alpha }: CountryData) => {
    const logoName = filename ?? name.toLowerCase().replace(' ', '-')
    const source = { uri: `${FLAG_LOGO_URL}/${logoName}.png` }

    return <SelectableRow icon={<Image source={source} style={styles.image} />} subTitle={alpha} title={name} onPress={() => bridge.resolve(alpha)} />
  }

  const rowDataFilter = (searchText: string, country: CountryData) => {
    const lowerCaseText = searchText.toLowerCase()
    const upperCaseText = searchText.toUpperCase()
    return (
      country.name.toLowerCase().includes(lowerCaseText) ||
      (country.filename != null && country.filename.includes(lowerCaseText)) ||
      country['alpha-2'].includes(upperCaseText) ||
      country['alpha-3'].includes(upperCaseText)
    )
  }

  const countryCodes: CountryData[] = []
  for (const country of COUNTRY_CODES) {
    if (country['alpha-2'] === countryCode) countryCodes.unshift(country)
    else countryCodes.push(country)
  }

  const handleSubmitEditing = useHandler((text: string) => {
    // Filter the countryCodes array based on the input text
    const filteredCountries = countryCodes.filter(country => rowDataFilter(text, country))

    // Resolve the first filtered country's alpha-2 code
    if (filteredCountries.length > 0) {
      bridge.resolve(filteredCountries[0]['alpha-2'])
    }
  })

  return (
    <ListModal
      bridge={bridge}
      title={lstrings.buy_sell_crypto_select_country_button}
      label={lstrings.search_region}
      autoFocus
      rowsData={countryCodes}
      onSubmitEditing={handleSubmitEditing}
      rowComponent={rowComponent}
      rowDataFilter={rowDataFilter}
    />
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  image: {
    height: theme.rem(2),
    width: theme.rem(2)
  }
}))
