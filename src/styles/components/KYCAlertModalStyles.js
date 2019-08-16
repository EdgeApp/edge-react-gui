// @flow

import { Dimensions } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

const screenDimensions = {
  height: Dimensions.get('window').height,
  width: Dimensions.get('window').width
}
const KYCAlertModalStyles = {
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalBox: {
    top: -((screenDimensions.height * 1) / 8),
    paddingHorizontal: screenDimensions.width / 16,
    width: screenDimensions.width,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  },
  innerBox: {
    backgroundColor: THEME.COLORS.WHITE,
    width: '100%'
  },
  gradientStart: { x: 0, y: 0 },
  gradientEnd: { x: 1, y: 0 },
  gradientColors: [THEME.COLORS.GRADIENT.DARK, THEME.COLORS.GRADIENT.LIGHT],
  header: {
    position: 'relative',
    height: 100,
    width: '100%',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  headerText: {
    marginBottom: 15
  },
  bodyText: {
    marginBottom: 20,
    color: THEME.COLORS.GRAY_2
  },
  bodyTextLink: {
    color: THEME.COLORS.ACCENT_BLUE,
    fontSize: scale(12),
    width: '30%',
    textAlign: 'center'
  },
  button: {
    width: '80%',
    marginBottom: 20
  },
  logoImage: {
    position: 'relative',
    width: '100%',
    height: scale(90),
    resizeMode: 'contain'
  },
  bottom: {
    position: 'relative',
    width: '100%',
    backgroundColor: THEME.COLORS.WHITE
  },
  bodyRow: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15
  },
  bodyRow2: {
    width: '100%',
    justifyContent: 'space-around',
    flexDirection: 'row'
  }
}

export { KYCAlertModalStyles }
