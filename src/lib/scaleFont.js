// @flow

import { PLATFORM } from '../theme/variables/platform.js'

const scaleFont = (fontSize: number) => {
  console.log(PLATFORM)
  const height = PLATFORM.deviceHeight
  if (height <= 550) {
    return fontSize
  }
  if (height > 551 && height <= 700) {
    return fontSize + (fontSize * 0.15) /// could also be just add fixed values like ( fontSize + 2 )
  }
  if (height > 701 && height <= 800) {
    return fontSize + (fontSize * 0.25)
  }
  if (height > 801 && height <= 1000) {
    return fontSize + (fontSize * 0.3)
  }
  if (height > 1001) {
    return fontSize + (fontSize * 0.45)
  }
}

export { scaleFont }
