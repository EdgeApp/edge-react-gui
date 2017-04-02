import React, { Component } from 'react'
import { View, Text } from 'react-native'
import { connect } from 'react-redux'
import ExchangeRate from './ExchangeRate.ui.js'

class ExchangeRateWrapper extends Component {
  constructor () {
    super()
    this.state = {
      crypto: 0.788,
      fiate: 1000
    }
  }

  componentDidMount () {
    this.setState({
      crypto: 1000,
      fiat: 0.788
    })
  }

  render () {
    // return <ExchangeRate crypto={this.state.crypto} fiat={this.state.fiat} />
    return (
      <View>
        <ExchangeRate crypto={1000} fiat={0.788} />
      </View>
    )
  }
}

export default connect()(ExchangeRateWrapper)
