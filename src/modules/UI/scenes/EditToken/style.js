// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'
import { PLATFORM } from '../../../../theme/variables/platform'

export const styles = {
  gradient: {
    height: 66,
    width: '100%',
    position: 'absolute'
  },
  container: {
    position: 'relative',
    height: PLATFORM.deviceHeight - 66,
    top: 66,
    paddingHorizontal: 20,
    backgroundColor: THEME.COLORS.GRAY_4
  },
  leftArea: {
    flexDirection: 'row'
  },
  icon: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: 22,
    color: THEME.COLORS.WHITE
  },

  headerRow: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 50
  },
  headerText: {
    fontSize: 18,
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    marginLeft: 16
  },
  headerIcon: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: 22
  },

  instructionalArea: {
    paddingVertical: 16,
    paddingHorizontal: 20
  },
  instructionalText: {
    fontSize: 16,
    textAlign: 'center'
  },

  nameArea: {
    height: 70
  },
  currencyCodeArea: {
    height: 70
  },
  contractAddressArea: {
    height: 70
  },
  decimalPlacesArea: {
    height: 70
  },
  errorMessageArea: {
    height: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorMessageText: {
    color: THEME.COLORS.ACCENT_RED
  },
  buttonsArea: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: 4
  },
  buttonText: {
    color: THEME.COLORS.WHITE,
    fontSize: 18
  },
  button: {
    flex: 1,
    borderRadius: 3
  },
  deleteIcon: {
    position: 'relative',
    top: 0,
    left: 3
  },
  deleteButton: {
    flex: 1,
    marginRight: 1
  },
  saveButton: {
    flex: 1,
    marginLeft: 1
  },
  deleteModalButtonsArea: {
    height: 52,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    flexDirection: 'row',
    flex: 1
  },
  modalCancelButton: {
    marginRight: 2
  },
  modalDeleteButton: {
    marginLeft: 2,
    backgroundColor: THEME.COLORS.SECONDARY
  },
  bottomPaddingForKeyboard: {
    height: 300
  },
  highlight: {
    color: THEME.COLORS.PRIMARY_BUTTON_TOUCHED
  }
}
export default StyleSheet.create(styles)
