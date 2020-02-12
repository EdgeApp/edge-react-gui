// @flow

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

const CryptoExchangeWalletListRowStyle = {
  touchable: {},
  underlayColor: THEME.COLORS.TRANSPARENT,
  container: {
    width: '100%'
  },
  zeroBalance: {
    color: THEME.COLORS.GRAY_2
  },
  enabled: {
    color: THEME.COLORS.BLACK
  },
  containerToken: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.OFF_WHITE
  },
  rowContainerTop: {
    width: '100%',
    height: scale(76),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: scale(10),
    paddingRight: scale(10),
    borderBottomWidth: scale(1),
    borderBottomColor: THEME.COLORS.GRAY_3
  },
  rowContainerBottom: {
    width: '100%'
  },
  containerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
    width: scale(36)
  },
  containerCenter: {
    flex: 9,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  containerCenterCurrency: {
    fontSize: scale(18)
  },
  containerCenterName: {
    fontSize: scale(14),
    color: THEME.COLORS.SECONDARY
  },
  containerCreateCenter: {
    flexDirection: 'column',
    textAlign: 'left'
  },
  containerRight: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'space-around',
    flexDirection: 'row'
  },
  imageContainer: {
    height: scale(24),
    width: scale(24)
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
  },

  walletDetailsContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  walletDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  walletDetailsRowLine: {
    height: 1,
    borderColor: 'rgba(14, 75, 117, 0.5)',
    borderBottomWidth: 1,
    marginTop: scale(12),
    marginBottom: scale(9)
  },
  walletDetailsRowCurrency: {
    flex: 1,
    fontSize: scale(18)
  },
  walletDetailsRowValue: {
    textAlign: 'right',
    fontSize: scale(18),
    marginRight: scale(8),
    color: THEME.COLORS.GRAY_1
  },
  walletDetailsRowName: {
    flex: 1,
    fontSize: scale(14),
    color: THEME.COLORS.SECONDARY
  },
  walletDetailsRowFiat: {
    fontSize: scale(14),
    textAlign: 'right',
    marginRight: scale(8),
    color: THEME.COLORS.SECONDARY
  },
  walletHeaderContainer: {
    backgroundColor: THEME.COLORS.GRAY_4,
    flex: 3,
    padding: scale(3),
    paddingLeft: scale(15),
    flexDirection: 'row',
    paddingRight: scale(24)
  },
  walletHeaderTextContainer: {
    flex: 1
  },
  walletHeaderText: {
    color: THEME.COLORS.GRAY_2,
    fontSize: scale(14)
  }
}

export { CryptoExchangeWalletListRowStyle }
