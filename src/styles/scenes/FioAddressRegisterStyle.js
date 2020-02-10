// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

const styles = StyleSheet.create({
  gradient: {
    height: THEME.HEADER
  },
  view: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  icon: {
    paddingTop: scale(35)
  },
  image: {
    height: scale(50),
    width: scale(55)
  },
  inputContainer: {
    width: '89%'
  },
  mainView: {
    flex: 3,
    backgroundColor: THEME.COLORS.WHITE,
    paddingTop: scale(40),
    paddingBottom: scale(20),
    paddingLeft: scale(15),
    paddingRight: scale(15)
  },
  text: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(30)
  },
  status: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(5)
  },
  nextButton: {
    marginTop: scale(30)
  },
  statusIconError: {
    marginTop: scale(27),
    color: THEME.COLORS.ACCENT_RED
  },
  statusIconOk: {
    marginTop: scale(27),
    color: THEME.COLORS.ACCENT_MINT
  },
  available: {
    color: THEME.COLORS.ACCENT_MINT
  },
  notAvailable: {
    color: THEME.COLORS.ACCENT_RED
  },
  formField: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: scale(10),
    paddingRight: scale(5),
    marginRight: 'auto'
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
