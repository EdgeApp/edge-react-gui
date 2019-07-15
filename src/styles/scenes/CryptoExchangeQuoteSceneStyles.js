// @flow

import { scale } from '../../lib/scaling'
import THEME from '../../theme/variables/airbitz'

export const styles = {
  topRow: {
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: scale(20)
  },
  centerRow: {
    alignItems: 'center'
  },
  confirmTextRow: {
    paddingVertical: scale(20),
    alignItems: 'center',
    justifyContent: 'center'
  },
  bottomRow: {
    alignItems: 'center'
  },
  slideContainer: {
    height: scale(35),
    width: 270
  },
  logoImage: {
    position: 'relative',
    width: '100%',
    height: scale(90),
    resizeMode: 'contain'
  },
  confirmText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(14),
    width: '100%',
    textAlign: 'center'
  },
  timerContainer: {
    container: {
      width: 1,
      height: 1
    }
  },
  quoteDetailContainer: {
    container: {
      width: '90%',
      borderRadius: 3
    },
    containerCollapsed: {
      width: '100%',
      minHeight: scale(65),
      backgroundColor: THEME.COLORS.OPACITY_WHITE,
      borderRadius: 3
    },
    containerExpanded: {
      width: '100%',
      height: scale(110),
      backgroundColor: THEME.COLORS.OPACITY_WHITE,
      borderRadius: 3
    },
    headlineEstimateText: {
      color: THEME.COLORS.ACCENT_ORANGE,
      fontSize: scale(14),
      height: scale(16)
    },
    headlineRow: {
      flex: 1,
      flexDirection: 'row',
      paddingTop: scale(10),
      paddingBottom: scale(10),
      alignItems: 'center',
      height: 40,
      marginTop: 5,
      marginBottom: 5
    },
    iconButton: {
      container: {
        width: 15,
        height: scale(15),
        justifyContent: 'space-around',
        alignItems: 'center',
        marginLeft: 5
      },
      icon: {
        color: THEME.COLORS.ACCENT_ORANGE
      },
      iconPressed: {
        color: THEME.COLORS.ACCENT_ORANGE
      },
      iconSize: scale(15),
      underlayColor: THEME.COLORS.TRANSPARENT
    },
    headlineText: {
      color: THEME.COLORS.WHITE,
      fontSize: scale(14),
      paddingTop: scale(10),
      paddingBottom: scale(10)
    },
    minerFeeText: {
      color: THEME.COLORS.WHITE,
      fontSize: scale(14),
      paddingTop: scale(10),
      paddingBottom: scale(10)
    },
    minerFeeRightText: {
      color: THEME.COLORS.WHITE,
      fontSize: scale(14),
      paddingTop: scale(10),
      paddingBottom: scale(10),
      alignSelf: 'flex-end'
    },
    currencyNameText: {
      color: THEME.COLORS.WHITE,
      fontSize: scale(16),
      paddingTop: scale(10),
      paddingLeft: scale(10)
    },
    cryptoAmountText: {
      color: THEME.COLORS.WHITE,
      fontSize: scale(16),
      paddingTop: scale(10),
      paddingRight: scale(10),
      textAlign: 'right'
    },
    walletNameText: {
      color: THEME.COLORS.WHITE,
      fontSize: scale(16),
      paddingLeft: scale(10)
    },
    fiatAmountText: {
      color: THEME.COLORS.WHITE,
      fontSize: scale(16),
      paddingRight: 10,
      textAlign: 'right'
    },
    topRow: {
      height: scale(65),
      flexDirection: 'row'
    },
    bottomRow: {
      height: scale(45),
      paddingRight: 10,
      paddingLeft: 10
    },
    bottomContentBox: {
      borderTopWidth: 1,
      flexDirection: 'row',
      borderColor: THEME.COLORS.WHITE
    },
    bottomContentBoxLeft: {
      flex: 1
    },
    bottomContentBoxRight: {
      flex: 1,
      justifyContent: 'flex-end'
    },
    walletInfoContainer: {
      flex: 8,
      alignItems: 'flex-start'
    },
    amountInfoContainer: {
      flex: 11,
      alignItems: 'flex-end'
    },
    logoContainer: {
      flex: 2,
      alignItems: 'center',
      paddingTop: scale(10),
      paddingLeft: 5
    },
    iconContainer: {
      position: 'relative',
      height: scale(29),
      width: scale(29),
      backgroundColor: THEME.COLORS.OPACITY_WHITE,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'space-around'
    },
    currencyIcon: {
      height: scale(25),
      width: scale(25),
      resizeMode: 'contain'
    },
    altCurrencyText: {
      color: THEME.COLORS.WHITE,
      fontSize: scale(14)
    }
  }
}
