/* eslint-disable flowtype/require-valid-file-annotation */

import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform.js'

const MaterialInput = {
  container: {
    position: 'relative',
    width: PLATFORM.deviceWidth / 1.52,
    minHeight: 60
  },
  baseColor: THEME.COLORS.WHITE,
  tintColor: THEME.COLORS.ACCENT_MINT,
  errorColor: THEME.COLORS.ACCENT_RED,
  textColor: THEME.COLORS.WHITE,
  affixTextStyle: {
    color: THEME.COLORS.WHITE
  },
  titleTextStyle: {
    // color: THEME.COLORS.WHITE // this causes the forms to have a default text color EVEN ON ERROR
  }
}

const MaterialInputOnWhite = {
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
export { MaterialInputOnWhite }
export { MaterialInput }
