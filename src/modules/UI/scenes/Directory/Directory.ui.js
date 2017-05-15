import React, { Component } from 'react'
import { Text }  from 'react-native'
import { Content }  from 'native-base'
import { connect } from 'react-redux'

class Directory extends Component {

  render () {
    return (
      <Content>
        <Text style={{ color: 'black', fontSize: 50 }}>
          Directory Page
        </Text>
      </Content>
    )
  }

}

export default connect()(Directory)
