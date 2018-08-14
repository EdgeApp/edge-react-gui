// @flow

import { Platform, StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz.js'
import { PLATFORM } from '../../../../theme/variables/platform.js'

export const styles = {
  gradient: {
    height: THEME.HEADER
  },
  container: {
    height: PLATFORM.deviceHeight - 66 - PLATFORM.footerHeight,
    flex: 1,
    flexDirection: 'row',
    position: 'relative'
  },
  preview: {
    flex: 1,
    alignItems: 'center'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  overlayTop: {
    height: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.GRAY_1,
    opacity: 0.95
  },
  overlayTopText: {
    color: THEME.COLORS.WHITE,
    fontSize: 14
  },
  overlayBlank: {
    flex: 10
  },
  overlayButtonAreaWrap: {
    height: 72,
    flexDirection: 'row',
    paddingTop: 11,
    paddingBottom: 11,
    paddingRight: 8,
    paddingLeft: 8
  },
  overLayButtonArea: {
    flex: 1,
    justifyContent: 'center',
    color: THEME.COLORS.WHITE,
    flexDirection: 'row',
    alignItems: 'center'
  },
  bottomButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
    borderRadius: 3,
    height: 50,
    marginLeft: 1,
    marginRight: 1
  },
  bottomButtonTextWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bottomButtonText: {
    opacity: 1,
    color: THEME.COLORS.WHITE,
    fontSize: 14,
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  transferArrowIcon: {
    color: THEME.COLORS.WHITE,
    fontSize: 22,
    height: 18,
    transform: [{ scaleX: 1.2 }]
  },
  buttonWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addressBookIcon: {
    color: THEME.COLORS.WHITE,
    fontSize: 16,
    height: 16,
    transform: [{ scaleX: -1.0 }]
  },
  cameraIcon: {
    color: THEME.COLORS.WHITE,
    fontSize: 22,
    height: 18
  },
  flashIcon: {
    color: THEME.COLORS.WHITE,
    fontSize: 22,
    height: 18
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center'
  },
  modalOverlay: {
    flex: 1,
    padding: 10
  },
  withAddressCopied: {
    top: 0
  },
  modalTopTextWrap: {
    flex: 1
  },
  modalTopText: {
    textAlign: 'center',
    color: THEME.COLORS.PRIMARY,
    fontWeight: '500'
  },
  modalMiddle: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center'
  },
  addressInputWrap: {
    marginTop: 8,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    borderBottomColor: THEME.COLORS.GRAY_4,
    borderBottomWidth: Platform.OS === 'ios' ? 1 : 0
  },
  addressInput: {
    borderBottomColor: THEME.COLORS.GRAY_2,
    borderBottomWidth: 1,
    height: 26,
    textAlign: 'center',
    fontSize: 20,
    color: THEME.COLORS.GRAY_1
  },
  addressInputButton: {
    paddingHorizontal: 10
  },
  pasteButtonRow: {
    paddingTop: 12
  },
  modalBottom: {
    flex: 1,
    flexDirection: 'row'
  },
  emptyBottom: {
    flex: 1
  },
  buttonsWrap: {
    flex: 1,
    flexDirection: 'row'
  },
  cancelButtonWrap: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    fontSize: 12,
    color: THEME.COLORS.PRIMARY
  },
  doneButtonWrap: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end'
  },
  doneButton: {
    fontSize: 28,
    color: THEME.COLORS.PRIMARY
  },
  icon: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    zIndex: 1015,
    elevation: 1015
  },
  underlay: {
    color: THEME.COLORS.SECONDARY
  },
  cancelUnderlay: {
    color: THEME.COLORS.GRAY_1
  },
  doneUnderlay: {
    color: THEME.COLORS.PRIMARY
  },
  privateKeyIcon: {
    color: THEME.COLORS.WHITE,
    transform: [{ rotate: '270deg' }]
  }
}
export default StyleSheet.create(styles)
