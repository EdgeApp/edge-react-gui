import {StyleSheet} from 'react-native'
import THEME from '../../../../theme/variables/airbitz'

export default StyleSheet.create({
  view: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  },
  mainScrollView: {
    flex: 1
  },
  main: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start'
  },
  exchangeRateContainer: {
    alignItems: 'center',
    marginVertical: 15
  },
  recipient: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  feeArea: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  feeAreaText: {
    fontSize: 16,
    color: 'white'
  },
  pendingSymbolArea: {
    height: 12
  },
  slider: {
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  sliderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sliderStyle: {
    width: 300
  },
  error: {
    flex: 1,
    color: THEME.COLORS.ACCENT_RED,
    textAlign: 'left',
    marginRight: 5,
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  trigger: {
    fontSize: 25,
    color: THEME.COLORS.WHITE,
    fontWeight: '700'
  },
  optionContainer: {
    width: 165
  },
  optionRow: {
    paddingVertical: 17
  },
  optionText: {
    fontSize: 16
  },
  maxSpend: {
    color: THEME.COLORS.ACCENT_ORANGE
  }
})
