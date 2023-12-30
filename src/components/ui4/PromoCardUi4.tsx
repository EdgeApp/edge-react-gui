import { PromoCard2 } from 'edge-info-server/types'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { linkReferralWithCurrencies } from '../../actions/WalletListActions'
import { useHandler } from '../../hooks/useHandler'
import { getLocaleOrDefaultString } from '../../locales/intl'
import { useDispatch } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ButtonUi4 } from './ButtonUi4'
import { CardUi4 } from './CardUi4'

interface Props {
  navigation: NavigationBase
  promoInfo: PromoCard2
}

export function PromoCardUi4Component(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const { navigation, promoInfo } = props
  const { localeMessages, ctaButton, background } = promoInfo

  const backgroundInfo = theme.isDark ? background.darkMode : background.lightMode
  const { backgroundGradientColors, backgroundGradientEnd, backgroundGradientStart, imageUri } = backgroundInfo

  const message = getLocaleOrDefaultString(localeMessages)
  const ctaLabel = ctaButton == null ? null : getLocaleOrDefaultString(ctaButton.localeLabels)

  const handlePress = useHandler(() => {
    if (ctaButton == null) return
    const { url } = ctaButton

    dispatch(linkReferralWithCurrencies(navigation, url)).catch(err => showError(err))
  })

  const handleClose = useHandler(() => {})

  return (
    <CardUi4
      onClose={handleClose}
      gradientBackground={{ colors: backgroundGradientColors, start: backgroundGradientStart, end: backgroundGradientEnd }}
      nodeBackground={
        <View style={styles.backgroundContainer}>
          <FastImage
            source={{
              uri: imageUri
            }}
            style={styles.backgroundImage}
            resizeMode="stretch"
          />
        </View>
      }
    >
      <View style={styles.contentContainer}>
        <EdgeText numberOfLines={3}>{message}</EdgeText>
        {ctaLabel == null ? null : (
          <View style={styles.cornerButtonContainer}>
            <ButtonUi4 layout="row" type="secondary" label={ctaLabel} onPress={handlePress} />
          </View>
        )}
      </View>
    </CardUi4>
  )
}
const getStyles = cacheStyles((theme: Theme) => ({
  backgroundContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end'
  },
  backgroundImage: {
    aspectRatio: 1,
    height: '100%'
  },
  contentContainer: {
    justifyContent: 'space-between',
    width: '75%', // Leave space for right-justified background image
    margin: theme.rem(0.5)
  },
  cornerButtonContainer: {
    marginTop: theme.rem(1),
    alignItems: 'flex-start'
  }
}))
