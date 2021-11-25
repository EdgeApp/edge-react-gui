// @flow

import { StyleSheet } from 'react-native'

import { THEME } from '../../../../../../theme/variables/airbitz.js'
import { scale } from '../../../../../../util/scaling.js'

export const rawStyles = {
  button: {
    height: scale(50),
    backgroundColor: THEME.COLORS.TRANSPARENT,
    paddingHorizontal: scale(6)
  },
  row: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  item: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    alignItems: 'center',
    justifyContent: 'center'
  },
  left: {
    height: '100%',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(6)
  },
  center: {
    flex: 1,
    height: '100%',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: scale(6)
  },
  right: {
    height: '100%',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(6)
  },
  text: {
    fontSize: scale(16),
    fontFamily: THEME.FONTS.DEFAULT,
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    alignItems: 'center',
    justifyContent: 'center'
  },
  underlay: {
    color: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`
  }
}

export const styles = StyleSheet.create(rawStyles)
