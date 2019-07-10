// @flow

import { StyleSheet } from 'react-native'

import { TextAndIconButtonStyle } from '../../../../styles/indexStyles'
import THEME from '../../../../theme/variables/airbitz'

export default StyleSheet.create({
  headerRoot: {
    zIndex: 1006
  },
  sideTextWrap: {
    paddingTop: 3,
    paddingBottom: 3,
    paddingHorizontal: 10
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backIconStyle: {
    paddingLeft: 10,
    paddingRight: 5,
    paddingTop: 3,
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
    fontSize: 18
  },
  icon: {
    color: THEME.COLORS.WHITE,
    fontSize: 25
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
  ...TextAndIconButtonStyle,
  content: { position: 'relative', width: '80%' },
  centeredContent: { ...TextAndIconButtonStyle.centeredContent, position: 'relative', width: '80%' }
}
