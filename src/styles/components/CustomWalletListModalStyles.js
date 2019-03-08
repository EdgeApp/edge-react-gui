// @flow

import { scale } from '../../lib/scaling'
import THEME from '../../theme/variables/airbitz'

const CustomWalletListModalStyles = {
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
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  rowHeight: scale(60),
  flatListBox: {
    height: scale(72),
    width: '100%'
  }
}

export { CustomWalletListModalStyles }
