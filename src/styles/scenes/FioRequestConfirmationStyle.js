// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

export const styles = StyleSheet.create({
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
  text: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16)
  },
  button: {
    marginLeft: scale(10),
    marginRight: scale(10)
  },
  input: {
    width: '70%'
  }
})
