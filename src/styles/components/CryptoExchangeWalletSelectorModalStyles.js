// @flow

import { scale } from '../../lib/scaling'
import THEME from '../../theme/variables/airbitz'

const CryptoExchangeWalletSelectorModalStyles = {
  container: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  activeArea: {
    width: '100%',
    backgroundColor: THEME.COLORS.WHITE
  },
  header: {
    width: '100%',
    height: scale(60),
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: THEME.COLORS.GRAY_3
  },
  headerCenter: {
    width: '100%',
    height: scale(60),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderBottomWidth: 0.5,
    borderColor: THEME.COLORS.GRAY_3
  },
  headerLeft: {
    flex: 9,
    height: scale(60),
    paddingLeft: 20,
    justifyContent: 'space-around'
  },
  headerRight: {
    flex: 2,
    height: scale(60),
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  iconButton: {
    container: {
      width: 24,
      height: scale(24),
      justifyContent: 'space-around',
      alignItems: 'center'
    },
    icon: {
      color: THEME.COLORS.GRAY_2
    },
    iconPressed: {
      color: THEME.COLORS.GRAY_2
    },
    iconSize: scale(24),
    underlayColor: THEME.COLORS.TRANSPARENT
  },
  rowHeight: scale(60),
  flatListBox: {
    height: scale(72),
    width: '100%'
  }
}

export { CryptoExchangeWalletSelectorModalStyles }
