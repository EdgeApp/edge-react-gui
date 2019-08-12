// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

export const styles = {
  titleStyle: {
    alignSelf: 'center',
    fontSize: 20,
    color: THEME.COLORS.WHITE,
    fontFamily: THEME.FONTS.DEFAULT
  },
  titleWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  selectedCountryWrapper: {
    padding: scale(16),
    backgroundColor: THEME.COLORS.GRAY_4,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3
  },
  selectedCountry: {
    color: THEME.COLORS.GRAY_1,
    backgroundColor: THEME.COLORS.GRAY_3,
    borderRadius: scale(5),
    padding: scale(8)
  },
  selectedCountryTextWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  pluginRow: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    padding: scale(16),
    backgroundColor: THEME.COLORS.WHITE,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  },
  logo: {
    justifyContent: 'center',
    marginRight: scale(16),
    width: scale(50)
  },
  logoImage: {
    aspectRatio: 1,
    width: '100%'
  },
  textBoxWrap: {
    flexShrink: 1,
    minHeight: scale(16 + 8 + 4 * 18)
  },
  titleText: {
    color: THEME.COLORS.GRAY_1,
    fontSize: scale(16),
    marginBottom: scale(8)
  },
  subtitleText: {
    fontSize: scale(12),
    lineHeight: scale(18)
  }
}

export default StyleSheet.create(styles)
