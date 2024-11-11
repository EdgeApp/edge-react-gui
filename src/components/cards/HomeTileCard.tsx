import * as React from 'react'
import { View } from 'react-native'
import { LinearGradientProps } from 'react-native-linear-gradient'

import { useHandler } from '../../hooks/useHandler'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

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
export const HomeTileCard = (props: Props) => {
  const { title, footer, gradientBackground, nodeBackground, onPress } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const handlePress = useHandler(() => {
    onPress()
  })

  return (
    <EdgeCard gradientBackground={gradientBackground} nodeBackground={nodeBackground} onPress={handlePress} fill>
      <View style={styles.verticalSplitContainer}>
        <EdgeText style={theme.cardTextShadow}>{title}</EdgeText>
        <EdgeText style={styles.footerText} numberOfLines={3} disableFontScaling>
          {footer}
        </EdgeText>
      </View>
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  footerText: {
    fontSize: theme.rem(0.75),
    ...theme.cardTextShadow
  },
  verticalSplitContainer: {
    flex: 1, // Make sure the card fills the space evenly compared to the other HomeCards
    justifyContent: 'space-between', // Aligns title to the top, footer to the bottom
    margin: theme.rem(0.5)
  }
}))
