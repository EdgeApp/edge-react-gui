// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

export const activeOpacity = THEME.OPACITY.ACTIVE

export const styles = {
  container: {
    flex: 1,
    alignItems: 'stretch',
    flexDirection: 'column',
    zIndex: 1,
    backgroundColor: THEME.COLORS.WHITE
  },
  singleCountry: {
    height: scale(60),
    borderBottomWidth: 1,
    borderBottomColor: '#D8D6D6',
    padding: scale(10),
    paddingRight: scale(15),
    paddingLeft: scale(15)
  },
  singleCountryWrap: {
    flexDirection: 'column',
    flex: 1
  },
  countryInfoWrap: {
    flexDirection: 'row',
    height: scale(40),
    flex: 1,
    justifyContent: 'space-between'
  },
  countryLeft: {
    flexDirection: 'row'
  },
  countryLogo: {
    width: scale(40),
    height: scale(40),
    marginRight: scale(10)
  },
  countryLeftTextWrap: {
    justifyContent: 'center'
  },
  countryName: {
    fontSize: scale(16),
    color: '#58595C',
    textAlignVertical: 'center'
  },
  countryBitAmount: {
    fontSize: scale(16),
    color: '#000000',
    textAlignVertical: 'center'
  },
  underlayColor: {
    color: THEME.COLORS.GRAY_4
  },
  selectedItem: {
    backgroundColor: THEME.COLORS.GRAY_4,
    borderLeftWidth: scale(1),
    borderLeftColor: THEME.COLORS.GRAY_3,
    borderRightWidth: scale(1),
    borderRightColor: THEME.COLORS.GRAY_3
  }
}

export default StyleSheet.create(styles)
