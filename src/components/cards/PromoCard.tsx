import { PromoCard2 } from 'edge-info-server'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import LinearGradient from 'react-native-linear-gradient'

import { linkReferralWithCurrencies } from '../../actions/WalletListActions'
import { useHandler } from '../../hooks/useHandler'
import { getLocaleOrDefaultString } from '../../locales/intl'
import { useDispatch } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { EdgeButton } from '../buttons/EdgeButton'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

export interface FilteredPromoCard {
  background: PromoCard2['background']
  ctaButton: PromoCard2['ctaButton']
  dismissable: PromoCard2['dismissable']
  localeMessages: PromoCard2['localeMessages']
  pluginPromotions: PromoCard2['pluginPromotions']
  messageId: string
}

interface Props {
  navigation: NavigationBase
  promoInfo: FilteredPromoCard
  onClose: () => Promise<void>
}

export function PromoCardUi4(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const { navigation, promoInfo, onClose } = props
  const { localeMessages, ctaButton, background, dismissable } = promoInfo

  const backgroundInfo = theme.isDark ? background.darkMode : background.lightMode
  const { backgroundGradientColors, backgroundGradientEnd, backgroundGradientStart, imageUri } = backgroundInfo

  const message = getLocaleOrDefaultString(localeMessages)
  const ctaLabel = ctaButton == null ? null : getLocaleOrDefaultString(ctaButton.localeLabels)

  const handlePress = useHandler(async () => {
    if (ctaButton == null) return
    const { localeUrls } = ctaButton
    const url = getLocaleOrDefaultString(localeUrls)
    if (url == null) {
      showError('No PromoCard URL found')
      return
    }

    await dispatch(linkReferralWithCurrencies(navigation, url))
  })

  const imageSrc = React.useMemo(() => ({ uri: imageUri }), [imageUri])

  return (
    <EdgeCard
      onClose={dismissable ? onClose : undefined}
      nodeBackground={
        <LinearGradient colors={backgroundGradientColors} start={backgroundGradientStart} end={backgroundGradientEnd} style={styles.backgroundContainer}>
          <FastImage source={imageSrc} style={styles.backgroundImage} resizeMode="stretch" />
        </LinearGradient>
      }
    >
      <View style={styles.contentContainer}>
        <EdgeText numberOfLines={4} disableFontScaling style={styles.text}>
          {message}
        </EdgeText>
        {ctaLabel == null ? null : (
          <View style={styles.cornerButtonContainer}>
            <EdgeButton layout="solo" type="secondary" label={ctaLabel} mini onPress={handlePress} />
          </View>
        )}
      </View>
    </EdgeCard>
  )
}
const getStyles = cacheStyles((theme: Theme) => ({
  backgroundContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end'
  },
  text: {
    fontSize: theme.rem(0.75)
  },
  backgroundImage: {
    aspectRatio: 1,
    height: '100%'
  },
  contentContainer: {
    justifyContent: 'space-between',
    width: '70%', // Leave space for right-justified background image
    margin: theme.rem(0.5),
    height: theme.rem(7)
  },
  cornerButtonContainer: {
    alignSelf: 'flex-start'
  }
}))
