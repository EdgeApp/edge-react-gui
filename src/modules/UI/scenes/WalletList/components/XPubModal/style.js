// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../../../theme/variables/airbitz.js'

export const styles = {

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
  xPubSyntax: {
    textAlign: 'center'
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
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  doneButton: {
    textAlign: 'center',
    fontSize: 12,
    width: '100%',
    flex: 1,
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
  }
}
export default StyleSheet.create(styles)
