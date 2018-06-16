// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'
import { PLATFORM } from '../../../../theme/variables/platform.js'

export const styles = {
  gradient: {
    height: THEME.HEADER
  },
  scene: {
    width: '100%',
    height: PLATFORM.usableHeight + PLATFORM.toolbarHeight
  },
  container: {
    flex: 1,
    alignItems: 'stretch'
  },
  pluginRow: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    padding: 10,
    paddingRight: 30,
    paddingLeft: 15,
    backgroundColor: THEME.COLORS.WHITE
  },
  pluginBox: {
    flexDirection: 'row',
    height: 40,
    flex: 1,
    justifyContent: 'space-between'
  },
  pluginLeft: {
    flexDirection: 'row'
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  textBoxWrap: {
    /* justifyContent: 'center' */
  },
  titleBox: {
    fontSize: 16,
    color: THEME.COLORS.GRAY_1,
    textAlignVertical: 'center'
  },
  subtitleBox: {
    fontSize: 12,
    textAlignVertical: 'bottom',
    position: 'relative',
    top: 4
  }
}

export default StyleSheet.create(styles)
