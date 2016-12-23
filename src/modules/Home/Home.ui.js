import React, { Component } from 'react'
import { Actions } from 'react-native-router-flux'
import { View, Text, Button } from 'react-native'
import style from '../Style'
export default class Home extends Component {

  render () {
    return (
      <View style={style.container} >
        <View style={style.form}>
          <Text style={{fontSize: 40}}>Home Page</Text>
          <Button style={{flex:1}} onPress={Actions.landing} title="Log Out">Log Out</Button>
        </View>
      </View>
    )
  }

}

