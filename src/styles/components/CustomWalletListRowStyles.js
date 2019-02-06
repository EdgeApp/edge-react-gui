// @flow
import { scale } from '../../lib/scaling'
import THEME from '../../theme/variables/airbitz'

const CustomWalletListRowStyles = {
  touchable: {},
  underlayColor: THEME.COLORS.TRANSPARENT,
  container: {
    width: '100%',
    height: scale(60),
    flexDirection: 'row'
  },
  containerLeft: {
    flex: 2,
    justifyContent: 'space-around'
  },
  containerRight: {
    flex: 9,
    flexDirection: 'row',
    alignItems: 'center'
  },
  imageContainer: {
    height: scale(35)
  }
}

export { CustomWalletListRowStyles }
