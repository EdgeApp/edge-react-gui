import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { Fontello } from '../../assets/vector'
import { useHandler } from '../../hooks/useHandler'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'

interface Props {
  /** Artwork from the dApp's WalletConnect metadata, via `pickDAppIconUri` */
  uri?: string
  sizeRem?: number
}

/**
 * Artwork for a WalletConnect dApp. Missing, unsupported, or broken artwork
 * falls back to the WalletConnect glyph from the side menu, which is
 * neutral: it says nothing about whether the dApp is legitimate.
 */
export const DAppIcon: React.FC<Props> = props => {
  const { uri, sizeRem = 2 } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  // Remembering which uri failed resets the fallback when the uri changes:
  const [failedUri, setFailedUri] = React.useState<string | undefined>()

  const size = theme.rem(sizeRem)
  const sizeStyle = React.useMemo(() => ({ height: size, width: size }), [size])
  const source = React.useMemo(() => ({ uri }), [uri])

  const handleError = useHandler(() => {
    setFailedUri(uri)
  })

  if (uri == null || uri === failedUri) {
    return (
      <View style={[styles.fallback, sizeStyle]} testID="dAppIconFallback">
        <Fontello
          name="control-panel-wallet-connect"
          size={size}
          color={theme.icon}
        />
      </View>
    )
  }

  return (
    <FastImage
      resizeMode="contain"
      source={source}
      style={sizeStyle}
      testID="dAppIconImage"
      onError={handleError}
    />
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center'
  }
}))

/**
 * Picks the first dApp icon the app can draw. SVG is not supported by
 * FastImage, and relative paths have no host to load from.
 */
export const pickDAppIconUri = (
  icons: readonly string[] | undefined
): string | undefined => icons?.find(isDrawableIconUri)

const isDrawableIconUri = (uri: string): boolean => {
  const lowerUri = uri.toLowerCase()
  if (lowerUri.startsWith('data:image/')) {
    return !lowerUri.startsWith('data:image/svg')
  }
  if (!/^https?:\/\/[^/]/.test(lowerUri)) return false
  const path = lowerUri.split(/[?#]/)[0]
  return !path.endsWith('.svg')
}
