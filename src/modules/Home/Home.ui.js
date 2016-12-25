import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import { View, Text, Button } from 'react-native'
import style from '../Style'

class Home extends Component {

  render () {
    return (
      <View style={style.container} >
        <View style={style.form}>
          <Text style={{fontSize: 40}}>Home Page</Text>
          <Button style={{flex: 1}} onPress={Actions.landing} title='Log Out'>Log Out</Button>
        </View>
      </View>
    )
  }

}

export default connect( state => ({
  user : state.user
}) )(Home)
