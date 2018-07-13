// @flow

import React, { Component } from 'react'
import type { Node } from 'react'
import { View } from 'react-native'

export type Props = {
  children: Node
}
export class RadioRows extends Component<Props> {
  render () {
    return <View>{this.props.children}</View>
  }
}

export default RadioRows
