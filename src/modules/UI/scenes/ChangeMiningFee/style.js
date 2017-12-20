// @flow

import {StyleSheet} from 'react-native'
import THEME from '../../../../theme/variables/airbitz'

const styles = {
  gradient: {
    height: THEME.SPACER.HEADER
  },
  container: {
    flexDirection: 'column',
  },
  headerContainer: {
    padding: 25,
    paddingBottom: 10,
  },
  header: {
    fontSize: 15,
    color: THEME.COLORS.GRAY_1,
  },
  body: {
    paddingTop: 24,
    paddingLeft: 40
  },
  column: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
  },
  row: {
    padding: 8
  },
  radio: {
    borderRadius: 9,
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: THEME.COLORS.GRAY_2,
  },
  selected: {
    borderColor: THEME.COLORS.ACCENT_GREEN,
    backgroundColor: THEME.COLORS.ACCENT_GREEN,
  },
  label: {
    fontSize: 16,
    paddingLeft: 10,
    color: THEME.COLORS.GRAY_2,
    lineHeight: 16,
  },
  input: {
    marginTop: 10,
    marginLeft: 30,
    padding: 2,
    borderBottomWidth: 1,
    borderColor: THEME.COLORS.GRAY_2,
    color: THEME.COLORS.GRAY_2,
  }
}
export default StyleSheet.create(styles)
