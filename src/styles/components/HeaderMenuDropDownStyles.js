// @flow

import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform'
import * as Styles from '../indexStyles'

const HeaderMenuRightSideStyle = {
  menuContainer: {
    width: 300,
    height: PLATFORM.deviceHeight,
    backgroundColor: 'rgba(255,255,255,.8)'
  },
  buttonContainer: {
    width: 40,
    height: 35,
    backgroundColor: 'rgba(255,255,255,0)'
  },
  iconButton: { ...Styles.IconButtonStyle, iconSize: 15 }
}

const MenuDropDownStyle = {
  container: {
    flexDirection: 'row',
    width: 46
  },
  menuButton: {},
  menuOption: {
    borderBottomColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: 1,
    justifyContent: 'center'
  },
  menuTrigger: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 14,
    paddingRight: 10
  },
  menuOptionItem: {
    flexDirection: 'row'
  },
  optionText: {
    color: THEME.COLORS.GRAY_1,
    fontSize: 18
  },
  icon: {
    fontSize: 20,
    color: THEME.COLORS.GRAY_1
  },
  altIconText: {
    fontSize: 20
  }
}

const MenuDropDownStyleHeader = {
  ...MenuDropDownStyle,
  menuTrigger: {
    paddingLeft: 14,
    paddingRight: 10
  }
}

export { HeaderMenuRightSideStyle }
export { MenuDropDownStyle }
export { MenuDropDownStyleHeader }
