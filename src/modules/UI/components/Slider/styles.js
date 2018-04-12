/* eslint-disable flowtype/require-valid-file-annotation */

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'
import { PLATFORM } from '../../../../theme/variables/platform.js'

const styles = StyleSheet.create({
  container: {
    marginVertical: 30,
    marginHorizontal: 30
  },
  slider: {
    backgroundColor: THEME.COLORS.OPACITY_WHITE,
    overflow: 'hidden',
    borderRadius: 26,
    height: 52
  },
  thumb: {
    width: 52,
    height: 52,
    position: 'absolute',
    backgroundColor: THEME.COLORS.ACCENT_MINT,
    borderRadius: 52
  },
  textOverlay: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: PLATFORM.deviceWidth >= 320 ? 13 : 16,
    position: 'absolute',
    color: THEME.COLORS.WHITE,
    alignSelf: 'center',
    top: PLATFORM.deviceWidth >= 320 ? 19 : 16,
    zIndex: -100
  }
})

export default styles
