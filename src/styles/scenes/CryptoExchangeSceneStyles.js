// @flow

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'
import { IconButtonStyle, TextAndIconButtonStyle } from '../indexStyles'

export const styles = {
  mainScrollView: {
    flex: 1
  },
  scrollViewContentContainer: {
    alignItems: 'center'
  },
  exchangeRateBanner: {
    container: {
      display: 'flex',
      width: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-around',
      height: scale(26),
      backgroundColor: THEME.COLORS.PRIMARY
    },
    containerError: {
      display: 'flex',
      width: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-around',
      height: scale(26),
      backgroundColor: THEME.COLORS.GRAY_4
    },
    text: {
      color: THEME.COLORS.ACCENT_MINT,
      textAlign: 'center',
      marginRight: '2%',
      marginLeft: '2%'
    },
    textError: {
      color: THEME.COLORS.PRIMARY,
      backgroundColor: THEME.COLORS.TRANSPARENT,
      fontSize: scale(10)
    }
  },
  arrowShim: {
    height: scale(8)
  },
  shim: {
    height: scale(20)
  },

  flipButton: IconButtonStyle,
  downArrow: {
    color: THEME.COLORS.WHITE
  },
  downArrowSize: scale(30),
  actionButtonContainer: {
    width: '90%'
  },
  flipWrapper: {
    container: {
      width: '90%',
      height: scale(176),
      backgroundColor: THEME.COLORS.OPACITY_WHITE,
      borderRadius: 3
    },
    containerNoFee: {
      width: '90%',
      backgroundColor: THEME.COLORS.OPACITY_WHITE,
      borderRadius: 3
    },
    containerNoWalletSelected: {
      paddingVertical: scale(10),
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center'
    },
    containerSelectedWalletNotFocus: {
      width: '90%',
      paddingVertical: scale(10),
      backgroundColor: THEME.COLORS.OPACITY_WHITE,
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center'
    },
    topRow: {
      height: scale(34),
      flexDirection: 'column',
      justifyContent: 'space-around',
      alignItems: 'center'
    },
    walletSelector: TextAndIconButtonStyle,
    noWalletSelected: {
      ...TextAndIconButtonStyle,
      textContainer: {},
      inner: {
        ...TextAndIconButtonStyle.inner,
        width: '100%',
        justifyContent: 'center'
      }
    },
    iconContainer: {
      height: scale(29),
      width: scale(29),
      backgroundColor: THEME.COLORS.TRANSPARENT,
      borderRadius: 15,
      marginRight: scale(8),
      marginLeft: scale(12)
    },
    altIconContainer: {
      position: 'absolute',
      flexDirection: 'row',
      top: 0,
      left: 5,
      height: scale(50),
      width: 200,
      alignItems: 'center'
    },
    currencyIcon: {
      height: scale(25),
      width: scale(25),
      resizeMode: 'contain'
    },
    altCurrencyText: {
      color: THEME.COLORS.WHITE,
      fontSize: scale(14)
    },
    flipInput: {
      // flex: 2
      height: scale(110)
    },
    fee: {
      height: scale(36),
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-around'
    },
    feeText: {
      color: THEME.COLORS.WHITE
    },
    flipInputColor: THEME.COLORS.WHITE
  }
}
