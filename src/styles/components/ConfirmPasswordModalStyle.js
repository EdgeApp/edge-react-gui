/* eslint-disable flowtype/require-valid-file-annotation */

import THEME from '../../theme/variables/airbitz'

const ConfirmPasswordModalStyle = {
  middle: {
    container: {
      width: '100%'
    },
    top: {
      flex: 4,
      flexDirection: 'row'
    },
    topRight: {
      flex: 8
    },
    topLeft: {
      flex: 2,
      flexDirection: 'column',
      alignItems: 'center'
    },
    shim: {
      height: 10,
      backgroundColor: THEME.COLORS.WHITE
    },
    clearShim: {
      height: 20
    },
    bottom: {
      flex: 4,
      flexDirection: 'row'
    },
    bottomRight: {
      flex: 8
    },
    bottomLeft: {
      flex: 2,
      flexDirection: 'column',
      alignItems: 'center'
    },
    text: {
      color: THEME.COLORS.GRAY_1
    }
  },
  bottom: {
    width: '100%'
  },
  bottomActivity: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  icon: {
    color: THEME.COLORS.SECONDARY,
    position: 'relative',
    alignItems: 'center',
    textAlign: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  iconSize: 48
}

export { ConfirmPasswordModalStyle }
