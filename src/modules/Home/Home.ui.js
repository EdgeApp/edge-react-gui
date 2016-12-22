import React, { Component } from 'react'
import { Actions } from 'react-native-router-flux'
import { View, Text, Button } from 'react-native'
import style from '../Style'
export default class Home extends Component {

  render () {
    return (
      <View style={style.container} >
        <View style={style.form}>
          <Text>Welcome!! This is the Home Page!</Text>
          <Button onPress={Actions.landing}>Log Out</Button>
        </View>
      </View>
    )
  }

}

