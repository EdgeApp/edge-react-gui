// @flow

import { Shape, Surface, Transform } from '@react-native-community/art'
import qrcodeGenerator from 'qrcode-generator'
import React from 'react'

type Props = {
  data: string,
  size: number, // In device pixels
  padding?: number, // In QR cells
  backgroundColor?: string,
  foregroundColor?: string
}

/**
 * Renders a QR code.
 */
export function QrCode (props: Props) {
  const { data, size, padding = 1, backgroundColor = 'white', foregroundColor = 'black' } = props

  // Generate an SVG path:
  const code = qrcodeGenerator(0, 'H')
  code.addData(data)
  code.make()
  const svg = code.createSvgTag(1, padding)
  const path = svg.replace(/.*d="([^"]*)".*/, '$1')

  // Create a drawing transform to scale QR cells to device pixels:
  const sizeInCells = code.getModuleCount() + 2 * padding
  const transform = new Transform().scale(size / sizeInCells)

  return (
    <Surface height={size} width={size} style={{ backgroundColor }}>
      <Shape d={path} fill={foregroundColor} transform={transform} />
    </Surface>
  )
}
