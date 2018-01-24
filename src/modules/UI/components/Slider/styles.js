import {StyleSheet} from 'react-native'
import THEME from '../../../../theme/variables/airbitz'

const styles = StyleSheet.create({
  container: {
    marginVertical: 30,
    marginHorizontal: 30
  },
  slider: {
    backgroundColor: `${THEME.COLORS.PRIMARY}${THEME.ALPHA.LOW}`,
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
    fontSize: 18,
    position: 'absolute',
    color: THEME.COLORS.WHITE,
    alignSelf: 'center',
    top: 17,
    zIndex: -100
  }
})

export default styles
