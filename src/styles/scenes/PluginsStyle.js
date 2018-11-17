// @flow

import { StyleSheet } from 'react-native'

import { scale } from '../../lib/scaling.js'
import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform.js'

export const styles = {
  gradient: {
    height: THEME.HEADER
  },
  scene: {
    width: '100%',
    height: PLATFORM.usableHeight + PLATFORM.toolbarHeight
  },
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
  container: {
    flex: 1,
    alignItems: 'stretch'
  },
  pluginRow: {
    height: scale(60),
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    padding: scale(10),
    paddingRight: scale(30),
    paddingLeft: scale(15),
    backgroundColor: THEME.COLORS.WHITE
  },
  pluginBox: {
    flexDirection: 'row',
    height: scale(40),
    flex: 1,
    justifyContent: 'space-between'
  },
  pluginLeft: {
    flexDirection: 'row'
  },
  logo: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginRight: scale(10)
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
    textAlignVertical: 'bottom',
    position: 'relative',
    top: scale(4)
  }
}

export default StyleSheet.create(styles)
