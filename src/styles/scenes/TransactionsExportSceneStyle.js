// @flow

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

export const styles = {
  actionButtonContainer: {
    alignSelf: 'center',
    width: '90%',
    height: scale(THEME.BUTTONS.HEIGHT)
  },
  shim: {
    height: scale(20)
  }
}
