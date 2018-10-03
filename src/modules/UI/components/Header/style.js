// @flow

import { StyleSheet } from 'react-native'

import { scale } from '../../../../lib/scaling.js'
import * as Styles from '../../../../styles/indexStyles'
import THEME from '../../../../theme/variables/airbitz'

export default StyleSheet.create({
  headerRoot: {
    zIndex: 1006
  },
  sideTextWrap: {
    paddingTop: scale(3),
    paddingBottom: scale(3),
    paddingHorizontal: scale(10)
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backIconStyle: {
    paddingLeft: scale(10),
    paddingRight: scale(5),
    paddingTop: scale(3),
    color: THEME.COLORS.WHITE
  },
  backIconAndroid: {
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 15,
    paddingRight: 15
  },
  sideText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(18)
  },
  icon: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(25)
  },
  default: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    color: THEME.COLORS.WHITE
  },
  headerNameContainer: {
    display: 'flex',
    flexDirection: 'row'
  },
  cCode: {
    fontWeight: 'bold'
  }
})

export const walletSelectorStyles = {
  ...Styles.TextAndIconButtonStyle,
  content: { ...Styles.TextAndIconButtonStyle.content, position: 'relative', width: '80%' },
  centeredContent: { ...Styles.TextAndIconButtonStyle.centeredContent, position: 'relative', width: '80%' }
}
