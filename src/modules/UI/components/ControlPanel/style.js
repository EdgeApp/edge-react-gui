// @flow

import THEME from '../../../../theme/variables/airbitz'
import { scale } from '../../../../util/scaling.js'

export default {


  header: {
    backgroundColor: THEME.COLORS.ACCENT_BLUE,
    height: scale(48),
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: scale(12)
  },
  logoIcon: {
    width: scale(25),
    height: scale(25)
  },
  exchangeContainer: {
    paddingHorizontal: scale(20)
  },
  toggleIcon: {
    fontSize: scale(18),
    color: THEME.COLORS.GRAY_4
  },
  toggleButton: {
    backgroundColor: THEME.COLORS.PRIMARY,
    height: scale(58),
    justifyContent: 'flex-start',
    alignItems: 'center'
  },


  /// ///////////////////////////////////////////////////

  userList: {
    container: {
      backgroundColor: THEME.COLORS.WHITE,
      flex: 1
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      borderStyle: 'solid',
      borderColor: THEME.COLORS.GRAY_4,
      borderBottomWidth: 0.5
    },
    textContainer: {
      flex: 1,
      paddingVertical: scale(13),
      marginLeft: scale(20)
    },
    text: {
      fontSize: scale(16)
    },
    icon: {
      padding: scale(13)
    }
  },
  underlay: {
    color: `${THEME.COLORS.PRIMARY}${THEME.ALPHA.LOW}`
  },
  exchangeRateText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16)
  }
}
