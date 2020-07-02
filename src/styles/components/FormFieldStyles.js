// @flow

import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform.js'

export const MaterialInputOnWhite = {
  container: {
    position: 'relative',
    width: PLATFORM.deviceWidth / 1.52,
    height: 60
  },
  baseColor: THEME.COLORS.PRIMARY,
  tintColor: THEME.COLORS.SECONDARY,
  errorColor: THEME.COLORS.ACCENT_RED,
  textColor: THEME.COLORS.BLACK,
  affixTextStyle: {
    color: THEME.COLORS.ACCENT_RED
  },
  titleTextStyle: {
    // color: THEME.COLORS.PRIMARY // this causes the forms to have a default text color EVEN ON ERROR
  }
}
