import { EdgeTokenId } from 'edge-core-js'
import qrcodeGenerator from 'qrcode-generator'
import * as React from 'react'
import { ActivityIndicator, View, ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { EdgeTouchableWithoutFeedback } from '../common/EdgeTouchableWithoutFeedback'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props {
  /** Nothing will show if undefined */
  data?: string
  marginRem?: number[] | number
  /** Display the asset icon in the center of the QR */
  tokenId?: EdgeTokenId
  /** Display the asset icon in the center of the QR */
  pluginId: string
  onPress?: () => void
}

export function QrCode(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { data, marginRem, pluginId, tokenId = null, onPress } = props

  const margin = sidesToMargin(mapSides(fixSides(marginRem, 2), theme.rem))

  // Scale the surface to match the container's size:
  const [size, setSize] = React.useState<number>(0)

  const handleLayout = (event: any) => {
    setSize(event.nativeEvent.layout.height)
  }
  // Generate an SVG path:
  const cellsPadding = 1
  const code = qrcodeGenerator(0, 'H')
  code.addData(data ?? '')
  code.make()
  const svg = code.createSvgTag(1, cellsPadding)
  const path = svg.replace(/.*d="([^"]*)".*/, '$1')

  // Handle animation:
  const derivedData = useDerivedValue(() => data)
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(derivedData.value != null ? 1 : 0)
  }))

  // Create a drawing transform to scale QR cells to device pixels:
  const sizeInCells = code.getModuleCount() + 2 * cellsPadding
  const viewBox = `0 0 ${sizeInCells} ${sizeInCells}`

  // Calculate crypto icon size and its parent background container
  const iconContainerSize = size * 0.2
  const iconContainerStyle = React.useMemo<ViewStyle>(
    () => ({
      position: 'absolute',
      width: iconContainerSize,
      height: iconContainerSize,
      borderRadius: theme.cardBorderRadius,
      backgroundColor: theme.qrBackgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
      left: '50%',
      top: '50%',
      marginLeft: -iconContainerSize / 2,
      marginTop: -iconContainerSize / 2
    }),
    [iconContainerSize, theme.cardBorderRadius, theme.qrBackgroundColor]
  )
  // 80% of parent container to add some padding
  const iconSizeRem = (iconContainerSize * 0.8) / theme.rem(1)

  const icon = (
    <View style={iconContainerStyle}>
      <CryptoIcon pluginId={pluginId} tokenId={tokenId} sizeRem={iconSizeRem} />
    </View>
  )

  return (
    <EdgeTouchableWithoutFeedback onPress={onPress}>
      <View style={[styles.container, margin]} onLayout={handleLayout}>
        <ActivityIndicator color={theme.iconTappable} />
        <Animated.View style={[styles.whiteBox, fadeStyle]}>
          {size <= 0 ? null : (
            <View style={styles.whiteBoxInner}>
              <Svg height="100%" width="100%" viewBox={viewBox}>
                <Path d={path} fill={theme.qrForegroundColor} />
              </Svg>
            </View>
          )}
          {icon}
        </Animated.View>
      </View>
    </EdgeTouchableWithoutFeedback>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  whiteBoxInner: {
    flex: 1,
    margin: theme.rem(0.5),
    aspectRatio: 1
  },
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    aspectRatio: 1,
    flex: 1,
    justifyContent: 'center'
  },
  whiteBox: {
    backgroundColor: theme.qrBackgroundColor,
    borderRadius: theme.rem(0.5),
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center'
  }
}))
