import * as React from 'react'
import { Platform, View } from 'react-native'
import { LinearGradientProps } from 'react-native-linear-gradient'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { useHandler } from '../../hooks/useHandler'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { CardUi4 } from './CardUi4'

interface Props {
  title: string
  footer: string
  gradientBackground: LinearGradientProps
  nodeBackground: React.ReactNode
  onPress: () => void
}

/**
 * Tappable card that shows a corner chevron, background, and title
 */
export const HomeCardUi4 = (props: Props) => {
  const { title, footer, gradientBackground, nodeBackground, onPress } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const textShadow = Platform.OS === 'ios' ? theme.shadowTextIosUi4 : theme.shadowTextAndroidUi4

  const handlePress = useHandler(() => {
    onPress()
  })

  return (
    <CardUi4 gradientBackground={gradientBackground} nodeBackground={nodeBackground} onPress={handlePress}>
      <View style={styles.titleContainer}>
        <EdgeText style={textShadow}>{title}</EdgeText>

        <IonIcon size={theme.rem(1.25)} style={[styles.chevronIcon, textShadow]} color={theme.iconTappable} name="chevron-forward-outline" />
      </View>
      <View style={styles.footerContainer}>
        <EdgeText style={[styles.footerText, textShadow]} numberOfLines={2}>
          {footer}
        </EdgeText>
      </View>
    </CardUi4>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    margin: theme.rem(0.25),
    marginBottom: theme.rem(4)
  },
  footerContainer: {
    margin: theme.rem(0.25)
  },
  footerText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryTextUi4
  },

  // Adjust for bounding box
  chevronIcon: {
    alignSelf: 'center',
    marginRight: -6
  }
}))
