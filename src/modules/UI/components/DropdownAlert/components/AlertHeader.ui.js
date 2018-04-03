// @flow
import React, { Component } from 'react'
import type { Node } from 'react'
import { StyleSheet, View } from 'react-native'

type Props = {
  style?: StyleSheet.Styles,
  children?: Node
}

export default class AlertHeader extends Component<Props> {
  render () {
    const { children, style } = this.props

    return <View style={style}>{children}</View>
  }
}
