// @flow

import type { EdgeLobby } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Image, Text, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { PrimaryButton, SecondaryButton } from '../../modules/UI/components/Buttons/index'
import { styles } from '../../styles/scenes/EdgeLoginSceneStyle.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type EdgeLoginSceneProps = {
  lobby?: EdgeLobby,
  error?: string,
  isProcessing: boolean,
  accept(): void,
  decline(): void
}

export default class EdgeLoginScene extends Component<EdgeLoginSceneProps> {
  renderBody() {
    let message = this.props.error
    if (!this.props.error) {
      message = s.strings.edge_description
    }
    if (!this.props.lobby && !this.props.error) {
      throw new Error('Not normal expected behavior')
    }
    if (this.props.lobby && this.props.lobby.loginRequest && this.props.lobby.loginRequest.appId === '') {
      message = sprintf(s.strings.edge_description_warning, this.props.lobby.loginRequest.displayName)
    }
    return (
      <View style={styles.body}>
        <Text style={styles.bodyText}>{message}</Text>
      </View>
    )
  }

  renderButtons() {
    if (this.props.isProcessing) {
      return (
        <View style={styles.buttonsProcessing}>
          <ActivityIndicator />
        </View>
      )
    }
    if (this.props.error) {
      return (
        <View style={styles.buttonContainer}>
          <View style={styles.buttons}>
            <SecondaryButton style={styles.cancelSolo} onPress={this.props.decline}>
              <SecondaryButton.Text>{s.strings.string_cancel_cap}</SecondaryButton.Text>
            </SecondaryButton>
          </View>
        </View>
      )
    }
    return (
      <View style={styles.buttonContainer}>
        <View style={styles.buttons}>
          <SecondaryButton style={styles.cancel} onPress={this.props.decline}>
            <SecondaryButton.Text>{s.strings.string_cancel_cap}</SecondaryButton.Text>
          </SecondaryButton>
          <PrimaryButton style={styles.submit} onPress={this.props.accept}>
            <PrimaryButton.Text>{s.strings.accept_button_text}</PrimaryButton.Text>
          </PrimaryButton>
        </View>
      </View>
    )
  }

  renderImage() {
    if (this.props.lobby && this.props.lobby.loginRequest && this.props.lobby.loginRequest.displayImageUrl) {
      return <Image style={styles.image} resizeMode="contain" source={{ uri: this.props.lobby.loginRequest.displayImageUrl }} />
    }
    return null
  }

  renderHeader() {
    let title = ''
    if (this.props.lobby && this.props.lobby.loginRequest) {
      title = this.props.lobby.loginRequest.displayName ? this.props.lobby.loginRequest.displayName : ''
    }
    if (this.props.lobby) {
      return (
        <View style={styles.header}>
          <View style={styles.headerTopShim} />
          <View style={styles.headerImageContainer}>{this.renderImage()}</View>
          <View style={styles.headerTopShim} />
          <View style={styles.headerTextRow}>
            <Text style={styles.bodyText}>{title}</Text>
          </View>
          <View style={styles.headerBottomShim} />
        </View>
      )
    }
    return <View style={styles.header} />
  }

  render() {
    if (!this.props.lobby && !this.props.error) {
      return (
        <SceneWrapper background="body">
          <View style={styles.spinnerContainer}>
            <Text style={styles.loadingTextBody}>{s.strings.edge_login_fetching}</Text>
            <ActivityIndicator />
          </View>
        </SceneWrapper>
      )
    }
    return (
      <SceneWrapper background="body">
        {this.renderHeader()}
        {this.renderBody()}
        {this.renderButtons()}
      </SceneWrapper>
    )
  }
}
