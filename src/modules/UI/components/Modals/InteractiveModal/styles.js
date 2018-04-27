// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../../theme/variables/airbitz.js'

export const rawStyles = {
  modal: {},
  container: {
    padding: 12,
    backgroundColor: THEME.COLORS.WHITE,
    borderRadius: 4,
    shadowOffset: {
      width: 0,
      height: 5
    },
    shadowOpacity: 1,
    shadowRadius: 4
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 22
  },
  body: {
    padding: 6
  },
  footer: {
    padding: 6
  },
  icon: {
    height: 65,
    width: 65,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: THEME.COLORS.SECONDARY,
    backgroundColor: THEME.COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: -32,
    zIndex: 1
  },
  androidHackSpacer: {
    paddingTop: 26
  },
  item: {
    flex: 1,
    padding: 6
  },
  row: {
    flexDirection: 'row'
  },
  title: {
    fontSize: 22,
    fontFamily: THEME.FONTS.DEFAULT,
    color: THEME.COLORS.PRIMARY
  },
  description: {
    paddingVertical: 6,
    fontSize: 16,
    color: THEME.COLORS.GRAY_1,
    fontFamily: THEME.FONTS.DEFAULT
  },
  debug: {
    borderColor: 'red',
    borderWidth: 1
  }
}

export const styles = StyleSheet.create(rawStyles)
