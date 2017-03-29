import React, { Component } from 'react'
import { View, Text } from 'react-native'
import { connect } from 'react-redux'

class ControlPanel extends Component {
  render () {
    return (
      <View style={styles.container}>
        <Text>Oh Yeah</Text>
      </View>
    )
  }
}

const styles = {
  container: {
    backgroundColor: '#e5e5e5',
    flex: 1,
    alignItems: 'center',
    marginBottom: 100
  },
}

export default connect()(ControlPanel)

