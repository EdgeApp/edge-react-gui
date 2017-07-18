import React from 'react'
import { View, StyleSheet, TouchableHighlight, Text } from 'react-native'
import { Icon } from 'native-base'

const ShareButton = ({displayName, iconName, onPress, style}) => {
  return (
    <TouchableHighlight onPress={onPress} style={[ styles.shareButton, style ]}>
      <View style={styles.view}>
        <Text style={styles.text}>{displayName}</Text>
      </View>
    </TouchableHighlight>
  )
}

const styles = StyleSheet.flatten({
  shareButton: {
    flex:1,
    backgroundColor: 'transparent',
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    marginVertical: 14,
  },
  view: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
  },
  text: {
    fontSize: 16,
    color: 'rgba(255,255,255,.7)'
  }
})

export default ShareButton
