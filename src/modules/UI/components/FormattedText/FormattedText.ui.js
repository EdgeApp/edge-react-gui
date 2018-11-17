/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { Text } from 'react-native'

import { scale } from '../../../../lib/scaling.js'
import { getObjectDiff } from '../../../../util/utils.js'
import styles from './style'

export default class FormattedText extends Component {
  shouldComponentUpdate (nextProps) {
    const diffElement = getObjectDiff(this.props, nextProps, { style: true, children: true })
    return !!diffElement
  }

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
    const fontSize = this.props.fontSize ? scale(this.props.fontSize) : scale(14)
    return (
      <Text {...this.props} style={[this.style, { fontSize }, this.props.style]} ref={'nativeForward'} allowFontScaling={false}>
        {this.props.children}
      </Text>
    )
  }
}
