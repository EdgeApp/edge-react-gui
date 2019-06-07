// @flow

import { StyleSheet } from 'react-native'

import { scale } from '../../lib/scaling.js'
import THEME from '../../theme/variables/airbitz'

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
