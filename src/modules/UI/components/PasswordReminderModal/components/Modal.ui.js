// @flow

import React, { Component } from 'react'
import type { Node } from 'react'
import { Text, View } from 'react-native'
import Modal from 'react-native-modal'

import styles from './modalStyles.js'

export { Modal }
export default Modal

// CONTAINER /////////////////////////////////////////////////////////////////////////////
export type ContainerProps = {
  children: Node,
  style?: Object
}
export type ContainerState = {}

Modal.Container = class Container extends Component<ContainerProps, ContainerState> {
  render () {
    return <View style={[styles.container, this.props.style]}>{this.props.children}</View>
  }
}

// FEATURED_ICON /////////////////////////////////////////////////////////////////////////////
export type FeaturedIconProps = {
  children: Node,
  style?: Object
}
export type FeaturedIconState = {}

Modal.FeaturedIcon = class FeaturedIcon extends Component<FeaturedIconProps, FeaturedIconState> {
  render () {
    return (
      <View style={[styles.featuredIconContainer]}>
        <View style={[styles.featuredIcon, this.props.style]}>{this.props.children}</View>
      </View>
    )
  }
}

// HEADER /////////////////////////////////////////////////////////////////////////////
export type HeaderProps = {
  children: Node,
  style?: Object
}
export type HeaderState = {}

Modal.Header = class Header extends Component<HeaderProps, HeaderState> {
  render () {
    return <View style={[styles.header, this.props.style]}>{this.props.children}</View>
  }
}

// TITLE /////////////////////////////////////////////////////////////////////////////
export type TitleProps = {
  children: Node,
  style?: Object
}
export type TitleState = {}

Modal.Title = class Title extends Component<TitleProps, TitleState> {
  render () {
    return <Text style={[styles.title, this.props.style]}>{this.props.children}</Text>
  }
}

// DESCRIPTION /////////////////////////////////////////////////////////////////////////////
export type DescriptionProps = {
  children: Node,
  style?: Object
}
export type DescriptionState = {}

Modal.Description = class Description extends Component<DescriptionProps, DescriptionState> {
  render () {
    return <Text style={[styles.description, this.props.style]}>{this.props.children}</Text>
  }
}

// ITEM /////////////////////////////////////////////////////////////////////////////
export type ItemProps = {
  children: Node,
  style?: Object
}
export type ItemState = {}

Modal.Item = class Item extends Component<ItemProps, ItemState> {
  render () {
    return <View style={[styles.item, this.props.style]}>{this.props.children}</View>
  }
}

// BODY /////////////////////////////////////////////////////////////////////////////
export type BodyProps = {
  children: Node,
  style?: Object
}
export type BodyState = {}

Modal.Body = class Body extends Component<BodyProps, BodyState> {
  render () {
    return <View style={[styles.body, this.props.style]}>{this.props.children}</View>
  }
}

// FOOTER /////////////////////////////////////////////////////////////////////////////
export type FooterProps = {
  children: Node,
  style?: Object
}
export type FooterState = {}

Modal.Footer = class Footer extends Component<FooterProps, FooterState> {
  render () {
    return <View style={[styles.footer, this.props.style]}>{this.props.children}</View>
  }
}
