// @flow

import { scale } from '../../lib/scaling'
import THEME from '../../theme/variables/airbitz'

export const styles = {
  top: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  bottom: {
    flex: 1
  },
  momentText: {
    color: THEME.COLORS.WHITE,
    width: '100%',
    textAlign: 'center',
    fontSize: scale(18),
    marginBottom: scale(20)
  },
  findingText: {
    color: THEME.COLORS.WHITE,
    width: '100%',
    textAlign: 'center',
    fontSize: scale(14)
  }
}
