import React, { Component } from 'react'
import { Text }  from 'react-native'
import { connect } from 'react-redux'

class Transactions extends Component {

  render () {
    return (
      <Text>
        Transactions Page
      </Text>
    )
  }

}

export default connect()(Transactions)
