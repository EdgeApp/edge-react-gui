/* eslint-disable react/prop-types */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import { Text } from 'react-native'

import { scale } from '../../../../util/scaling.js'
import { getObjectDiff } from '../../../../util/utils.js'
import styles from './style'

export default class FormattedText extends React.Component {
  shouldComponentUpdate(nextProps) {
    const diffElement = getObjectDiff(this.props, nextProps, { style: true, children: true })
    return !!diffElement
  }

  constructor(props) {
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

  handleRef = element => {
    this.nativeForward = element
  }

  setNativeProps(props) {
    this.nativeForward.setNativeProps(props)
  }

  render() {
    const fontSize = this.props.fontSize ? scale(this.props.fontSize) : scale(14)
    return (
      <Text {...this.props} style={[this.style, { fontSize }, this.props.style]} ref={this.handleRef} allowFontScaling={false}>
        {this.props.children}
      </Text>
    )
  }
}
