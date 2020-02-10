// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

const borderBottomColor = '#D8E2ED'
const fontColor = '#4B5158'

const styles = StyleSheet.create({
  gradient: {
    height: THEME.HEADER
  },
  view: {
    padding: scale(15)
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: THEME.COLORS.WHITE
  },
  item: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(15),
    borderBottomColor: borderBottomColor,
    borderBottomWidth: 1
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
    marginLeft: scale(5)
  },
  iconImg: {
    height: scale(40),
    width: scale(45)
  },
  info: {
    flex: 4
  },
  infoTitle: {
    color: fontColor,
    fontSize: scale(18)
  },
  infoSubtitle: {
    color: fontColor,
    fontSize: scale(12)
  },
  arrow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto'
  },
  button: {
    marginTop: 'auto',
    padding: scale(15)
  },
  toggleButton: {
    backgroundColor: THEME.COLORS.PRIMARY,
    height: scale(58),
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  underlay: {
    color: `${THEME.COLORS.PRIMARY}${THEME.ALPHA.LOW}`
  }
})

export default styles
