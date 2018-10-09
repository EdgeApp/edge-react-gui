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
  actionButtonContainer: {
    width: '90%',
    height: THEME.BUTTONS.HEIGHT
  },
  timerContainer: {
    container: {
      width: 1,
      height: 1
    }
  },
  confirmModal: {
    middle: {
      container: {
        width: '100%'
      },
      sliderParent: {
        position: 'relative',
        backgroundColor: THEME.COLORS.SECONDARY,
        borderRadius: 40,
        marginBottom: scale(10),
        marginLeft: 0,
        marginRight: 0,
        width: '100%',
        maxWidth: 270,
        alignSelf: 'center'
      },
      currencyIcon: {
        height: scale(25),
        width: scale(25),
        resizeMode: 'contain'
      },
      altCurrencyText: {
        color: THEME.COLORS.PRIMARY,
        fontSize: scale(14)
      },
      top: {
        flex: 4,
        flexDirection: 'row',
        marginBottom: scale(20)
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
        height: scale(10),
        backgroundColor: THEME.COLORS.WHITE
      },
      bottom: {
        flex: 4,
        flexDirection: 'row',
        marginBottom: scale(20)
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
      justifyContent: 'center',
      alignSelf: 'center',
      height: scale(35)
    },
    bottomButton: {
      color: THEME.COLORS.GRAY_2,
      fontSize: scale(17),
      marginBottom: scale(10)
    },
    icon: {
      color: THEME.COLORS.SECONDARY,
      backgroundColor: THEME.COLORS.TRANSPARENT,
      width: 26,
      height: scale(26)
    },
    iconSize: scale(26)
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
