// @flow

import {StyleSheet} from 'react-native'
import THEME from '../../../../theme/variables/airbitz'

export const stylesRaw = {
  gradient: {
    height: THEME.HEADER
  },
  form: {
    padding: 18
  },
  container: {
    position: 'relative',
  },
  listStyle: {
    height: 100
  },
  unlockRow: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 50
  },
  leftArea: {
    flexDirection: 'row'
  },
  headerRow: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 50
  },
  headerText: {
    fontSize: 18,
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    marginLeft: 16
  },
  headerIcon: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: 22
  },
  underlay: {
    color: THEME.COLORS.GRAY_4
  },

  header: {
    alignSelf: 'center',
    fontSize: 18,
    color: THEME.COLORS.GRAY_1,
    paddingTop: 26,
    marginBottom: -20
  },
  formSection: {
    marginVertical: 16
  },
  submitButton: {
    marginHorizontal: 16,
    marginTop: 0,
    height: 50
  },
  rowSwitch: {
    borderBottomWidth: 0
  }
}
export default StyleSheet.create(stylesRaw)
