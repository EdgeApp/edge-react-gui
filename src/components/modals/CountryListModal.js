// @flow
import { useCavy } from 'cavy'
import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'
import { getCountry } from 'react-native-localize'

import { COUNTRY_CODES, FLAG_LOGO_URL } from '../../constants/CountryConstants.js'
import s from '../../locales/strings.js'
import type { CountryData } from '../../types/types'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { SelectableRow } from '../themed/SelectableRow'
import { ListModal } from './ListModal'

type Props = {
  countryCode: string,
  bridge: AirshipBridge<string>
}

export const CountryListModal = ({ countryCode = getCountry() ?? 'US', bridge }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const generateTestHook = useCavy()

  const rowComponent = ({ filename, name, 'alpha-2': alpha }: CountryData) => {
    const logoName = filename ?? name.toLowerCase().replace(' ', '-')
    const source = { uri: `${FLAG_LOGO_URL}/${logoName}.png` }

    return (
      <SelectableRow
        onPress={() => bridge.resolve(alpha)}
        icon={<FastImage source={source} style={styles.image} />}
        title={name}
        subTitle={alpha}
        arrowTappable
        autoWidthContent
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
      ref={generateTestHook('CounrtyListModal.Close')}
    />
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  image: {
    height: theme.rem(2),
    width: theme.rem(2)
  }
}))
