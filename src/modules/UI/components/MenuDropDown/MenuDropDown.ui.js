// @flow
import React, { Component } from 'react'
import { Text, View } from 'react-native'
import Menu, { MenuOption, MenuOptions, MenuTrigger } from 'react-native-menu'

import * as Constants from '../../../../constants/indexConstants'
import { Icon } from '../Icon/Icon.ui'

type Props = {
  style: any,
  data: any,
  icon: string,
  iconType: string,
  onSelect: Function
}

export default class MenuDropDown extends Component<Props> {
  static defaultProps = {
    iconType: Constants.ENTYPO,
    icon: Constants.THREE_DOT_MENU
  }
  renderMenuOptions (style: any) {
    const items = this.props.data.map(item => (
      <MenuOption style={style.menuOption} value={item.value} key={'ld' + (item.key || item.value)}>
        <View style={[style.menuOptionItem]}>
          <Text style={[style.optionText]}>{item.label}</Text>
        </View>
      </MenuOption>
    ))
    return items
  }

  render () {
    let optionsStyle = {}
    if (this.props.rightSide) {
      optionsStyle = { left: '1%' }
    }
    const style = this.props.style
    return (
      <View style={[style.container]}>
        <Menu style={[style.menuButton]} onSelect={value => this.props.onSelect(value)}>
          <MenuTrigger style={[style.menuTrigger]}>{this.renderMenuIcon(style)}</MenuTrigger>
          <MenuOptions optionsContainerStyle={optionsStyle}>{this.renderMenuOptions(style)}</MenuOptions>
        </Menu>
      </View>
    )
  }
  renderMenuIcon = (style: any) => {
    if (this.props.icon) {
      return <Icon style={style.icon} name={this.props.icon} size={style.icon.fontSize} type={this.props.iconType} />
    }
  }
}
