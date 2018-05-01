// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../../theme/variables/airbitz.js'

export const rawStyles = {
  modal: {},
  container: {
    paddingBottom: 6,
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 4,
    shadowOffset: {
      width: 0,
      height: 5
    },
    shadowOpacity: 1,
    shadowRadius: 4
  },
  header: {},
  gradient: {
    padding: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  footer: {
    padding: 20,
    paddingHorizontal: 40
  },
  icon: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    borderColor: THEME.COLORS.WHITE,
    borderWidth: 2,
    height: 50,
    width: 50,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5
  },
  message: {
    color: THEME.COLORS.GRAY_1,
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: 18
  }
}

export const styles = StyleSheet.create(rawStyles)
