import * as React from 'react'
import FastImage from 'react-native-fast-image'

import { FLAG_LOGO_URL } from '../../constants/CdnConstants'
import { COUNTRY_CODES } from '../../constants/CountryConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { cacheStyles, useTheme } from '../services/ThemeContext'
import { PillButton } from './PillButton'

interface Props {
  onPress: () => void | Promise<void>
}

/**
 * Displays just the country flag. For use in flows that only need country
 * selection (e.g., gift cards).
 */
export const CountryButton: React.FC<Props> = props => {
  const { onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const { countryCode } = useSelector(state => state.ui.settings)

  const countryData = React.useMemo(
    () => COUNTRY_CODES.find(c => c['alpha-2'] === countryCode),
    [countryCode]
  )

  const flagUri = React.useMemo(() => {
    if (countryData == null) return null
    const logoName =
      countryData.filename ?? countryData.name.toLowerCase().replace(' ', '-')
    return `${FLAG_LOGO_URL}/${logoName}.png`
  }, [countryData])

  const icon = useHandler(() => {
    return flagUri != null ? (
      <FastImage style={styles.flagIconSmall} source={{ uri: flagUri }} />
    ) : null
  })

  // Show placeholder text if no country selected, otherwise icon-only
  const label =
    countryCode === '' || countryData == null
      ? lstrings.buy_sell_crypto_select_country_button
      : undefined

  return (
    <PillButton
      aroundRem={0}
      leftRem={0.5}
      label={label}
      icon={icon}
      onPress={onPress}
    />
  )
}

/**
 * Displays the country flag with state/province and country name.
 * For use in flows that need full region selection (e.g., ramps).
 */
export const CountryStateButton: React.FC<Props> = props => {
  const { onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const { countryCode, stateProvinceCode } = useSelector(
    state => state.ui.settings
  )

  const countryData = React.useMemo(
    () => COUNTRY_CODES.find(c => c['alpha-2'] === countryCode),
    [countryCode]
  )

  const label = React.useMemo(() => {
    if (countryCode === '' || countryData == null) {
      return lstrings.buy_sell_crypto_select_country_button
    }
    if (stateProvinceCode != null && countryData.stateProvinces != null) {
      const stateProvince = countryData.stateProvinces.find(
        sp => sp['alpha-2'] === stateProvinceCode
      )
      if (stateProvince != null) {
        return `${stateProvince.name}, ${countryData['alpha-3']}`
      }
    }
    return countryData.name
  }, [countryCode, countryData, stateProvinceCode])

  const flagUri = React.useMemo(() => {
    if (countryData == null) return null
    const logoName =
      countryData.filename ?? countryData.name.toLowerCase().replace(' ', '-')
    return `${FLAG_LOGO_URL}/${logoName}.png`
  }, [countryData])

  const icon = useHandler(() => {
    return flagUri != null ? (
      <FastImage style={styles.flagIconSmall} source={{ uri: flagUri }} />
    ) : null
  })

  return (
    <PillButton
      aroundRem={0}
      leftRem={0.5}
      label={label}
      icon={icon}
      onPress={onPress}
    />
  )
}

const getStyles = cacheStyles((theme: ReturnType<typeof useTheme>) => ({
  flagIconSmall: {
    width: theme.rem(1),
    height: theme.rem(1),
    borderRadius: theme.rem(0.75)
  }
}))
