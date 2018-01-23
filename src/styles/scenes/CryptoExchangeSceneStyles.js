// @flow

import * as Styles from '../indexStyles'
import THEME from '../../theme/variables/airbitz'
import {Image} from 'react-native'
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
      height: 26,
      backgroundColor: THEME.COLORS.PRIMARY
    },
    containerError: {
      display: 'flex',
      width: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-around',
      height: 26,
      backgroundColor: THEME.COLORS.GRAY_4
    },
    text: {
      color: THEME.COLORS.WHITE,
      textAlign: 'center',
      marginRight: '2%',
      marginLeft: '2%'
    },
    textError: {
      color: THEME.COLORS.PRIMARY,
      backgroundColor: THEME.COLORS.TRANSPARENT,
      fontSize: 10
    }
  },
  shim: {
    height: 20
  },

  flipButton: Styles.IconButtonStyle,
  actionButtonContainer: {
    width: '90%',
    height: THEME.BUTTONS.HEIGHT
  },
  confirmModal: {
    middle: {
      container: {
        width: '100%'
      },
      currencyIcon: {
        height: 25,
        width: 25,
        resizeMode: Image.resizeMode.contain
      },
      altCurrencyText: {
        color: THEME.COLORS.PRIMARY,
        fontSize: 14
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
        color: THEME.COLORS.GRAY_1
      }
    },
    bottom: {
      width: '100%'
    },
    icon: {
      color: THEME.COLORS.SECONDARY,
      backgroundColor: THEME.COLORS.TRANSPARENT
    },
    iconSize: 48
  },
  flipWrapper: {
    container: {
      width: '90%',
      height: 176,
      backgroundColor: THEME.COLORS.SECONDARY
    },
    containerNoFee: {
      width: '90%',
      height: 144,
      backgroundColor: THEME.COLORS.SECONDARY
    },
    topRow: {
      height: 34,
      flexDirection: 'column',
      justifyContent: 'space-around'
    },
    walletSelector: {...Styles.TextAndIconButtonStyle,
      content: {...Styles.TextAndIconButtonStyle.content, position: 'relative', width: '80%'},
      centeredContent: {...Styles.TextAndIconButtonStyle.centeredContent, position: 'relative', width: '80%'}},
    iconContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      height: 29,
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
      height: 50,
      width: 200,
      alignItems: 'center'
    },
    currencyIcon: {
      height: 25,
      width: 25,
      resizeMode: Image.resizeMode.contain
    },
    altCurrencyText: {
      color: THEME.COLORS.WHITE,
      fontSize: 14
    },
    flipInput: {
      // flex: 2
      height: 110
    },
    fee: {
      height: 36,
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

export {CryptoExchangeSceneStyle}
