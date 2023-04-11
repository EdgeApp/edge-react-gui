import * as React from 'react'
import { Text, TextStyle } from 'react-native'

import { scale } from '../../../util/scaling'
import { styles } from './style'

interface Props {
  children: React.ReactNode
  fontSize?: number
  isBold?: boolean
  style?: TextStyle
}

export class FormattedText extends React.Component<Props> {
  style: TextStyle | undefined
  nativeForward: any

  constructor(props: Props) {
    super(props)
    // @ts-expect-error
    this.style = this.props.isBold ? [styles.boldStyle] : [styles.defaultStyle]

    if (props.style) {
      if (Array.isArray(props.style)) {
        // @ts-expect-error
        this.style = this.style.concat(props.style)
      } else {
        // @ts-expect-error
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
