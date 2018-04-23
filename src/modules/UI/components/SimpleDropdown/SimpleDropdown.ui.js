// @flow

import React, { Component } from 'react'
import type { Node } from 'react'
import { Platform, StylesSheet, TouchableWithoutFeedback, View } from 'react-native'
import * as Animatable from 'react-native-animatable'
import Ionicon from 'react-native-vector-icons/Ionicons'

import styles, { rawStyle } from './style.js'

export type Props = {
  height?: number,
  children?: Node,
  onPress: () => void,
  containerStyle: StylesSheet.Styles
}

export type State = {}

export default class WalletListProgressDropdown extends Component<Props> {
  render () {
    const exitIconName = (Platform.OS === 'ios' ? 'ios' : 'md') + '-close'
    return (
      <Animatable.View animation={'fadeIn'} duration={6000} style={[styles.container, this.props.containerStyle, { height: this.props.height }]}>
        <TouchableWithoutFeedback style={styles.touchableContainer} onPress={this.props.onPress}>
          <View style={styles.touchableInterior}>
            <View style={styles.sideGap} />
            {this.props.children}
            <View style={styles.sideGap}>
              <Ionicon style={styles.icon} name={exitIconName} size={22} color={rawStyle.icon.color} />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Animatable.View>
    )
  }
}
