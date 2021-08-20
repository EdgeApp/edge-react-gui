// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../../theme/variables/airbitz.js'
import { scale } from '../../../../../util/scaling.js'

export const rawStyles = {
  modal: {},
  container: {
    padding: scale(12),
    backgroundColor: THEME.COLORS.WHITE,
    borderRadius: scale(4),
    shadowOffset: {
      width: 0,
      height: scale(5)
    },
    shadowOpacity: 1,
    shadowRadius: scale(4)
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: scale(22)
  },
  body: {
    padding: scale(6)
  },
  footer: {
    padding: scale(6)
  },
  icon: {
    height: scale(65),
    width: scale(65),
    borderRadius: scale(65),
    borderWidth: scale(4),
    borderColor: THEME.COLORS.SECONDARY,
    backgroundColor: THEME.COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: scale(-32),
    zIndex: 1
  },
  androidHackSpacer: {
    paddingTop: scale(26)
  },
  item: {
    flex: 1,
    padding: scale(4)
  },
  row: {
    flexDirection: 'row'
  },
  title: {
    fontSize: scale(22),
    fontFamily: THEME.FONTS.DEFAULT,
    color: THEME.COLORS.PRIMARY
  },
  description: {
    paddingVertical: scale(6),
    fontSize: scale(16),
    color: THEME.COLORS.GRAY_1,
    fontFamily: THEME.FONTS.DEFAULT,
    alignSelf: 'center'
  }
}

export const styles: typeof rawStyles = StyleSheet.create(rawStyles)
