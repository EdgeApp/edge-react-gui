import { Image, type ImageProps } from 'expo-image'
import * as React from 'react'
import type { ImageStyle as RnImageStyle, StyleProp } from 'react-native'

export type ImageStyle = RnImageStyle

const resizeMode = {
  contain: 'contain',
  cover: 'cover',
  stretch: 'stretch',
  center: 'center'
} as const

type ResizeMode = (typeof resizeMode)[keyof typeof resizeMode]

export interface FastImageProps {
  source: ImageProps['source']
  style?: StyleProp<RnImageStyle>
  resizeMode?: ResizeMode
  onError?: () => void
  onLoad?: () => void
  children?: React.ReactNode
  testID?: string
  accessibilityHint?: string
  accessibilityLabel?: string
}

const FastImageInner: React.FC<FastImageProps> = props => {
  const { resizeMode: mode, onError, onLoad, ...rest } = props
  const contentFit =
    mode === 'stretch' ? 'fill' : mode === 'center' ? 'none' : mode

  return (
    <Image
      {...rest}
      contentFit={contentFit}
      onError={
        onError == null
          ? undefined
          : () => {
              onError()
            }
      }
      onLoad={
        onLoad == null
          ? undefined
          : () => {
              onLoad()
            }
      }
    />
  )
}

export const FastImage = Object.assign(FastImageInner, { resizeMode })

export default FastImage
