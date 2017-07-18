import React, { Component } from 'react'
import { View, StyleSheet, Share } from 'react-native'
import { connect } from 'react-redux'
import ShareButton from '../ShareButton/index.js'
import { Container, Content, Button, Text, Icon, Segment } from 'native-base'
import { dev } from '../../../utils.js'

const ShareButtons = ({
  copyToClipboard,
  shareViaEmail,
  shareViaSMS,
  shareViaShare
}) => {
  return (
    <View
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
  )
}

const styles = StyleSheet.create({
  view: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#294F85'
  },
  border: {
    borderRightWidth: 0.4,
    borderRightColor: "#FFF"
  }
})

export default connect()(ShareButtons)
