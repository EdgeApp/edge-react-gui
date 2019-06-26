// @flow

import React, { Component } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'

import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
// import {sprintf} from 'sprintf-js'
import StylizedModal from '../../modules/UI/components/Modal/Modal.ui'
// import strings from '../../../../../locales/default'
import THEME from '../../theme/variables/airbitz'
import TwoButtonsComponent from './TwoButtonsComponent.js'

type Props = {
  style: StyleSheet.Styles,
  headerText: string,
  launchModal: boolean,
  middleText: string,
  icon: string,
  iconType: string,
  cancelText: string,
  doneText: string,
  onCancel(): void,
  onDone(): void,
  onExitButtonFxn(): void,
  iconImage?: string
}

class TwoButtonTextModalComponent extends Component<Props> {
  onDone = () => {
    this.props.onDone()
  }
  renderMiddle = (style: StyleSheet.Styles) => {
    return (
      <View style={style.middle.container}>
        <Text style={style.middle.text}>{this.props.middleText}</Text>
      </View>
    )
  }
  renderIcon = (style: StyleSheet.Styles) => {
    if (this.props.iconImage) {
      return <Image source={this.props.iconImage} />
    }
    return <Icon style={style.icon} name={this.props.icon} size={40} type={this.props.iconType} />
  }
  render () {
    const modalBottom = (
      <TwoButtonsComponent cancelText={this.props.cancelText} doneText={this.props.doneText} onDone={this.onDone} onCancel={this.props.onCancel} />
    )

    const style = this.props.style
    const icon = this.renderIcon(style)

    return (
      <StylizedModal
        visibilityBoolean={this.props.launchModal}
        featuredIcon={icon}
        headerText={this.props.headerText}
        headerTextStyle={{ color: THEME.COLORS.PRIMARY, marginTop: -10, marginBottom: 10 }}
        modalMiddle={this.renderMiddle(style)}
        modalBottom={modalBottom}
        onExitButtonFxn={this.props.onExitButtonFxn}
      />
    )
  }
}

export { TwoButtonTextModalComponent }
