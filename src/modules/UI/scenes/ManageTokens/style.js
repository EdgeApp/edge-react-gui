import {StyleSheet} from 'react-native'

import THEME from '../../../../theme/variables/airbitz'
import PLATFORM from '../../../../theme/variables/platform'

export const styles = {
  gradient: {
    height: 66,
    width: '100%',
    position: 'absolute'
  },
  container: {
    position: 'relative',
    height: PLATFORM.deviceHeight - 66,
    top: 66,
    backgroundColor: THEME.COLORS.WHITE,
    paddingBottom: 32
  },
  leftArea: {
    flexDirection: 'row'
  },
  icon: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: 22,
    color: THEME.COLORS.WHITE
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
  instructionalArea: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flex: 1
  },
  instructionalText: {
    fontSize: 16,
    textAlign: 'center'
  },
  metaTokenListArea: {
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.GRAY_3,
    flex: 11
  },
  metaTokenListWrap: {
    flex: 1
  },
  tokenList: {
    flex: 1
  },

  /////// start of token row styling ///////
  manageTokenRow: {
    height: 44,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    paddingLeft: 20,
    paddingRight: 20,
  },
  manageTokenRowInterior: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenNameArea: {
    alignSelf: 'center'
  },
  tokenNameText: {
    color: THEME.COLORS.GRAY_1,
    fontSize: 16
  },
  tokenCheckboxArea: {
    alignSelf: 'center'
  },
  underlay: {
    color: THEME.COLORS.PRIMARY_BUTTON_TOUCHED
  },

  /////// end of token row styling /////////
  buttonsArea: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 20,
  },
  addButton: {
    flex: 1,
    marginRight: 2,
    backgroundColor: THEME.COLORS.GRAY_2,
    borderRadius: 3
  },
  buttonText: {
    color: THEME.COLORS.WHITE,
    fontSize: 18
  },
  saveButton: {
    flex: 1,
    marginLeft: 2,
    backgroundColor: THEME.COLORS.SECONDARY,
    borderRadius: 3
  }
}

export default StyleSheet.create(styles)
