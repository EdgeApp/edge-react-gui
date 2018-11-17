// @flow

import React, { Component } from 'react'
import { View } from 'react-native'
import slowlog from 'react-native-slowlog'

import * as Constants from '../../constants/indexConstants.js'
import { TextAndIconButton } from '../../modules/UI/components/Buttons/TextAndIconButton.ui.js'
import THEME from '../../theme/variables/airbitz.js'

type Props = {
  style: Object,
  children: any,
  showMessage: string,
  hideMessage: string
}

type State = {
  collapsed: boolean
}
class ExpandableBoxComponent extends Component<Props, State> {
  constructor (props: any) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  UNSAFE_componentWillMount () {
    this.setState({
      collapsed: true
    })
  }
  onPress = () => {
    this.setState({
      collapsed: !this.state.collapsed
    })
  }

  renderTop = (style: Object) => {
    const msg = this.state.collapsed ? this.props.showMessage : this.props.hideMessage
    const icon = this.state.collapsed ? Constants.KEYBOARD_ARROW_DOWN : Constants.KEYBOARD_ARROW_UP
    return (
      <View style={style.top}>
        <TextAndIconButton style={style.textIconButton} icon={icon} iconType={Constants.MATERIAL_ICONS} onPress={this.onPress} title={msg} />
      </View>
    )
  }

  renderBottom = (style: Object) => {
    if (!this.state.collapsed) {
      return (
        <View style={style.bottom}>
          <View style={style.bottomInfo}>
            <View style={style.bottomInner}>{this.props.children}</View>
          </View>
        </View>
      )
    }
    return null
  }

  render () {
    const style = this.props.style
    return (
      <View
        style={[
          style.container,
          !this.state.collapsed && {
            ...style.container,
            borderWidth: 0,
            borderColor: THEME.COLORS.GRAY_3
          }
        ]}
      >
        {this.renderTop(style)}
        {this.renderBottom(style)}
      </View>
    )
  }
}

export { ExpandableBoxComponent }
