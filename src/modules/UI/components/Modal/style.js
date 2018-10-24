// @flow

import { StyleSheet } from 'react-native'

import { scale } from '../../../../lib/scaling.js'
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
    paddingBottom: scale(14),
    borderRadius: 3,
    backgroundColor: THEME.COLORS.WHITE,
    width: (PLATFORM.deviceWidth * 3) / 4
  },
  modalBox: {
    alignItems: 'stretch',
    // height: (screenDimensions.height) / 3,
    paddingHorizontal: scale(15),
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
    height: scale(30)
  },
  exitButton: {
    backgroundColor: 'transparent',
    width: scale(30),
    height: scale(30),
    alignItems: 'center',
    justifyContent: 'center'
  },
  exitText: {
    fontSize: scale(18),
    backgroundColor: 'transparent',
    color: THEME.COLORS.GRAY_1
  },
  iconWrapper: {},
  modalHeaderIconWrapBottom: {
    position: 'relative',
    top: scale(27),
    borderRadius: scale(27),
    borderWidth: scale(2),
    borderColor: THEME.COLORS.SECONDARY,
    backgroundColor: THEME.COLORS.WHITE,
    height: scale(54),
    width: scale(54),
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  modalHeaderIconWrapTop: {
    position: 'relative',
    top: scale(3),
    left: scale(3),
    borderRadius: 27,
    backgroundColor: THEME.COLORS.WHITE,
    zIndex: 100,
    elevation: 100,
    height: scale(48),
    width: scale(48),
    overflow: 'hidden'
  },

  // beginning of rename wallet modal
  modalBody: {
    position: 'relative',
    justifyContent: 'space-between'
  },
  modalTopTextWrap: {
    padding: scale(10),
    paddingBottom: scale(4)
  },
  modalTopText: {
    textAlign: 'center',
    color: THEME.COLORS.PRIMARY,
    fontSize: scale(16)
  },
  modalTopSubtext: {
    fontSize: scale(14),
    color: THEME.COLORS.GRAY_1,
    textAlign: 'center',
    paddingTop: scale(4)
  },
  modalMiddle: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingTop: scale(4)
  },
  modalBottom: {
    marginTop: scale(12),
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
    height: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderRadius: 3
  },
  stylizedButtonText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16)
  },

  cancelButtonWrap: {
    backgroundColor: THEME.COLORS.GRAY_2,
    alignSelf: 'flex-start'
  },

  doneButtonWrap: {
    backgroundColor: THEME.COLORS.SECONDARY,
    alignSelf: 'flex-end',
    marginLeft: scale(4)
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
