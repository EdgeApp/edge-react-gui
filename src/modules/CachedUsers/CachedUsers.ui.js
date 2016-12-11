import React, { Component } from 'react'
import { connect } from 'react-redux'

import { View, Text, StyleSheet, TouchableHighlight, TouchableWithoutFeedback } from 'react-native'
import { InputGroup, Input, Button, Card, CardItem, Content} from 'native-base'

import { selectUserToLogin } from './CachedUsers.action'
import { openLoginUsingPin } from '../Login/Login.action'

import Dimensions from 'Dimensions'
const { width, height } = Dimensions.get('window')

class UserList extends Component {

  handleLoginUserPin = (user) => {
    this.props.dispatch(selectUserToLogin(user))
  }
  handleDeleteUserCache = (user) => {
    this.props.dispatch(selectUserToLogin(user))
  }

  listUsers = () => {
    const checkIfLastElementStyle = index => {
      const lastIndex = this.props.users.length - 1
      if (lastIndex !== index) {
        return [style.row, style.border]
      }

      if (lastIndex === index) {
        return style.row
      }
    }

    return this.props.users.map((user, index) => {
      return (
      <View key={index} style={checkIfLastElementStyle(index)}>
        <View style={style.cachedItem}>
          <Text style={style.text} onPress={() => this.handleLoginUserPin(user)}>{ user.name }</Text>
          <TouchableHighlight onPress={() => this.handleDeleteUserCache(user)} color='#222222' style={style.xbutton}><Text style={style.xbuttontext}>X</Text></TouchableHighlight>
        </View>
      </View>
      )
    })
  }

  render () {
      return (
        <View style={[ style.container ]}>
          { this.listUsers() }
        </View>
      )
  }
}

const style = StyleSheet.create({

  container: {
    position:'absolute',
    top: 60,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    borderRadius: 4
  },

  row: {
    flexDirection: 'column',
    width: width * 0.8,
    padding: 9
  },

  text: {
    flex: 1,
    color: '#222',
    fontSize: 16
  },

  xbuttontext: {
    fontSize: 16
  },  

  border: {
    borderBottomColor: '#AAA',
    borderBottomWidth: 1,
    borderStyle: 'solid'
  },

  cachedItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  }
})

export default connect(state => ({

  users: state.cachedUsers.users

}))(UserList)
