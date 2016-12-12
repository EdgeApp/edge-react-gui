import React, { Component } from 'react'
import { connect } from 'react-redux'

import { View, ScrollView, Text, StyleSheet, TouchableHighlight, TouchableOpacity } from 'react-native'
import { InputGroup, Input, Button, Card, CardItem, Content} from 'native-base'

import { selectUserToLogin } from './CachedUsers.action'
// import { deleteUserToCached } from './CachedUsers.middleware'
import { openLoginUsingPin } from '../Login/Login.action'

import Dimensions from 'Dimensions'
const { width, height } = Dimensions.get('window')

class UserList extends Component {

  handleLoginUserPin = (user) => {
    this.props.dispatch(selectUserToLogin(user))
  }

  handleDeleteUserCache = (user) => {
    console.log('foo')
    // this.props.dispatch(deleteUserToCached(user))
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
            <TouchableOpacity style={style.textContainer} onPress={() => this.handleLoginUserPin(user)}>
              <Text style={style.text}>{ user }</Text>
            </TouchableOpacity>
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
    position: 'absolute',
    top: 40,
    maxHeight: 150,
    alignSelf: 'flex-end',
    backgroundColor: '#FFF',
    borderRadius: 4
  },

  row: {
    flexDirection: 'column',
    width: width,
    padding: 16,
    height: 40,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    height: 40
  },
  text: {
    flex: 1,
    color: '#222',
    fontSize: 18
  },

  xbuttontext: {
    fontSize: 18
  },  
  xbutton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    padding: 10
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
