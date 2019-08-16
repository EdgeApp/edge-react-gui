// @flow

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

const CryptoExchangeWalletListRowStyle = {
  touchable: {},
  underlayColor: THEME.COLORS.TRANSPARENT,
  container: {
    width: '100%'
  },
  containerToken: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.OFF_WHITE
  },
  rowContainerTop: {
    width: '100%',
    height: scale(60),
    flexDirection: 'row'
  },
  rowContainerBottom: {
    width: '100%'
  },
  containerLeft: {
    flex: 2,
    justifyContent: 'space-around'
  },
  containerCenter: {
    flex: 9,
    flexDirection: 'row',
    alignItems: 'center'
  },
  containerRight: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'space-around',
    flexDirection: 'row'
  },
  imageContainer: {
    height: scale(20)
  },
  holderView: {
    width: '80%',
    paddingRight: 10
  },
  balanceTextStyle: {
    fontFamily: THEME.FONTS.DEFAULT,
    textAlign: 'right'
  },
  createText: {
    fontFamily: THEME.FONTS.DEFAULT,
    textAlign: 'right',
    marginRight: 10
  }
}

export { CryptoExchangeWalletListRowStyle }
