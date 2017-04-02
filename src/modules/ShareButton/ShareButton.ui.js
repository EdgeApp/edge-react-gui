import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'

class ShareButton extends Component {

  render () {
    return (
      <View>
        <Text style={styles.container}>This is the ShareButton </Text>
      </View>
    )
  }
}

export default connect()(ShareButton)
