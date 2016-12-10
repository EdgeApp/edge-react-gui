import React, { Component } from 'react'
import { connect } from 'react-redux'

import { View, Text, StyleSheet,TouchableWithoutFeedback } from 'react-native'
import { InputGroup, Input, Button, Card, CardItem, Content} from 'native-base';

import Dimensions from 'Dimensions'
const { width, height } = Dimensions.get('window');


class UserList extends Component {

  handleLoginUserPin = (user) => {
     this.props.dispatch(selectUserToLogin(user.id)) 
  } 

  listUsers = () => {
    return this.props.users.map( user => {

      return (
        <View style={[ style.row, style.border ]}>
          <TouchableWithoutFeedback onPress={ () => this.handleLoginUserPin(user) }>
            <Text style={ style.text }>{ user.name }</Text>
          </TouchableWithoutFeedback>
        </View>
      ) 

    })
  }

  render() {
    return (
      <View style={style.container}>
        { this.listUsers() }
      </View>
    )
  }
}

const style = StyleSheet.create({

  container: {
    backgroundColor: '#FFF',
    justifyContent: 'center',
    borderRadius: 3
  },

  row: {
    flexDirection: 'row',
    width: width,
    padding: 9
  },

  text: {
    flex:1,
    color: "#222",
    fontSize: 16
  },

  border: {
    borderBottomColor: '#AAA' ,
    borderBottomWidth: 1,
    borderStyle: 'solid' 
  }

});

export default connect( state =>  ({

  users  :  state.cachedUsers.users,
  view  :  state.cachedUsers.view

}) )(UserList)
