// import * as Constants from '../../constants/'
import { Dimensions } from 'react-native'

import THEME from '../../theme/variables/airbitz'

const screenDimensions = {
  height: Dimensions.get('window').height,
  width: Dimensions.get('window').width
}
const OFFSET_HACK = -19

const StaticModalStyle = {
  container: {
    position: 'absolute',
    top: OFFSET_HACK,
    left: OFFSET_HACK,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.MODAL_BOX
  },
  touchOut: {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  modalBox: {
    top: screenDimensions.height / 4,
    left: screenDimensions.width / 8,
    width: screenDimensions.width * 3 / 4,
    alignItems: 'stretch',
    position: 'absolute',
    // height: (screenDimensions.height) / 3,
    backgroundColor: THEME.COLORS.WHITE,
    flexDirection: 'column',
    justifyContent: 'flex-start'
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
