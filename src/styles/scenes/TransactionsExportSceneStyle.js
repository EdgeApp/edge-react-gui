// @flow

import { scale } from '../../lib/scaling.js'
import THEME from '../../theme/variables/airbitz'

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
