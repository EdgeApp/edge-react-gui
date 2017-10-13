import {StyleSheet} from 'react-native'
import THEME from '../../../../theme/variables/airbitz'

const styles = StyleSheet.create({
  container: {
    marginVertical: 30,
    marginHorizontal: 30
  },
  slider: {
    backgroundColor: THEME.COLORS.WHITE,
    opacity: THEME.OPACITY.LOW,
    overflow: 'hidden',
    borderRadius: 27,
    height: 55
  },
  thumb: {
    width: 52,
    height: 52,
    position: 'absolute',
    bottom: -26,
    backgroundColor: THEME.COLORS.WHITE,
    borderRadius: 100
  },
  textOverlay: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: 18,
    position: 'absolute',
    color: THEME.COLORS.WHITE,
    alignSelf: 'center',
    top: 17
  }
})

export default styles
