// @flow

import THEME from '../../theme/variables/airbitz'

const SwapKYCModalStyles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  gradient: {
    height: THEME.SPACER.HEADER,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10
  },
  topLevel: {
    zIndex: 10,
    width: '100%',
    backgroundColor: THEME.COLORS.WHITE,
    alignSelf: 'stretch',
    position: 'absolute',
    height: '100%'
  },
  webview: {
    flex: 1,
    width: '100%'
  }
}

export { SwapKYCModalStyles }
