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
    padding: scale(14),
    paddingRight: scale(30),
    paddingLeft: scale(15),
    backgroundColor: THEME.COLORS.WHITE
  },
  pluginBox: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between'
  },
  pluginLeft: {
    flexDirection: 'row'
  },
  logoWrap: {
    justifyContent: 'center'
  },
  logo: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(20),
    marginRight: scale(16)
  },
  textBoxWrap: {
    /* justifyContent: 'center' */
  },
  titleBox: {
    fontSize: scale(16),
    color: THEME.COLORS.GRAY_1,
    textAlignVertical: 'center'
  },
  subtitleBox: {
    fontSize: scale(12),
    lineHeight: scale(18),
    textAlignVertical: 'bottom',
    position: 'relative',
    top: scale(4)
  }
}

export default StyleSheet.create(styles)
