// @flow

import React, { type Node, Component } from 'react'
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native'
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

// ITEM /////////////////////////////////////////////////////////////////////////////
type ItemProps = {
  children: Node,
  style?: StyleSheet.Styles
}
export class Item extends Component<ItemProps> {
  render () {
    const { children, style, ...props } = this.props

    return (
      <View style={[styles.item, style]} {...props}>
        {children}
      </View>
    )
  }
}

// ROW /////////////////////////////////////////////////////////////////////////////
type RowProps = {
  children: Node,
  style?: StyleSheet.Styles
}
export class Row extends Component<RowProps> {
  render () {
    const { children, style, ...props } = this.props

    return (
      <View style={[styles.row, style]} {...props}>
        {children}
      </View>
    )
  }
}

// NON_INTERACTIVE_MODAL /////////////////////////////////////////////////////////////////////////////
export type Props = {
  children: Node,
  style?: StyleSheet.Styles,
  durationInSeconds: number,
  isActive: boolean,
  onBackButtonPress?: () => void,
  onBackdropPress?: () => void,
  onExpire?: () => void,
  onModalHide: () => void,
  onModalShow: () => void
}
export class NonInteractiveModal extends Component<Props> {
  static Header = Header
  static Footer = Footer
  static Icon = Icon
  static Message = Message
  static Item = Item
  static Row = Row

  static defaultProps = {
    durationInSeconds: 8,
    onBackButtonPress: () => {},
    onBackdropPress: () => {},
    onExpire: () => {},
    onModalHide: () => {},
    onModalShow: () => {}
  }

  timer: TimeoutID

  render () {
    const { isActive, style, ...props } = this.props
    const children = React.Children.toArray(this.props.children)
    const icon = children.find(child => child.type === NonInteractiveModal.Icon)
    const footer = children.find(child => child.type === NonInteractiveModal.Footer)

    const deviceWidth = Dimensions.get('window').width
    const deviceHeight = Platform.OS === 'ios' ? Dimensions.get('window').height : require('react-native-extra-dimensions-android').get('REAL_WINDOW_HEIGHT')

    return (
      <Modal
        deviceHeight={deviceHeight}
        deviceWidth={deviceWidth}
        isVisible={isActive}
        onModalHide={this.onModalHide}
        onModalShow={this.onModalShow}
        useNativeDriver
        {...props}
      >
        <Container style={styles.container}>
          <Header>{icon}</Header>
          <Footer>{footer}</Footer>
        </Container>
      </Modal>
    )
  }

  onModalShow = () => {
    const { durationInSeconds, onExpire, onModalShow } = this.props

    if (onExpire != null) {
      this.timer = setTimeout(onExpire, durationInSeconds * 1000)
    }
    onModalShow()
  }

  onModalHide = () => {
    const { onModalHide } = this.props

    clearTimeout(this.timer)
    onModalHide()
  }
}
