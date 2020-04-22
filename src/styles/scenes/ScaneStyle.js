// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'

export const styles = {
  // Camera area:
  cameraArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  overlayTop: {
    alignItems: 'center',
    backgroundColor: THEME.COLORS.GRAY_1,
    justifyContent: 'center',
    opacity: 0.95,
    padding: scale(7),
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0
  },
  overlayTopText: {
    color: THEME.COLORS.WHITE,
    textAlign: 'center',
    fontSize: scale(14)
  },

  // Permission denied view:
  cameraPermissionDeniedText: {
    color: THEME.COLORS.WHITE,
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
  },

  // Bottom button area:
  overlayButtonAreaWrap: {
    flexDirection: 'row',
    paddingTop: scale(11),
    paddingBottom: scale(11),
    paddingRight: scale(8),
    paddingLeft: scale(8)
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
  addressBookIcon: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16),
    height: scale(16),
    transform: [{ scaleX: -1.0 }]
  },
  flashIcon: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(22),
    height: scale(18)
  },
  bottomButtonText: {
    opacity: 1,
    color: THEME.COLORS.WHITE,
    fontSize: scale(14),
    backgroundColor: THEME.COLORS.TRANSPARENT
  },

  // Secondary (sweep) modal:
  privateKeyIcon: {
    color: THEME.COLORS.WHITE,
    transform: [{ rotate: '270deg' }]
  },

  // Address modal:
  addressModalButton: {
    width: '100%'
  },

  // These seem unused, and should be cleaned up later:
  modalMiddle: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center'
  },
  modalBottom: {
    flex: 1,
    flexDirection: 'row'
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
  legacyAddressModalIcon: {
    color: THEME.COLORS.ACCENT_RED
  },
  title: {
    textAlign: 'center'
  }
}
export default StyleSheet.create(styles)
