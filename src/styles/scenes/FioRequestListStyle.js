// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

export const styles = StyleSheet.create({
  scene: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: THEME.COLORS.GRAY_4
  },
  requestsWrap: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  container: {
    flex: 1,
    alignItems: 'stretch'
  },
  listContainer: {
    backgroundColor: THEME.COLORS.GRAY_4,
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
  rowBack: {
    alignItems: 'center',
    backgroundColor: THEME.COLORS.GRAY_3,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: scale(15)
  },
  row: {
    height: '50%'
  },
  text: {
    fontSize: scale(14),
    fontWeight: 'normal'
  },
  transactionLogo: {
    width: scale(44),
    height: scale(44)
  },
  emptyListContainer: {
    paddingVertical: scale(30),
    paddingHorizontal: scale(20),
    opacity: 0.5
  },
  swipeRow: {
    right: scale(-75)
  }
})
