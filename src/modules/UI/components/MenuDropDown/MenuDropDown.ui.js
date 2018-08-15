// @flow

import React, { Component } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Menu, { MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu'
import slowlog from 'react-native-slowlog'

import * as Constants from '../../../../constants/indexConstants'
import { getObjectDiff } from '../../../utils'
import { Icon } from '../Icon/Icon.ui'

type Props = {
  style: StyleSheet.Styles,
  data: any,
  icon: string,
  iconType: string,
  onSelect: Function
}

type State = {
  height: number,
  pageY: number
}

class MenuDropDown extends Component<Props, State> {
  static defaultProps = {
    iconType: Constants.ENTYPO,
    icon: Constants.THREE_DOT_MENU
  }

  constructor (props: Props) {
    super(props)
    this.state = {
      height: 0,
      pageY: 0
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  shouldComponentUpdate (nextProps: Props, nextState: State) {
    let diffElement2: string = ''
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

  renderMenuOptions (style: StyleSheet.Styles) {
    const items = this.props.data.map(item => (
      <MenuOption style={style.menuOption} value={item.value} key={'ld' + (item.key || item.value)}>
        <View style={style.menuOptionItem}>
          <Text style={style.optionText}>{item.label}</Text>
        </View>
      </MenuOption>
    ))
    return items
  }

  render () {
    const style = this.props.style

    return (
      <View style={style.container}>
        <Menu style={style.menuButton} onSelect={this.props.onSelect}>
          <MenuTrigger customStyles={style.menuTrigger}>{this.renderMenuIcon(style)}</MenuTrigger>
          <MenuOptions customStyles={style.menuOptions}>{this.renderMenuOptions(style)}</MenuOptions>
        </Menu>
      </View>
    )
  }
  renderMenuIcon = (style: StyleSheet.Styles) => {
    if (this.props.icon) {
      return (
        <View style={style.menuIconWrap}>
          <Icon style={style.icon} name={this.props.icon} size={style.icon.fontSize} type={this.props.iconType} />
        </View>
      )
    }
  }
}
export { MenuDropDown }
