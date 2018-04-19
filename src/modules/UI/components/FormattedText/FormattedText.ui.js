/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { Text } from 'react-native'

import styles from './style'

export default class FormattedText extends Component {
  constructor (props) {
    super(props)
    this.style = this.props.isBold ? [styles.boldStyle] : [styles.defaultStyle]

    if (props.style) {
      if (Array.isArray(props.style)) {
        this.style = this.style.concat(props.style)
      } else {
        this.style.push(props.style)
      }
    }
  }

  setNativeProps (props) {
    this.refs['nativeForward'].setNativeProps(props)
  }

  render () {
    return (
      <Text {...this.props} style={[this.style, this.props.style]} ref={'nativeForward'} allowFontScaling={false}>
        {this.props.children}
      </Text>
    )
  }
}
