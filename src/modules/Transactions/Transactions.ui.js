import React, { Component } from 'react'
import { View, Text }  from 'react-native'
import { Content }  from 'native-base'
import { connect } from 'react-redux'

class Transactions extends Component {

  render () {
    return (
      <Content>
        <Text style={{ color: 'black', fontSize: 50 }}>
          Transactions Page
        </Text>
      </Content>
    )
  }

}

export default connect()(Transactions)
