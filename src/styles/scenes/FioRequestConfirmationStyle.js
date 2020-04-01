// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

const textColor = 'white'

const styles = StyleSheet.create({
  gradient: {
    height: THEME.HEADER
  },
  exchangeRateContainer: {
    alignItems: 'center',
    marginVertical: scale(5)
  },
  textContainer: {
    alignItems: 'center',
    marginVertical: scale(15),
    marginBottom: scale(15)
  },
  selectContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  view: {
    flex: 2,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingLeft: scale(15),
    paddingRight: scale(15)
  },
  texts: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(40)
  },
  text: {
    color: textColor,
    fontSize: scale(16)
  },
  image: {
    marginBottom: scale(50)
  },
  title: {
    fontSize: scale(28),
    color: textColor,
    marginTop: scale(20),
    marginBottom: scale(10)
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: scale(15)
  },
  bottomButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
    borderRadius: scale(3),
    height: scale(50),
    marginLeft: scale(1),
    marginRight: scale(1),
    marginTop: scale(15)
  },
  bottomButtonTextWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bottomButtonText: {
    opacity: 1,
    color: THEME.COLORS.WHITE,
    fontSize: scale(14),
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  shim: {
    height: scale(20)
  },
  button: {
    marginLeft: scale(10),
    marginRight: scale(10)
  }
})

export default styles
