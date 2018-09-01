// @flow

import React, { Component } from 'react'
import { StyleSheet, Text } from 'react-native'

import { THEME } from '../../../../../theme/variables/airbitz.js'

const styles = StyleSheet.create({
  title: {
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: 18
  }
})

export type Props = {
  children: string,
  style?: Object
}
export type State = {}

export class Title extends Component<Props, State> {
  render () {
    return <Text style={[styles.title, this.props.style]}>{this.props.children}</Text>
  }
}
