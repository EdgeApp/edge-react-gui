// @flow

import * as React from 'react'
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'

import { styles } from './styles.js'

// CONTAINER /////////////////////////////////////////////////////////////////////////////
export type ContainerProps = {
  children: React.Node,
  style?: StyleSheet.Styles
}
export class Container extends React.Component<ContainerProps> {
  render() {
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
  children: React.Node,
  style?: StyleSheet.Styles
}
export class Header extends React.Component<HeaderProps> {
  render() {
    const { children, style, ...props } = this.props
    return (
      <View style={[styles.header, style]} {...props}>
        {children}
      </View>
    )
  }
}

// ANDROID_HACK_SPACER /////////////////////////////////////////////////////////////////////////////
/*
  This spacer should be used with Icon to overcome the limitations on Android
  React Native on Android does not support 'Overflow'
  If/When React Native on Android supports 'Overflow',
    * remove the hack component
    * move the Icon component inside Modal.Container
  https://github.com/facebook/react-native/issues/6802
*/
type AndroidHackSpacerProps = {}
export class AndroidHackSpacer extends React.Component<AndroidHackSpacerProps> {
  render() {
    return <View style={styles.androidHackSpacer} />
  }
}

// ICON /////////////////////////////////////////////////////////////////////////////
export type IconProps = {
  children: React.Node,
  style?: StyleSheet.Styles
}
export class Icon extends React.Component<IconProps> {
  static AndroidHackSpacer = AndroidHackSpacer
  render() {
    const { children, style, ...props } = this.props
    return (
      <View style={[styles.icon, style]} {...props}>
        {children}
      </View>
    )
  }
}

// TITLE /////////////////////////////////////////////////////////////////////////////
type TitleProps = {
  children: React.Node,
  style?: StyleSheet.Styles
}
export class Title extends React.Component<TitleProps> {
  render() {
    const { children, style, ...props } = this.props
    return (
      <Text style={[styles.title, style]} {...props}>
        {children}
      </Text>
    )
  }
}

// DESCRIPTION /////////////////////////////////////////////////////////////////////////////
export type DescriptionProps = {
  children: React.Node,
  style?: StyleSheet.Styles
}
export class Description extends React.Component<DescriptionProps> {
  render() {
    const { children, style, ...props } = this.props
    return (
      <Text style={[styles.description, style]} {...props}>
        {children}
      </Text>
    )
  }
}

// BODY /////////////////////////////////////////////////////////////////////////////
type BodyProps = {
  children: React.Node,
  style?: StyleSheet.Styles
}
export class Body extends React.Component<BodyProps> {
  render() {
    const { children, style, ...props } = this.props
    return (
      <View style={[styles.body, style]} {...props}>
        {children}
      </View>
    )
  }
}

// FOOTER /////////////////////////////////////////////////////////////////////////////
type FooterProps = {
  children: React.Node,
  style?: StyleSheet.Styles
}
export class Footer extends React.Component<FooterProps> {
  render() {
    const { children, style, ...props } = this.props
    return (
      <View style={[styles.footer, style]} {...props}>
        {children}
      </View>
    )
  }
}

// Item /////////////////////////////////////////////////////////////////////////////
type ItemProps = {
  children: React.Node,
  style?: StyleSheet.Styles
}
export class Item extends React.Component<ItemProps> {
  render() {
    const { children, style, ...props } = this.props
    return (
      <View style={[styles.item, style]} {...props}>
        {children}
      </View>
    )
  }
}

// Row /////////////////////////////////////////////////////////////////////////////
type RowProps = {
  children: React.Node,
  style?: StyleSheet.Styles
}
export class Row extends React.Component<RowProps> {
  render() {
    const { children, style, ...props } = this.props
    return (
      <View style={[styles.row, style]} {...props}>
        {children}
      </View>
    )
  }
}

// INTERACTIVE_MODAL /////////////////////////////////////////////////////////////////////////////
type Props = {
  isActive?: boolean,
  children: React.Node,
  style?: StyleSheet.Styles,
  legacy?: boolean
}
export class InteractiveModal extends React.Component<Props> {
  static Icon = Icon
  static Title = Title
  static Description = Description
  static Body = Body
  static Footer = Footer
  static Item = Item
  static Row = Row

  render() {
    const { isActive, style, ...props } = this.props
    const children = React.Children.toArray(this.props.children)
    const icon = children.find(child => child.type === InteractiveModal.Icon)
    const title = children.find(child => child.type === InteractiveModal.Title) || null
    const body = children.find(child => child.type === InteractiveModal.Body)
    const footer = children.find(child => child.type === InteractiveModal.Footer)

    const deviceWidth = Dimensions.get('window').width
    const deviceHeight = Platform.OS === 'ios' ? Dimensions.get('window').height : require('react-native-extra-dimensions-android').get('REAL_WINDOW_HEIGHT')

    return this.props.legacy ? (
      <Modal avoidKeyboard deviceHeight={deviceHeight} deviceWidth={deviceWidth} isVisible={isActive} style={[styles.modal, style]} useNativeDriver {...props}>
        {icon}
        <Container style={style}>
          <Icon.AndroidHackSpacer />
          <Header style={styles.header}>{title}</Header>
          {body}
          {footer}
        </Container>
      </Modal>
    ) : (
      <View style={styles.modal} {...props}>
        {icon}
        <Container style={style}>
          <Icon.AndroidHackSpacer />
          <Header style={styles.header}>{title}</Header>
          {body}
          {footer}
        </Container>
      </View>
    )
  }
}
