//@flow
import React, {Component} from 'react'
import {View, Text} from 'react-native'
import PropTypes from 'prop-types'
// import * as Constants from '../../../../constants/indexConstants'
type Props = {
  exchangeRate: string,
  style: any
}
export default class CryptoExchageRate extends Component<Props> {
  static propTypes = {
    style: PropTypes.object.isRequired,
    exchangeRate: PropTypes.string
  }
  render () {
    const style = this.props.style
    return (
      <View style={style.container}>
          <Text style={style.text}>{'Exchange rate' + this.props.exchangeRate}</Text>
      </View>
    )
  }
}
