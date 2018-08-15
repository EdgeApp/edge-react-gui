// @flow
import React, { Component } from 'react'
import { View } from 'react-native'

import { PagingWithDotStyles as rawStyles } from '../../../../styles/indexStyles.js'

type Props = {
  styles?: Object,
  totalItems: number,
  currentIndex: number
}
type State = {}
class PagingDotsComponent extends Component<Props, State> {
  renderDots = (styles: Object) => {
    let i = 0
    const dots = []
    for (i; i < this.props.totalItems; i++) {
      const style = i === this.props.currentIndex ? styles.circleSected : styles.circle
      dots.push(<View style={style} key={'dots' + i} />)
    }
    return dots
  }
  render () {
    const styles = this.props.styles ? this.props.styles : rawStyles
    return <View style={styles.container}>{this.renderDots(styles)}</View>
  }
}
export { PagingDotsComponent }
