// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

const borderBottomColor = THEME.COLORS.FIO_ADDRESS_LIST_BORDER_BOTTOM
const fontColor = THEME.COLORS.FIO_ADDRESS_LIST_FONT

export const styles = StyleSheet.create({
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
  iconIon: {
    height: scale(40),
    width: scale(45),
    paddingRight: scale(4),
    textAlign: 'center'
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
    padding: scale(10)
  },
  toggleButton: {
    backgroundColor: THEME.COLORS.PRIMARY,
    height: scale(58),
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  domainVew: {
    paddingHorizontal: scale(15),
    paddingTop: scale(10),
    paddingBottom: scale(0)
  },
  link: {
    padding: scale(10),
    color: THEME.COLORS.ACCENT_BLUE,
    textAlign: 'center'
  },
  underlay: {
    color: `${THEME.COLORS.PRIMARY}${THEME.ALPHA.LOW}`
  },
  loading: {
    flex: 1,
    marginTop: scale(40),
    alignSelf: 'center'
  },
  row: {
    flex: 1
  },
  noNames: {
    color: THEME.COLORS.GRAY_2,
    fontSize: scale(16),
    textAlign: 'center',
    padding: scale(15)
  },
  headerIcon: {
    width: scale(24),
    height: scale(22)
  }
})
