/* eslint-disable quote-props */
// @flow

import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Menu, {
  MenuOption,
  MenuOptions,
  MenuTrigger
} from 'react-native-popup-menu'

import { THEME } from '../../../../theme/variables/airbitz.js'
import { scale } from '../../../../util/scaling.js'
import { getObjectDiff } from '../../../../util/utils.js'

export type StateProps = {
  style: StyleSheet.Styles,
  data: Object[]
}

export type DispatchProps = {
  onSelect: Function
}

type Props = StateProps & DispatchProps

type State = {
  height: number,
  pageY: number
}

export class MenuDropDown extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      height: 0,
      pageY: 0
    }
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    let diffElement2: string = ''
    // prettier-ignore
    const diffElement = getObjectDiff(this.props, nextProps, {
      data: true,
      value: true,
      '0': true,
      '1': true,
      '2': true,
      '3': true,
      '4': true,
      '5': true,
      '6': true,
      '7': true,
      '8': true
    })
    if (!diffElement) {
      diffElement2 = getObjectDiff(this.state, nextState)
    }
    return !!diffElement || !!diffElement2
  }

  renderMenuOptions(style: StyleSheet.Styles) {
    const items = this.props.data.map(item => (
      <MenuOption
        style={style.menuOption}
        value={item.value}
        key={'ld' + (item.key || item.value)}
      >
        <View style={style.menuOptionItem}>
          <Text style={style.optionText}>{item.label}</Text>
        </View>
      </MenuOption>
    ))
    return items
  }

  render() {
    const style = this.props.style
    return (
      <View style={style.container}>
        <Menu style={style.menuButton} onSelect={this.props.onSelect}>
          <MenuTrigger customStyles={style.menuTrigger}>
            <View style={style.menuIconWrap}>
              <Text style={style.icon}>&#8942;</Text>
            </View>
          </MenuTrigger>
          <MenuOptions customStyles={style.menuOptions}>
            {this.renderMenuOptions(style)}
          </MenuOptions>
        </Menu>
      </View>
    )
  }
}

const dropdownTriggerWidth = 46

export const MenuDropDownStyle = {
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
