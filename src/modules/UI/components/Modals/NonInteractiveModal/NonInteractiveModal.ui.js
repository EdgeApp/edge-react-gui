// @flow

import React, { Component } from 'react'
import type { Node } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { default as Modal } from 'react-native-modal'

import { Gradient } from '../../Gradient/Gradient.ui.js'
import { styles } from './styles.js'

// CONTAINER /////////////////////////////////////////////////////////////////////////////
export type ContainerProps = {
  children: Node,
  style?: StyleSheet.Styles
}
export class Container extends Component<ContainerProps> {
  render () {
    const { children, style, ...props } = this.props
    return (
      <View style={[styles.container, style]} {...props}>
        {children}
      </View>
    )
  }
}

// HEADER /////////////////////////////////////////////////////////////////////////////
export type HeaderProps = {
  children: Node,
  style?: StyleSheet.Styles
}
export class Header extends Component<HeaderProps> {
  render () {
    const { children, style, ...props } = this.props
    return (
      <View style={[styles.header, style]} {...props}>
        <Gradient reverse style={[styles.gradient]}>
          {children}
        </Gradient>
      </View>
    )
  }
}

// FOOTER /////////////////////////////////////////////////////////////////////////////
export type FooterProps = {
  children: Node,
  style?: StyleSheet.Styles
}
export class Footer extends Component<FooterProps> {
  render () {
    const { children, style, ...props } = this.props
    return (
      <View style={[styles.footer, style]} {...props}>
        {children}
      </View>
    )
  }
}

// ICON /////////////////////////////////////////////////////////////////////////////
export type IconProps = {
  children: Node,
  style?: StyleSheet.Styles
}
export class Icon extends Component<IconProps> {
  render () {
    const { children, style, ...props } = this.props
    return (
      <View style={[styles.icon, style]} {...props}>
        {children}
      </View>
    )
  }
}

// MESSAGE /////////////////////////////////////////////////////////////////////////////
export type MessageProps = {
  children: Node,
  style?: StyleSheet.Styles
}
export class Message extends Component<MessageProps> {
  render () {
    const { children, style, ...props } = this.props
    return (
      <Text style={[styles.message, style]} {...props}>
        {children}
      </Text>
    )
  }
}

// NON_INTERACTIVE_MODAL /////////////////////////////////////////////////////////////////////////////
export type Props = {
  isVisible: boolean,
  durationInSeconds: number,
  children: Node,
  onModalShow: () => void,
  onModalHide: () => void,
  onExpired?: () => void,
  onCancel?: () => void,
  onBackdropPress?: () => void,
  onBackButtonPress?: () => void
}
export class NonInteractiveModal extends Component<Props> {
  static Header = Header
  static Footer = Footer
  static Icon = Icon
  static Message = Message

  static defaultProps = {
    durationInSeconds: 8,
    onModalShow: () => {},
    onModalHide: () => {},
    onExpired: () => {},
    onCancel: () => {},
    onBackdropPress: () => {},
    onBackButtonPress: () => {}
  }

  timer: number

  render () {
    const { isVisible } = this.props
    const children = React.Children.toArray(this.props.children)
    const icon = children.find(child => child.type === NonInteractiveModal.Icon)
    const message = children.find(child => child.type === NonInteractiveModal.Message)

    return (
      <Modal useNativeDriver isVisible={isVisible} onModalShow={this.onModalShow} onModalHide={this.onModalHide} {...this.props}>
        <Container style={styles.container}>
          <Header>{icon}</Header>
          <Footer>{message}</Footer>
        </Container>
      </Modal>
    )
  }

  onModalShow = () => {
    this.timer = setTimeout(this.props.onExpired, this.props.durationInSeconds * 1000)
    this.props.onModalShow()
  }

  onModalHide = () => {
    clearTimeout(this.timer)
    this.props.onModalHide()
  }
}
