// @flow
import React, {Component, type Node} from 'react'
import {View} from 'react-native'

type Props = {
  style?: Object,
  children?: Node
}

export default class AlertHeader extends Component<Props> {
  render () {
    const {children, style} = this.props

    return <View style={style}>
      {children}
    </View>
  }
}
