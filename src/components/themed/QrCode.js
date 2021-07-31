// @flow

import { Shape, Surface, Transform } from '@react-native-community/art'
import qrcodeGenerator from 'qrcode-generator'
import * as React from 'react'
import { View } from 'react-native'

import { useState } from '../../types/reactHooks'
import { getMarginSpacingStyles } from '../../util/edges'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'

type Props = {
  data: string,
  cellsPadding?: number, // In QR cells
  backgroundColor?: string,
  foregroundColor?: string,
  marginRem?: number[] | number
}

export function QrCode(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { data, cellsPadding = 1, backgroundColor = theme.qrBackgroundColor, foregroundColor = theme.qrForegroundColor, marginRem } = props

  const [qrCodeContainerHeight, setQrCodeContainerHeight] = useState<number>(0)

  const size = qrCodeContainerHeight - theme.rem(1)

  // Generate an SVG path:
  const code = qrcodeGenerator(0, 'H')
  code.addData(data)
  code.make()
  const svg = code.createSvgTag(1, cellsPadding)
  const path = svg.replace(/.*d="([^"]*)".*/, '$1')

  // Create a drawing transform to scale QR cells to device pixels:
  const sizeInCells = code.getModuleCount() + 2 * cellsPadding
  const transform = new Transform().scale(size / sizeInCells)

  const handleQrCodeLayout = (event: any) => {
    setQrCodeContainerHeight(event.nativeEvent.layout.height)
  }

  return (
    <View style={[styles.qrCode, getMarginSpacingStyles(marginRem ?? 2, theme.rem)]} onLayout={handleQrCodeLayout}>
      {qrCodeContainerHeight > theme.rem(1) && (
        <Surface height={size} width={size} style={{ backgroundColor }}>
          <Shape d={path} fill={foregroundColor} transform={transform} />
        </Surface>
      )}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  qrCode: {
    aspectRatio: 1,
    flex: 1,
    borderRadius: theme.rem(0.5),
    margin: theme.rem(2),
    padding: theme.rem(0.5),
    backgroundColor: theme.qrBackgroundColor
  }
}))
