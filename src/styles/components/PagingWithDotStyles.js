// @flow

import THEME from '../../theme/variables/airbitz'

const PagingWithDotStyles = {
  container: {
    height: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  circle: {
    borderRadius: 8,
    height: 15,
    width: 15,
    marginRight: 5,
    backgroundColor: THEME.COLORS.GRAY_2
  },
  circleSected: {
    backgroundColor: THEME.COLORS.ACCENT_MINT,
    borderRadius: 8,
    height: 15,
    width: 15,
    marginRight: 5
  }
}

export { PagingWithDotStyles }
