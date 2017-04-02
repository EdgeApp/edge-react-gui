import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import ShareButton from '../ShareButton/index.js'

class ShareButtons extends Component {

  render () {
    return (
      <View>
        <Text style={styles.container}>This is the ShareButtons </Text>
        <ShareButton />
        <ShareButton />
        <ShareButton />
        <ShareButton />
        <ShareButton />
      </View>
    )
  }
}

export default connect()(ShareButtons)
