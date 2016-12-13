import React, { Component } from 'react'
import { Actions } from 'react-native-router-flux'

import { View, Text, StyleSheet } from 'react-native'
import { Button } from 'native-base'

export default class Home extends Component {

  render () {
    return (
      <View style={style.container} >
        <Text>Welcome!! This is the Home Page!</Text>
        <Button onPress={Actions.landing}>Log Out</Button>
      </View>
    )
  }

}

const style = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }

})

