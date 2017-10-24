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
  confirmModal: {
    middle: {
      width:'100%',
      height:'100%',
      backgroundColor: THEME.COLORS.ACCENT_GREEN
    },
    bottom: {
      width:'100%',
      height:'100%',
      backgroundColor: THEME.COLORS.ACCENT_ORANGE
    },
    icon:{
      backgroundColor: THEME.COLORS.TRANSPARENT
    },
    iconSize: 36
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
      position:'absolute',
      top:0,
      left:0,
      height:29,
      width:29,
      backgroundColor: THEME.COLORS.TRANSPARENT,
      borderRadius: 15,
      alignItems:'center',
      justifyContent:'space-around'
    },
    altIconContainer:{
      position:'absolute',
      flexDirection: 'row',
      top:0,
      left:5,
      height:50,
      width:200,
      alignItems:'center'
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
    },
    flipInputColor: THEME.COLORS.WHITE
  }
}

export {CryptoExchangeSceneStyle}
