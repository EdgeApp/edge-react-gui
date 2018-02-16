// @flow
import React, {Component} from 'react'
import {View, Text, UIManager, findNodeHandle} from 'react-native'
import Menu, {MenuOptions, MenuOption, MenuTrigger} from 'react-native-menu'
import {Icon} from '../Icon/Icon.ui'
import * as Constants from '../../../../constants/indexConstants'
import {PLATFORM} from '../../../../theme/variables/platform.js'

type Props = {
  style: any,
  data: any,
  icon: string,
  iconType: string,
  onSelect: Function
}

type State = {
  height: number,
  pageY: number
}

export default class MenuDropDown extends Component<Props, State> {
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
  }

  _onInternalLayout = (event: Object) => {
    const view = this.refs['menuInterior']
    const handle = findNodeHandle(view)
    UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
      if (height > 1) {
        this.setState({
          height,
          pageY
        })
      } else {
        this.setState({
          height: height * 1000,
          pageY
        })
      }
    })
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

  // -- MenuOptions component should be followed by MenuOption component because MenuOptions pass props into its children,
  // -- this case props is inherited by View and not MenuOption. Workaround is to create a new React class witht the View and custom style
  // -- and pass the props to MenuOption component
  //
  // render () {
  //   const deviceHeight = PLATFORM.deviceHeight
  //   const verticalBuffer = ((this.state.pageY + this.state.height - 8) > PLATFORM.deviceHeight) ? 12 : 0
  //   const lowerLimitOfMenu = this.state.pageY + this.state.height
  //   const offset = lowerLimitOfMenu - deviceHeight
  //   const newPageY = this.state.pageY - offset - verticalBuffer
  //   const optionsStyle = {}
  //   const style = this.props.style
  //   if (lowerLimitOfMenu > deviceHeight) {
  //     optionsStyle.top = newPageY
  //   }
  //   return (
  //     <View style={[style.container]}>
  //       <Menu style={[style.menuButton]} onSelect={(value) => this.props.onSelect(value)}>
  //         <MenuTrigger style={[style.menuTrigger]}>
  //           {this.renderMenuIcon(style)}
  //         </MenuTrigger>
  //         <MenuOptions ref='menuInteriorParent' optionsContainerStyle={[optionsStyle]}>
  //           <View ref='menuInterior' onLayout={this._onInternalLayout}>
  //             {this.renderMenuOptions(style)}
  //           </View>
  //         </MenuOptions>
  //       </Menu>
  //     </View>
  //   )
  // }

  render () {
    const deviceHeight = PLATFORM.deviceHeight
    const verticalBuffer = ((this.state.pageY + this.state.height - 8) > PLATFORM.deviceHeight) ? 12 : 0
    const lowerLimitOfMenu = this.state.pageY + this.state.height
    const offset = lowerLimitOfMenu - deviceHeight
    const newPageY = this.state.pageY - offset - verticalBuffer
    const optionsStyle = {}
    const style = this.props.style
    if (lowerLimitOfMenu > deviceHeight) {
      optionsStyle.top = newPageY
    }
    return (
      <View style={[style.container]}>
        <Menu style={[style.menuButton]} onSelect={(value) => this.props.onSelect(value)}>
          <MenuTrigger style={[style.menuTrigger]}>
            {this.renderMenuIcon(style)}
          </MenuTrigger>
          <MenuOptions ref='menuInteriorParent' optionsContainerStyle={[optionsStyle]}>
            {this.renderMenuOptions(style)}
          </MenuOptions>
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
