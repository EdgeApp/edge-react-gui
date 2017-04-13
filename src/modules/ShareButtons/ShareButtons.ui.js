import React, { Component } from 'react'
import { View, StyleSheet, Share } from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import ShareButton from '../ShareButton/index.js'
import { Container, Content, Button, Text, Icon, Segment } from 'native-base'
import { dev } from '../utils.js'

const ShareButtons = (
  {copyToClipboard, shareViaEmail, shareViaSMS, shareViaShare}) => {

  const styles = StyleSheet.create({
    view: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      borderColor: 'red',
      borderWidth: 1
    },
    shareButton: {
    }
  })

  return (
    <View
      style={styles.view}>
      <ShareButton
        style={styles.shareButton}
        iconName='md-copy'
        displayName='Copy'
        onPress={copyToClipboard} />
      <ShareButton
        style={styles.shareButton}
        iconName='md-mail'
        displayName='Email'
        onPress={shareViaEmail} />
      <ShareButton
        style={styles.shareButton}
        iconName='md-chatbubbles'
        displayName='SMS'
        onPress={shareViaSMS} />
      <ShareButton
        style={styles.shareButton}
        iconName='share'
        displayName='Share'
        onPress={shareViaShare} />
    </View>
  )
}

export default connect()(ShareButtons)
