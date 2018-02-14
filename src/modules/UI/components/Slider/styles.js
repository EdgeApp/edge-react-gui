import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'

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
    fontSize: 16,
    position: 'absolute',
    color: THEME.COLORS.WHITE,
    alignSelf: 'center',
    top: 15,
    zIndex: -100
  }
})

export default styles
