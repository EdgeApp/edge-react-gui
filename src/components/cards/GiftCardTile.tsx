import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { useHandler } from '../../hooks/useHandler'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  brandName: string
  priceRange: string
  imageUrl: string
  onPress: () => void
}

// Semi-transparent gradient to darken behind text for visibility
const OVERLAY_GRADIENT = {
  colors: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)'],
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 }
}

/**
 * Gift card tile displaying brand image, name, and price range.
 * Square aspect ratio with image filling vertically.
 */
export const GiftCardTile: React.FC<Props> = props => {
  const { brandName, priceRange, imageUrl, onPress } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const handlePress = useHandler(() => {
    onPress()
  })

  const imageBackground =
    imageUrl !== '' ? (
      <FastImage
        source={{ uri: imageUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode={FastImage.resizeMode.cover}
      />
    ) : null

  return (
    <View style={styles.squareContainer}>
      <EdgeCard
        nodeBackground={imageBackground}
        gradientBackground={OVERLAY_GRADIENT}
        onPress={handlePress}
        fill
      >
        <View style={styles.contentContainer}>
          <EdgeText
            style={[theme.cardTextShadow, styles.titleText]}
            numberOfLines={3}
            disableFontScaling
          >
            {brandName}
          </EdgeText>
          <EdgeText style={styles.footerText}>{priceRange}</EdgeText>
        </View>
      </EdgeCard>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  squareContainer: {
    aspectRatio: 1,
    width: '100%'
  },
  titleText: {
    marginBottom: theme.rem(0.5)
  },
  footerText: {
    fontSize: theme.rem(0.75),
    ...theme.cardTextShadow
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    margin: theme.rem(0.5)
  }
}))
