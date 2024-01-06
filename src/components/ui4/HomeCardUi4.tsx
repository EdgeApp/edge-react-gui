import * as React from 'react'
import { View } from 'react-native'
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

  const handlePress = useHandler(() => {
    onPress()
  })

  return (
    <CardUi4 gradientBackground={gradientBackground} nodeBackground={nodeBackground} onPress={handlePress}>
      <View style={styles.verticalSplitContainer}>
        <View style={styles.titleContainer}>
          <EdgeText style={theme.cardTextShadow}>{title}</EdgeText>
          <IonIcon size={theme.rem(1.25)} style={[styles.chevronIcon, theme.cardTextShadow]} color={theme.iconTappable} name="chevron-forward-outline" />
        </View>
        <EdgeText style={[styles.footerText, theme.cardTextShadow]} numberOfLines={3} disableFontScaling>
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
    alignItems: 'stretch'
  },
  footerText: {
    fontSize: theme.rem(0.75)
  },
  verticalSplitContainer: {
    flex: 1, // Make sure the card fills the space
    justifyContent: 'space-between', // Aligns title to the top, footer to the bottom
    margin: theme.rem(0.5)
  },

  // Adjust for bounding box
  chevronIcon: {
    alignSelf: 'center',
    marginRight: -6
  }
}))
