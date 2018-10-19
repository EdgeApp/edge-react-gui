// @flow

import THEME from '../../theme/variables/airbitz'

const SwapKYCModalStyles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  topLevel: {
    zIndex: 10,
    width: '100%',
    backgroundColor: THEME.COLORS.WHITE,
    alignSelf: 'stretch'
  },
  webview: {
    flex: 1,
    width: '100%'
  }
}

export { SwapKYCModalStyles }
