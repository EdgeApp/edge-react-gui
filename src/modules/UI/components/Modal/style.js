// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'
import { PLATFORM } from '../../../../theme/variables/platform'

export const styles = {
  // modal styles
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    zIndex: 1,
    elevation: 1
  },
  topLevelModal: {
    alignItems: 'center',
    position: 'absolute',
    top: (PLATFORM.deviceHeight * 1) / 8,
    left: 0,
    right: 0,
    backgroundColor: 'transparent'
  },
  visibleModal: {
    zIndex: 1,
    paddingBottom: 14,
    borderRadius: 3,
    backgroundColor: THEME.COLORS.WHITE,
    width: (PLATFORM.deviceWidth * 3) / 4
  },
  modalBox: {
    alignItems: 'stretch',
    // height: (screenDimensions.height) / 3,
    paddingHorizontal: 15,
    flexDirection: 'column',
    justifyContent: 'flex-start'
  },

  exitRow: {
    alignItems: 'flex-end',
    position: 'relative',
    justifyContent: 'center',
    zIndex: 200
  },
  exitRowEmpty: {
    height: 30
  },
  exitButton: {
    backgroundColor: 'transparent',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  exitText: {
    fontSize: 18,
    backgroundColor: 'transparent',
    color: THEME.COLORS.GRAY_1
  },
  iconWrapper: {},
  modalHeaderIconWrapBottom: {
    position: 'relative',
    top: 27,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: THEME.COLORS.SECONDARY,
    backgroundColor: THEME.COLORS.WHITE,
    height: 54,
    width: 54,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'space-around'
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
    width: 48,
    overflow: 'hidden'
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
    marginTop: 12,
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'flex-end'
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

export const exitColor = THEME.COLORS.GRAY_1

export default StyleSheet.create(styles)
