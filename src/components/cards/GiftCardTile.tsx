import * as React from 'react'
import {
  type DimensionValue,
  StyleSheet,
  View,
  type ViewStyle
} from 'react-native'
import FastImage from 'react-native-fast-image'

import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

// Zoom factor to crop out edge artifacts from source images
const ZOOM_FACTOR = 1.05

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

// Style for the zoomed image container to crop out edge artifacts
const zoomedContainerStyle: ViewStyle = {
  position: 'absolute',
  width: `${ZOOM_FACTOR * 100}%` as DimensionValue,
  height: `${ZOOM_FACTOR * 100}%` as DimensionValue,
  top: `${((ZOOM_FACTOR - 1) / 2) * -100}%` as DimensionValue,
  left: `${((ZOOM_FACTOR - 1) / 2) * -100}%` as DimensionValue
}

/**
 * Gift card tile displaying brand image, name, and price range.
 * Square aspect ratio with image filling vertically.
 */
export const GiftCardTile: React.FC<Props> = props => {
  const { brandName, priceRange, imageUrl, onPress } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const imageBackground =
    imageUrl !== '' ? (
      <View style={zoomedContainerStyle}>
        <FastImage
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode={FastImage.resizeMode.cover}
        />
      </View>
    ) : null

  return (
    <View style={styles.squareContainer}>
      <EdgeCard
        nodeBackground={imageBackground}
        gradientBackground={OVERLAY_GRADIENT}
        onPress={onPress}
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
          <EdgeText style={styles.footerText} numberOfLines={2}>
            {priceRange}
          </EdgeText>
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
