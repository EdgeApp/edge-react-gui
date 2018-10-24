// @flow

import { Dimensions } from 'react-native'
const { width, height } = Dimensions.get('window')

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 320
const guidelineBaseHeight = 568

const scaleVertical = size => {
  const out = (height / guidelineBaseHeight) * size
  return out
}

const scaleHorizontal = size => {
  const out = (width / guidelineBaseWidth) * size
  return out
}

export const scaleH = (size: number, factor: number = 0.3) => {
  const out = size + (scaleHorizontal(size) - size) * factor
  return out
}

export const scaleV = (size: number, factor: number = 0.3) => {
  const out = size + (scaleVertical(size) - size) * factor
  return out
}

export { scaleV as scale }
