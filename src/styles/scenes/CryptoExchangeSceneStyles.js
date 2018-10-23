// @flow

import { scale } from '../../lib/scaling'
import THEME from '../../theme/variables/airbitz'
import * as Styles from '../indexStyles'
const CryptoExchangeSceneStyle = {
  gradient: {
    height: THEME.SPACER.HEADER
  },
  scene: Styles.SceneContainer,
  styleCatch: Styles,
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
  shim: {
    height: scale(20)
  },

  flipButton: Styles.IconButtonStyle,
  downArrow: {
    color: THEME.COLORS.WHITE
  },
  downArrowSize: scale(36),
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
      justifyContent: 'space-around'
    },
    topRow: {
      height: scale(34),
      flexDirection: 'column',
      justifyContent: 'space-around'
    },
    walletSelector: Styles.TextAndIconButtonStyle,
    noWalletSelected: {
      ...Styles.TextAndIconButtonStyle,
      textContainer: {},
      inner: {
        ...Styles.TextAndIconButtonStyle.inner,
        width: '100%',
        justifyContent: 'center'
      }
    },
    iconContainer: {
      position: 'absolute',
      top: scale(3),
      left: 3,
      height: scale(29),
      width: 29,
      backgroundColor: THEME.COLORS.TRANSPARENT,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'space-around'
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

export { CryptoExchangeSceneStyle }
