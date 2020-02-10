// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

const buttonBoxBackgroundColor = '#efeef4'
const dotColor = 'black'

const styles = StyleSheet.create({
  gradient: {
    height: THEME.HEADER
  },
  view: {
    flex: 2,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  icon: {
    paddingTop: scale(35)
  },
  mainView: {
    flex: 3,
    justifyContent: 'flex-start',
    backgroundColor: THEME.COLORS.WHITE,
    paddingTop: scale(35),
    paddingBottom: scale(20),
    paddingLeft: scale(15),
    paddingRight: scale(15)
  },
  firstText: {
    marginBottom: scale(20)
  },
  lastText: {
    marginTop: scale(30),
    marginBottom: scale(20)
  },
  itemList: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: scale(-10)
  },
  dot: {
    color: dotColor,
    marginRight: scale(-5),
    marginLeft: scale(-10),
    marginTop: scale(2)
  },
  buttonBox: {
    flex: 1,
    marginTop: 'auto',
    backgroundColor: buttonBoxBackgroundColor,
    padding: scale(15),
    paddingTop: scale(20)
  },
  links: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scale(15)
  },
  link: {
    fontSize: scale(14),
    color: THEME.COLORS.PRIMARY
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
