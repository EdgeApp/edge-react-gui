import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { useTheme } from '../services/ThemeContext'

// Zoom factor to crop out edge artifacts from source images
const ZOOM_FACTOR = 1.02

interface Props {
  imageUrl: string
  /** Size in rem units. Default is 3 */
  sizeRem?: number
}

/**
 * A circular icon with border, commonly used for brand logos.
 * Image is slightly zoomed and cropped to hide edge artifacts.
 */
export const CircularBrandIcon: React.FC<Props> = props => {
  const { imageUrl, sizeRem = 3 } = props
  const theme = useTheme()
  const size = theme.rem(sizeRem)

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: theme.cardBorder,
    borderColor: theme.cardBorderColor,
    overflow: 'hidden' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const
  }

  // Make image larger than container to zoom in and hide edge artifacts
  const imageSize = size * ZOOM_FACTOR
  const imageStyle = {
    width: imageSize,
    height: imageSize
  }

  return (
    <View style={containerStyle}>
      <FastImage
        source={{ uri: imageUrl }}
        style={imageStyle}
        resizeMode={FastImage.resizeMode.cover}
      />
    </View>
  )
}
