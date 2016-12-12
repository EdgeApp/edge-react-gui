import React, { Component } from 'react'
import { connect } from 'react-redux'

import { View, ScrollView, Text, StyleSheet, TouchableHighlight, TouchableWithoutFeedback } from 'react-native'
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
          <Text style={style.text} onPress={() => this.handleLoginUserPin(user)}>{ user }</Text>
          <TouchableHighlight onPress={() => this.handleDeleteUserCache(user)} color='#222222' style={style.xbutton}><Text style={style.xbuttontext}>X</Text></TouchableHighlight>
        </View>
      </View>
      )
    })
  }

  render () {
      return (
        <ScrollView style={[ style.container ]}>
          { this.listUsers() }
        </ScrollView>
      )
  }
}

const style = StyleSheet.create({

  container: {
    position:'absolute',
    top: 60,
    height: 160,
    backgroundColor: '#FFF',
    borderRadius: 4,
    zIndex: 1
  },

  row: {
    flexDirection: 'column',
    width: width * 0.7,
    padding: 16,
    height: 40,
  },

  text: {
    flex: 1,
    color: '#222',
    fontSize: 18
  },

  xbuttontext: {
    fontSize: 18
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
