// @flow

import React, { Component } from 'react'
import { StyleSheet, View } from 'react-native'

import styles from './styles.js'

export type SeparatorProps = {
  style?: StyleSheet.style
}
export class Separator extends Component<SeparatorProps> {
  render() {
    const { style, ...props } = this.props

    return <View style={[styles.separator, style]} {...props} />
  }
}
