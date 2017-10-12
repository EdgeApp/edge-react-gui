import * as Styles from '../indexStyles'
import THEME from '../../theme/variables/airbitz'
import {Image} from 'react-native'
const CryptoExchangeSceneStyle = {
  scene: Styles.SceneContainer,
  styleCatch:Styles,
  mainScrollView: {
    flex: 1,
  },
  scrollViewContentContainer: {
    alignItems:'center'
  },
  exchangeRateBanner : {
    container: {
      display:'flex',
      width:'100%',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-around',
      height: 26,
      backgroundColor: THEME.COLORS.PRIMARY
    },
    text: {
      color: THEME.COLORS.WHITE
    }
  },
  shim: {
    height:20
  },
  flipButton: Styles.IconButtonStyle,
  actionButtonContainer: {
    width: '90%',
    height: THEME.BUTTONS.HEIGHT
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
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'space-around'
    },
    walletSelector: Styles.TextAndIconButtonStyle,
    iconContainer:{

    },
    currencyIcon: {
      backgroundColor: THEME.COLORS.WHITE,
      borderRadius: 15,
      height: 31,
      width: 31,
      resizeMode: Image.resizeMode.contain
    },

    flipInput: {
      flex: 2
    },
    fee: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-around'

    },
    feeText: {
      color: THEME.COLORS.WHITE
    }
  }
}

export {CryptoExchangeSceneStyle}
