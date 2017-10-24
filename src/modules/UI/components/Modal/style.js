import {
  StyleSheet,
  Dimensions
} from 'react-native'
import THEME from '../../../../theme/variables/airbitz'

const screenDimensions = {
  height: Dimensions.get('window').height,
  width: Dimensions.get('window').width
}

export const styles = {
  // modal styles
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    zIndex: 1,
    elevation: 1
  },
  modalOverlay: {
    flex: 1,
    padding: 10
  },
  modalBox: {
    top: (screenDimensions.height / 8),
    left: (screenDimensions.width / 8) - 20,
    width: screenDimensions.width * 3 / 4,
    borderRadius: 3,
    alignItems: 'stretch',
    position: 'absolute',
    // height: (screenDimensions.height) / 3,
    backgroundColor: THEME.COLORS.WHITE,
    padding: 15,
    paddingTop: 25,
    flexDirection: 'column',
    justifyContent: 'flex-start'
  },
  modalBoxWithExit: {
    position: 'relative',
    bottom: 24
  },
  exitRow: {
    alignItems: 'flex-end',
    position: 'relative',
    zIndex: 200
  },
  exitButton: {
    backgroundColor: 'transparent',
    width: 30,
    height: 30,
    alignItems: 'flex-end',
    position: 'relative',
    top: 6
  },
  exitText: {
    fontSize: 18,
    backgroundColor: 'transparent',
    color: THEME.GRAY_1
  },
  iconWrapper: {

  },
  modalHeaderIconWrapBottom: {
    position: 'absolute',
    left: (screenDimensions.width / 2) - 47,
    top: (screenDimensions.height / 8) - 28,
    borderRadius: 27,
    backgroundColor: THEME.COLORS.WHITE,
    height: 54,
    width: 54
  },
  modalHeaderIconWrapTop: {
    position: 'relative',
    top: 3,
    left: 3,
    borderRadius: 27,
    backgroundColor: THEME.COLORS.WHITE,
    zIndex: 100,
    elevation: 100,
    height: 48,
    width: 48
  },

  // beginning of rename wallet modal
  modalBody: {
    position: 'relative',
    justifyContent: 'space-between'
  },
  modalTopTextWrap: {
    padding: 10,
    paddingBottom: 4
  },
  modalTopText: {
    textAlign: 'center',
    color: THEME.COLORS.PRIMARY,
    fontSize: 16
  },
  modalTopSubtext: {
    fontSize: 14,
    color: THEME.COLORS.GRAY_1,
    textAlign: 'center',
    paddingTop: 4
  },
  modalMiddle: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingTop: 4
  },
  modalBottom: {
    height: 50,
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    position: 'relative',
    top: 30
  },

  // buttons
  buttonsWrap: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'flex-end'
  },
  stylizedButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderRadius: 3
  },
  stylizedButtonText: {
    color: THEME.COLORS.WHITE,
    fontSize: 16
  },

  cancelButtonWrap: {
    backgroundColor: THEME.COLORS.GRAY_2,
    alignSelf: 'flex-start'
  },

  doneButtonWrap: {
    backgroundColor: THEME.COLORS.SECONDARY,
    alignSelf: 'flex-end',
    marginLeft: 4
  },

  cancelUnderlay: {
    color: THEME.COLORS.GRAY_1
  },

  doneUnderlay: {
    color: THEME.COLORS.PRIMARY
  }
}

export const exitColor = THEME.GRAY_1

export default StyleSheet.create(styles)
