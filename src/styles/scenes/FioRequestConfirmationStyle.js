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
  selectFullWidth: {
    width: '100%',
    paddingHorizontal: scale(30),
    paddingVertical: scale(10)
  },
  title: {
    fontSize: scale(28),
    color: THEME.COLORS.WHITE,
    marginTop: scale(20),
    marginBottom: scale(10)
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
  },
  error: {
    color: THEME.COLORS.ACCENT_RED,
    fontSize: scale(12),
    width: '100%'
  },
  loading: {
    flex: 1,
    marginTop: scale(40),
    alignSelf: 'center'
  },
  selectAddressContainer: {
    height: scale(18)
  },
  selectAddressText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(14)
  },
  selectAddressTextPressed: {
    color: THEME.COLORS.GRAY_2,
    fontSize: scale(14)
  },
  memoContainer: {
    marginTop: scale(10),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  }
})
