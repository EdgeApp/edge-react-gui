import React, {Component} from 'react'
import {View, StyleSheet} from 'react-native'
import ShareButton from '../ShareButton/index.js'

const styles = StyleSheet.create({
  view: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#294F85'
  },
  border: {
    borderRightWidth: 0.4,
    borderRightColor: '#FFF'
  }
})

export default class ShareButtons extends Component {
  render () {
    const {copyToClipboard,
    shareViaEmail,
    shareViaSMS,
    shareViaShare} = this.props

    return <View
      style={styles.view}>
      <ShareButton
        style={styles.border}
        displayName='Copy'
        onPress={copyToClipboard} />
      <ShareButton
        style={styles.border}
        displayName='Email'
        onPress={shareViaEmail} />
      <ShareButton
        style={styles.border}
        displayName='SMS'
        onPress={shareViaSMS} />
      <ShareButton
        displayName='Share'
        onPress={shareViaShare} />
    </View>
  }
}
