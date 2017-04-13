import React from 'react'
import { View, StyleSheet, TouchableHighlight, Text } from 'react-native'
import { Icon } from 'native-base'

const styles = StyleSheet.flatten({
  shareButton: {
    flex: 1,
    backgroundColor: 'blue',
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
  },
  view: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
  },
  icon: {
    margin: 5,
  },
  text: {
    margin: 5,
  }
})

const ShareButton = ({displayName, iconName, onPress}) => {
  return (
    <TouchableHighlight onPress={onPress} style={styles.shareButton}>
       <View style={styles.view}>
         <Icon name={iconName} style={styles.icon}/>
         <Text style={styles.text}>{displayName}</Text>
       </View>
   </TouchableHighlight>
  )
}

export default ShareButton
