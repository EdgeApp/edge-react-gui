// @flow

import { Platform, StyleSheet } from 'react-native'

import { scale } from '../../lib/scaling.js'
import THEME from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'

export const styles = {
  gradient: {
    height: THEME.HEADER
  },
  container: {
    height: PLATFORM.deviceHeight - scale(66) - PLATFORM.footerHeight,
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
    padding: scale(7),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.GRAY_1,
    opacity: 0.95
  },
  overlayTopText: {
    color: THEME.COLORS.WHITE,
    textAlign: 'center',
    fontSize: scale(14)
  },
  overlayBlank: {
    flex: 10
  },
  overlayButtonAreaWrap: {
    height: scale(72),
    flexDirection: 'row',
    paddingTop: scale(11),
    paddingBottom: scale(11),
    paddingRight: scale(8),
    paddingLeft: scale(8)
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
    borderRadius: scale(3),
    height: scale(50),
    marginLeft: scale(1),
    marginRight: scale(1)
  },
  bottomButtonTextWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bottomButtonText: {
    opacity: 1,
    color: THEME.COLORS.WHITE,
    fontSize: scale(14),
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  transferArrowIcon: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(22),
    height: scale(18),
    transform: [{ scaleX: 1.2 }]
  },
  buttonWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addressBookIcon: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16),
    height: scale(16),
    transform: [{ scaleX: -1.0 }]
  },
  cameraIcon: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(22),
    height: scale(18)
  },
  flashIcon: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(22),
    height: scale(18)
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center'
  },
  modalOverlay: {
    flex: 1,
    padding: scale(10)
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
    marginTop: scale(8),
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    borderBottomColor: THEME.COLORS.GRAY_4,
    borderBottomWidth: Platform.OS === 'ios' ? 1 : 0
  },
  addressInput: {
    borderBottomColor: THEME.COLORS.GRAY_2,
    borderBottomWidth: 1,
    height: scale(26),
    textAlign: 'center',
    fontSize: scale(20),
    color: THEME.COLORS.GRAY_1
  },
  addressInputButton: {
    paddingHorizontal: scale(10)
  },
  pasteButtonRow: {
    paddingTop: scale(12)
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
    fontSize: scale(12),
    color: THEME.COLORS.PRIMARY
  },
  doneButtonWrap: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end'
  },
  doneButton: {
    fontSize: scale(28),
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
  },
  cameraPermissionDeniedText: {
    textAlign: 'center',
    fontSize: scale(14),
    padding: 20
  },
  settingsButton: {
    backgroundColor: THEME.COLORS.SECONDARY,
    alignItems: 'center',
    padding: 10
  },
  settingsButtonText: {
    color: THEME.COLORS.WHITE
  }
}
export default StyleSheet.create(styles)
