// @flow

import React, { Component } from 'react'
import {
  // StyleSheet,
  Text
} from 'react-native'
import PropTypes from 'prop-types'

import { THEME } from '../../../../../theme/variables/airbitz.js'

const rawStyles = {
  fontFamily: THEME.FONTS.DEFAULT,
  fontSize: 18
}
// const style = StyleSheet.create(rawStyles) // unknown error

export type Props = {
  children: string,
  style?: Object
}
export type State = {}

export class Title extends Component<Props, State> {
  render () {
    return <Text style={[rawStyles, this.props.style]}>{this.props.children}</Text>
  }
}

Title.propTypes = {
  children: PropTypes.node.isRequired,
  style: PropTypes.object
}
