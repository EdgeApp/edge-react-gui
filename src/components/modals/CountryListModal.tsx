import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'
import { getCountry } from 'react-native-localize'

import { FLAG_LOGO_URL } from '../../constants/CdnConstants'
import { COUNTRY_CODES } from '../../constants/CountryConstants'
import s from '../../locales/strings'
import { CountryData } from '../../types/types'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SelectableRow } from '../themed/SelectableRow'
import { ListModal } from './ListModal'

type Props = {
  countryCode: string
  bridge: AirshipBridge<string>
}

export const CountryListModal = ({ countryCode = getCountry() ?? 'US', bridge }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const rowComponent = ({ filename, name, 'alpha-2': alpha }: CountryData) => {
    const logoName = filename ?? name.toLowerCase().replace(' ', '-')
    const source = { uri: `${FLAG_LOGO_URL}/${logoName}.png` }

    return (
      <SelectableRow
        arrowTappable
        autoWidthContent
        icon={<FastImage source={source} style={styles.image} />}
        paddingRem={[0, 1]}
        subTitle={alpha}
        title={name}
        onPress={() => bridge.resolve(alpha)}
      />
    )
  }

  const rowDataFilter = (searchText, country) => {
    const lowerCaseText = searchText.toLowerCase()
    const upperCaseText = searchText.toUpperCase()
    return (
      country.name.toLowerCase().includes(lowerCaseText) ||
      (country.filename != null && country.filename.includes(lowerCaseText)) ||
      (country['alpha-2'] != null && country['alpha-2'].includes(upperCaseText))
    )
  }

  const countryCodes = COUNTRY_CODES.reduce((countries, country) => {
    if (country['alpha-2'] === countryCode) countries.unshift(country)
    else countries.push(country)
    return countries
  }, [])

  const handleSubmitEditing = newCountry => {
    const result = countryCodes.find(({ 'alpha-2': alpha, filename = alpha, name = alpha }) =>
      [alpha, name, filename].find(country => country.toLowerCase() === newCountry.toLowerCase())
    ) ?? { 'alpha-2': countryCode }

    bridge.resolve(result['alpha-2'])
  }

  return (
    <ListModal
      bridge={bridge}
      title={s.strings.buy_sell_crypto_select_country_button}
      label={s.strings.search_region}
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
