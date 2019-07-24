// @flow

import { Dimensions } from 'react-native'
const { width, height } = Dimensions.get('window')

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 320
const guidelineBaseHeight = 568

// Differences between current sizes and guideline sizes:
const ratioHorizontal = (width - guidelineBaseWidth) / guidelineBaseWidth
const ratioVertical = (height - guidelineBaseHeight) / guidelineBaseHeight

export const scaleH = (size: number, factor: number = 0.3) => {
  return size + size * factor * ratioHorizontal
}

export const scaleV = (size: number, factor: number = 0.3) => {
  return size + size * factor * ratioVertical
}

export { scaleV as scale }
