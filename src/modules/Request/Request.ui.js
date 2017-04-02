import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import ExchangeRateWrapper from '../ExchangeRate/index.js'
import FlipInput from '../FlipInput/index.js'
import QRCodeWrapper from '../QRCodeWrapper/index.js'
import RequestStatus from '../RequestStatus/index.js'
import ShareButtons from '../ShareButtons/index.js'

class Request extends Component {
  constructor (props) {
    super(props)
    this.state = {
      value: 0
    }
  }

  updateInputField = (value) => {
    this.setState({
      value: value
    })
  }

  render () {
    return (
      <View>
        <ExchangeRateWrapper />
        <FlipInput updateInputField={this.updateInputField} />
        <QRCodeWrapper value={this.state.value} />
        <ShareButtons />
      </View>
    )
  }
}

export default connect()(Request)
