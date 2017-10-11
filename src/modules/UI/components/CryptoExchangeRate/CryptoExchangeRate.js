import React, {Component} from 'react'
import {View, Text} from 'react-native'
import PropTypes from 'prop-types'
// import * as Constants from '../../../../constants/indexConstants'

export default class CryptoExchageRate extends Component {
  render () {
    const style = this.props.style
    return (
      <View style={style.container}>
          <Text style={style.text}>{'Exchange rate' + this.props.exchangeRate}</Text>
      </View>
    )
  }
}

CryptoExchageRate.propTypes = {
  exchangeRate: PropTypes.string
}
