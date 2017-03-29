import React, { Component } from 'react'
import { Text }  from 'react-native'
import { connect } from 'react-redux'

class Directory extends Component {

  render () {
    return (
      <Text>
        Directory Page
      </Text>
    )
  }

}

export default connect()(Directory)
