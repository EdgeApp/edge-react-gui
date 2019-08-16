// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

export const styles = {
  gradient: {
    height: scale(66),
    width: '100%',
    position: 'absolute'
  },
  container: {
    paddingHorizontal: scale(20),
    backgroundColor: THEME.COLORS.GRAY_4
  },
  leftArea: {
    flexDirection: 'row'
  },
  icon: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: scale(22),
    color: THEME.COLORS.WHITE
  },

  headerRow: {
    padding: scale(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: scale(50)
  },
  headerText: {
    fontSize: scale(18),
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    marginLeft: scale(16)
  },
  headerIcon: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: scale(22)
  },

  instructionalArea: {
    paddingVertical: scale(16),
    paddingHorizontal: scale(20)
  },
  instructionalText: {
    fontSize: scale(16),
    textAlign: 'center'
  },

  nameArea: {
    height: scale(70)
  },
  currencyCodeArea: {
    height: scale(70)
  },
  contractAddressArea: {
    height: scale(70)
  },
  decimalPlacesArea: {
    height: scale(70)
  },
  errorMessageArea: {
    height: scale(16),
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorMessageText: {
    color: THEME.COLORS.ACCENT_RED
  },
  buttonsArea: {
    marginVertical: scale(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: scale(4)
  },
  buttonText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(18)
  },
  button: {
    flex: 1,
    borderRadius: 3
  },
  deleteIcon: {
    position: 'relative',
    top: 0,
    left: scale(3)
  },
  deleteButton: {
    flex: 1,
    marginRight: scale(1)
  },
  saveButton: {
    flex: 1,
    padding: scale(13),
    marginLeft: scale(1)
  },
  deleteModalButtonsArea: {
    height: scale(52),
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(4),
    flexDirection: 'row',
    flex: 1
  },
  modalCancelButton: {
    marginRight: scale(2)
  },
  modalDeleteButton: {
    marginLeft: scale(2),
    backgroundColor: THEME.COLORS.SECONDARY
  },
  highlight: {
    color: THEME.COLORS.PRIMARY_BUTTON_TOUCHED
  }
}
export default StyleSheet.create(styles)
