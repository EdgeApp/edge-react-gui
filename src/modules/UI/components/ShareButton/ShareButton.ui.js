import React from 'react'
import { View, StyleSheet, TouchableHighlight, Text } from 'react-native'
import { Icon } from 'native-base'

const styles = StyleSheet.flatten({
  shareButton: {
    flex:1,
    backgroundColor: 'transparent',
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    marginVertical: 10,
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

const ShareButton = ({displayName, iconName, onPress, style}) => {
  return (
    <TouchableHighlight onPress={onPress} style={[ styles.shareButton, style ]}>
       <View style={styles.view}>
         <Text style={styles.text}>{displayName}</Text>
       </View>
   </TouchableHighlight>
  )
}

export default ShareButton
