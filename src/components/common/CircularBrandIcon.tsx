import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { useTheme } from '../services/ThemeContext'

// Zoom factor to crop out edge artifacts from source images
const ZOOM_FACTOR = 1.0

interface Props {
  imageUrl: string
  /** Size in rem units. Default is 2 */
  sizeRem?: number
  /** Margin in rem units */
  marginRem?: number | number[]
}

/**
 * A circular icon with border, commonly used for brand logos.
 */
export const CircularBrandIcon: React.FC<Props> = props => {
  const { imageUrl, sizeRem = 2, marginRem } = props
  const theme = useTheme()
  const size = theme.rem(sizeRem)

  const marginStyle = sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))

  const containerStyle = React.useMemo(
    () => ({
      height: size,
      width: size,
      borderRadius: size / 2,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      overflow: 'hidden' as const,
      borderWidth: theme.cardBorder,
      borderColor: theme.cardBorderColor,
      ...marginStyle
    }),
    [size, theme, marginStyle]
  )

  // Make image larger than container to zoom in and hide edge artifacts
  const imageSize = size * ZOOM_FACTOR
  const imageStyle = React.useMemo(
    () => ({
      width: imageSize,
      height: imageSize
    }),
    [imageSize]
  )

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
