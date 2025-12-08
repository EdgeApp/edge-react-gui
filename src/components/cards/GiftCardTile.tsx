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

/**
 * Gift card tile displaying brand image, name, and price range.
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
    <EdgeCard nodeBackground={imageBackground} onPress={handlePress} fill>
      <View style={styles.contentContainer}>
        <EdgeText style={[theme.cardTextShadow, styles.titleText]}>
          {brandName}
        </EdgeText>
        <EdgeText
          style={styles.footerText}
          numberOfLines={2}
          disableFontScaling
        >
          {priceRange}
        </EdgeText>
      </View>
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
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

