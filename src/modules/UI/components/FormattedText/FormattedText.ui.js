// @flow

import * as React from 'react'
import { StyleSheet, Text } from 'react-native'

import { scale } from '../../../../util/scaling.js'
import { getObjectDiff } from '../../../../util/utils.js'
import { styles } from './style'

type Props = {
  children: React.Node,
  fontSize?: number,
  isBold?: boolean,
  style?: StyleSheet.Styles
}

export class FormattedText extends React.Component<Props> {
  style: StyleSheet.Styles | typeof undefined
  nativeForward: any

  shouldComponentUpdate(nextProps: Props) {
    const diffElement = getObjectDiff(this.props, nextProps, { style: true, children: true })
    return !!diffElement
  }

  constructor(props: Props) {
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

  handleRef = (element: any) => {
    this.nativeForward = element
  }

  setNativeProps(props: Props) {
    this.nativeForward.setNativeProps(props)
  }

  render() {
    const fontSize = this.props.fontSize ? scale(this.props.fontSize) : scale(14)
    return (
      <Text {...this.props} style={[this.style, { fontSize }, this.props.style]} ref={this.handleRef}>
        {this.props.children}
      </Text>
    )
  }
}
