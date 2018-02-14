// @flow
import React, { Component } from 'react'
import type { Node } from 'react'
import { View } from 'react-native'

type Props = {
  style?: Object,
  children?: Node
}
export default class AlertContainer extends Component<Props> {
  render () {
    const { children, style } = this.props

    return <View style={style}>{children}</View>
  }
}
