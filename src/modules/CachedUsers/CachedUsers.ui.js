import React, { Component } from 'react'
import { connect } from 'react-redux'

import { View, Text, StyleSheet,TouchableWithoutFeedback } from 'react-native'
import { InputGroup, Input, Button, Card, CardItem, Content} from 'native-base';

import { selectUserToLogin } from './CachedUsers.action'
import { openLoginUsingPin } from '../Login/Login.action'

import Dimensions from 'Dimensions'
const { width, height } = Dimensions.get('window');


class UserList extends Component {

  handleLoginUserPin = (user) => {
     this.props.dispatch(selectUserToLogin(user)) 
  } 

  listUsers = () => {

    const checkIfLastElementStyle = index => {
      const lastIndex = this.props.users.length - 1 
      if(lastIndex !== index){
        return [style.row, style.border] 
      }

      if(lastIndex === index){
        return style.row 
      }
    }

    return this.props.users.map( ( user, index  )=> {

      return (
        <View key={index} style={ checkIfLastElementStyle(index) }>
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
    position: 'absolute',
    top: 65,
    zIndex: 100,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    borderRadius: 4
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
