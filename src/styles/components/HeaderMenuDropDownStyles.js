// @flow

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

const dropdownTriggerWidth = 46

const MenuDropDownStyle = {
  container: {
    flexDirection: 'column',
    width: scale(dropdownTriggerWidth),
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuButton: {
    width: scale(dropdownTriggerWidth),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuOption: {
    borderBottomColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: 1,
    justifyContent: 'center'
  },
  menuTrigger: {
    triggerTouchable: {
      underlayColor: THEME.COLORS.TRANSPARENT,
      activeOpacity: 1,
      style: {
        width: scale(dropdownTriggerWidth),
        justifyContent: 'center',
        alignSelf: 'center',
        height: '100%',
        alignItems: 'center'
      }
    },
    menuTriggerUnderlay: {}
  },
  menuIconWrap: {
    width: scale(46),
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  menuOptions: {},
  menuOptionItem: {
    flexDirection: 'row',
    paddingVertical: scale(4),
    paddingHorizontal: scale(6)
  },
  optionText: {
    color: THEME.COLORS.GRAY_1,
    fontSize: scale(18)
  },
  icon: {
    fontSize: scale(20),
    color: THEME.COLORS.GRAY_1
  },
  altIconText: {
    fontSize: scale(20)
  }
}

const MenuDropDownStyleHeader = {
  ...MenuDropDownStyle
}

export { MenuDropDownStyle }
export { MenuDropDownStyleHeader }
