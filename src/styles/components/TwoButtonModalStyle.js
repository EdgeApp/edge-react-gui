/* eslint-disable flowtype/require-valid-file-annotation */

import THEME from '../../theme/variables/airbitz'

const TwoButtonModalStyle = {
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
      color: THEME.COLORS.GRAY_1,
      textAlign: 'center',
      fontFamily: THEME.FONTS.DEFAULT
    }
  },
  bottom: {
    width: '100%'
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

export { TwoButtonModalStyle }
