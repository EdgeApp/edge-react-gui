// @flow

import { Dimensions, StyleSheet } from 'react-native'
import ExtraDimensions from 'react-native-extra-dimensions-android'

import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform.js'
import { scale } from '../../util/scaling.js'

const SOFT_MENU_BAR_HEIGHT = ExtraDimensions.get('SOFT_MENU_BAR_HEIGHT')

const titleColor = 'rgba(128,137,151,1.0)'
const bgColor = 'rgba(245,245,245,1.0)'

export const styles = StyleSheet.create({
  scene: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: bgColor
  },
  transactionsWrap: {
    flex: 1
  },
  androidTransactionsWrap: {
    flex: 1,
    height: PLATFORM.usableHeight - SOFT_MENU_BAR_HEIGHT + THEME.HEADER
  },
  scrollView: {
    flex: 1
  },
  container: {
    flex: 1,
    alignItems: 'stretch'
  },
  rowContainer: {
    backgroundColor: bgColor,
    height: scale(30),
    justifyContent: 'center',
    width: Dimensions.get('window').width
  },
  rowTitle: {
    color: titleColor,
    fontSize: scale(16),
    fontWeight: 'normal',
    paddingLeft: scale(15)
  },
  listContainer: {
    backgroundColor: bgColor,
    borderBottomColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: scale(2),
    height: scale(50),
    justifyContent: 'center',
    paddingLeft: scale(15)
  },
  listTitle: {
    fontSize: scale(16),
    fontWeight: 'normal'
  },

  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: scale(75)
  },
  backRightBtnRight: {
    backgroundColor: THEME.COLORS.ACCENT_RED,
    right: 0
  },
  backTextWhite: {
    color: THEME.COLORS.WHITE
  },
  columnCurrency: {
    height: scale(75),
    width: '25%'
  },
  columnItem: {
    flexDirection: 'row',
    height: scale(75),
    justifyContent: 'flex-start',
    width: '65%'
  },
  currency: {
    color: THEME.COLORS.BLUE_3,
    fontSize: scale(16),
    fontWeight: 'normal',
    textAlign: 'right'
  },
  fiat: {
    color: THEME.COLORS.BLUE_3,
    fontSize: scale(14),
    fontWeight: 'normal',
    textAlign: 'right'
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: THEME.COLORS.GRAY_3, // #DDD
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: scale(15)
  },
  rowFront: {
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: scale(2),
    height: scale(75),
    justifyContent: 'flex-start'
  },
  rowFrontWithHeader: {
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: scale(2),
    height: scale(105),
    justifyContent: 'flex-start'
  },
  rowHeaderOnly: {
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: scale(2),
    height: scale(30),
    justifyContent: 'flex-start'
  },
  rowItem: {
    flexDirection: 'row',
    height: scale(75),
    justifyContent: 'space-between',
    paddingLeft: scale(10),
    paddingRight: scale(10),
    paddingTop: scale(15)
  },
  row: {
    height: '50%'
  },
  text: {
    fontSize: scale(14),
    fontWeight: 'normal'
  },
  title: {
    fontSize: scale(16),
    fontWeight: 'normal'
  },
  transactionStatusLogo: {
    position: 'absolute',
    right: scale(2),
    top: scale(-7),
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8)
  }
})
