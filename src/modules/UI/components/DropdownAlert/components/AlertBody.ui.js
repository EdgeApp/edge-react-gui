// @flow
import React, {Component, type Node} from 'react'
import {View} from 'react-native'

type Props = {
  style?: Object,
  children?: Node
}
export default class AlertBody extends Component<Props> {
  render () {
    const {children, style} = this.props

    return <View styles={style}>
      {children}
    </View>
  }
}
