import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { cacheStyles, useTheme } from '../services/ThemeContext'

interface Props {
  imageUrl: string
  /** Size in rem units. Default is 3 */
  sizeRem?: number
}

/**
 * A circular icon with border, commonly used for brand logos.
 * Image is cropped to fill the circle.
 */
export const CircularBrandIcon: React.FC<Props> = props => {
  const { imageUrl, sizeRem = 3 } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const size = theme.rem(sizeRem)
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: theme.cardBorder,
    borderColor: theme.cardBorderColor,
    overflow: 'hidden' as const
  }

  return (
    <View style={containerStyle}>
      <FastImage
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode={FastImage.resizeMode.cover}
      />
    </View>
  )
}

const getStyles = cacheStyles(() => ({
  image: {
    width: '100%',
    height: '100%'
  }
}))

