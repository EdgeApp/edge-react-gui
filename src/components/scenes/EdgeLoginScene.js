// @flow

import type { EdgeLobby } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Image, Text, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { PrimaryButton, SecondaryButton } from '../../modules/UI/components/Buttons/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'

type EdgeLoginSceneProps = {
  style: Object,
  lobby?: EdgeLobby,
  error?: string,
  isProcessing: boolean,
  accept(): void,
  decline(): void
}

export default class EdgeLoginScene extends Component<EdgeLoginSceneProps> {
  renderBody (style: Object) {
    let message = this.props.error
    let textStyle = style.bodyText
    if (!this.props.error) {
      message = s.strings.edge_description
    }
    if (!this.props.lobby && !this.props.error) {
      throw new Error('Not normal expected behavior')
    }
    if (this.props.lobby && this.props.lobby.loginRequest && this.props.lobby.loginRequest.appId === '') {
      textStyle = style.bodyText
      message = sprintf(s.strings.edge_description_warning, this.props.lobby.loginRequest.displayName)
    }
    return (
      <View style={style.body}>
        <Text style={textStyle}>{message}</Text>
      </View>
    )
  }
  renderButtons (style: Object) {
    if (this.props.isProcessing) {
      return (
        <View style={style.buttonsProcessing}>
          <ActivityIndicator />
        </View>
      )
    }
    if (this.props.error) {
      return (
        <View style={style.buttonContainer}>
          <View style={style.buttons}>
            <SecondaryButton style={style.cancelSolo} onPress={this.props.decline}>
              <SecondaryButton.Text>{s.strings.string_cancel_cap}</SecondaryButton.Text>
            </SecondaryButton>
          </View>
        </View>
      )
    }
    return (
      <View style={style.buttonContainer}>
        <View style={style.buttons}>
          <SecondaryButton style={style.cancel} onPress={this.props.decline}>
            <SecondaryButton.Text>{s.strings.string_cancel_cap}</SecondaryButton.Text>
          </SecondaryButton>
          <PrimaryButton style={style.submit} onPress={this.props.accept}>
            <PrimaryButton.Text>{s.strings.accept_button_text}</PrimaryButton.Text>
          </PrimaryButton>
        </View>
      </View>
    )
  }
  renderImage (style: Object) {
    if (this.props.lobby && this.props.lobby.loginRequest && this.props.lobby.loginRequest.displayImageUrl) {
      return <Image style={style.image} resizeMode={'contain'} source={{ uri: this.props.lobby.loginRequest.displayImageUrl }} />
    }
    return null
  }
  renderHeader (style: Object) {
    let title = ''
    if (this.props.lobby && this.props.lobby.loginRequest) {
      title = this.props.lobby.loginRequest.displayName ? this.props.lobby.loginRequest.displayName : ''
    }
    if (this.props.lobby) {
      return (
        <View style={style.header}>
          <View style={style.headerTopShim} />
          <View style={style.headerImageContainer}>{this.renderImage(style)}</View>
          <View style={style.headerTopShim} />
          <View style={style.headerTextRow}>
            <Text style={style.bodyText}>{title}</Text>
          </View>
          <View style={style.headerBottomShim} />
        </View>
      )
    }
    return <View style={style.header} />
  }
  render () {
    const Style = this.props.style
    if (!this.props.lobby && !this.props.error) {
      return (
        <View style={Style.spinnerContainer}>
          <ActivityIndicator />
        </View>
      )
    }
    return (
      <SafeAreaView>
        <Gradient style={Style.gradient} />
        <View style={Style.container}>
          {this.renderHeader(Style)}
          {this.renderBody(Style)}
          {this.renderButtons(Style)}
        </View>
      </SafeAreaView>
    )
  }
}
