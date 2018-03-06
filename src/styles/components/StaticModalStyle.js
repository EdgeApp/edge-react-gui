// import * as Constants from '../../constants/'
import { Dimensions } from 'react-native'

import THEME from '../../theme/variables/airbitz'

const screenDimensions = {
  height: Dimensions.get('window').height,
  width: Dimensions.get('window').width
}

const StaticModalStyle = {
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: screenDimensions.height * 1 / 8,
    left: 0,
    right: 0
  },
  touchOut: {
    position: 'relative',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  modalBox: {
    marginHorizontal: screenDimensions.width / 8,
    width: screenDimensions.width,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: THEME.COLORS.WHITE
  },
  header: {
    position: 'relative',
    height: 62,
    width: '100%',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  bottom: {
    position: 'relative',
    width: '100%',
    backgroundColor: THEME.COLORS.WHITE
  },
  bodyRow: {
    width: '100%',
    padding: 15
  },
  bodyText: {
    width: '100%',
    textAlign: 'center',
    fontFamily: THEME.FONTS.DEFAULT
  },
  shim: 20, // Styles.Shim.height,
  icon: {
    color: THEME.COLORS.WHITE
  },
  iconSize: 36
}

export { StaticModalStyle }
