// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale(20)
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
    marginTop: scale(16),
    height: scale(52),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: scale(4)
  },
  addButton: {
    flex: 1,
    marginRight: scale(2),
    backgroundColor: THEME.COLORS.GRAY_2,
    borderRadius: scale(3)
  },
  buttonText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(18)
  },
  saveButton: {
    flex: 1,
    marginLeft: scale(2),
    backgroundColor: THEME.COLORS.SECONDARY,
    borderRadius: 3
  },
  bottomPaddingForKeyboard: {
    height: scale(300)
  }
})
