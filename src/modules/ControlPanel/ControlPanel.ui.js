import React, { Component } from 'react'
import { Platform, View, StyleSheet, ScrollView, TouchableNativeFeedback, TouchableOpacity } from 'react-native'
import { connect } from 'react-redux'
// import Icon from 'react-native-vector-icons/MaterialIcons'
import { Text, Button, Icon, List, ListItem  } from 'native-base'
import Icon_FA from 'react-native-vector-icons/FontAwesome'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import _ from 'lodash'

import { openSelectUser, closeSelectUser, getUsersList, selectUsersList, removeUsersList } from './action'
import { openSidebar, closeSidebar } from '../SideMenu/SideMenu.action'

import styles from './style'
const platform = Platform.OS;

class ControlPanel extends Component {

  componentWillMount = () => {
    return this.props.dispatch(
      getUsersList(
        [
          {id: 1, name: 'foofoo_user1'},
          {id: 2, name: 'foofoo_user2'},
          {id: 3, name: 'foofoo_user3'},
          {id: 4, name: 'foofoo_user4'},
          {id: 5, name: 'foofoo_user5'},
          {id: 6, name: 'foofoo_user6'},
          {id: 7, name: 'foofoo_user7'},
          {id: 8, name: 'foofoo_user8'},
          {id: 9, name: 'foofoo_user9'},
          {id: 10, name: 'foofoo_user10'},
          {id: 11, name: 'foofoo_user11'},
          {id: 12, name: 'foofoo_user12'},
          {id: 13, name: 'foofoo_user13'},
          {id: 14, name: 'foofoo_user14'},
          {id: 15, name: 'foofoo_user15'},
          {id: 16, name: 'foofoo_user16'},
          {id: 17, name: 'foofoo_user17'},
          {id: 18, name: 'foofoo_user18'},
          {id: 19, name: 'foofoo_user19'},
          {id: 20, name: 'foofoo_user20'},
        ]
      )
    )
  }

  _handlePressUserList = () => {
    if(!this.props.usersView){
      return this.props.dispatch(openSelectUser())
    }
    if(this.props.usersView){
      return this.props.dispatch(closeSelectUser())
    }
  }

  _handlePressUserSelect = (id) => {
    this.props.dispatch(selectUsersList(id))
    return this.props.dispatch(closeSelectUser(id))
  }

  _handlePressUserRemove = (id) => {
    return this.props.dispatch(removeUsersList(id))
  }

  _handleOnPressDirectory = () => {
    Actions.directory()
    return this.props.dispatch(closeSidebar())
  }

  _handleOnPressTransaction = () => {
    Actions.transactions()
    return this.props.dispatch(closeSidebar())
  }

  render () {

    const {
      sidemenu,
      usersView,
      usersList,
      selectedUser
    } = this.props

    const renderMain = () => {

      if(usersView) {
        const rows = () => {
          return _.map(usersList, (user, index) => {
            return (
              <View key={index} style={styles.userList.row}>
                <Text style={styles.userList.text} onPress={ e => this._handlePressUserSelect(user.id) }>{user.name}</Text>
                <Icon name='close' onPress={ e => this._handlePressUserRemove(user.id) }/>
              </View>
            )
          })
        }
        return(
          <ScrollView>
            {rows()}
          </ScrollView>
        )
      }

      if(!usersView) {
        if(platform === 'android') {
          return(

            <View style={{flex:1}}>
              <View style={styles.main.container}>
                <TouchableNativeFeedback style={styles.main.link} onPress={this._handleOnPressDirectory} background={TouchableNativeFeedback.SelectableBackground()} >
                  <View style={styles.main.link}>
                    <Icon style={styles.main.icon} name='repeat' />
                    <Text style={styles.main.text}>BUY/SELL BITCOINS</Text>
                  </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback onPress={this._handleOnPressTransaction} background={TouchableNativeFeedback.SelectableBackground()} >
                  <View style={styles.main.link}>
                    <Icon style={styles.main.icon} name='arrow-round-down' />
                    <Text style={styles.main.text}>SPEND BITCOINS (Plugins)</Text>
                  </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback onPress={ e => console.log('pressed3') } background={TouchableNativeFeedback.SelectableBackground()} >
                  <View style={styles.main.link}>
                    <Icon style={styles.main.icon} name='arrow-round-up' />
                    <Text style={styles.main.text}>REFER YOUR FRIENDS {"\n"} (Earn Bitcoin)</Text>
                  </View>
                </TouchableNativeFeedback>
              </View>
              <View style={styles.others.container}>
                <TouchableNativeFeedback onPress={ e => console.log('pressed4') }>
                  <View style={styles.others.link}>
                    <Icon style={styles.others.icon} name='cash' />
                    <Text style={styles.others.text}>WALLETS</Text>
                  </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback onPress={ e => console.log('pressed5') }>
                  <View style={styles.others.link}>
                    <Icon style={styles.others.icon} name='log-out' />
                    <Text style={styles.others.text}>LOGOUT</Text>
                  </View>
                </TouchableNativeFeedback>
                <TouchableNativeFeedback onPress={ e => console.log('pressed6') }>
                  <View style={styles.others.link}>
                    <Icon style={styles.others.icon_settings} name='settings' />
                    <Text style={styles.others.text}>SETTINGS</Text>
                  </View>
                </TouchableNativeFeedback>
              </View>
            </View>
          )
        }
        if(platform !== 'android') {
          return(
            <View style={{flex:1}}>
              <View style={styles.main.container}>
                <TouchableOpacity style={styles.main.link} onPress={this._handleOnPressDirectory} >
                    <Icon style={styles.main.icon} name='repeat' />
                    <Text style={styles.main.text}>BUY/SELL BITCOINS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.main.link} onPress={this._handleOnPressTransaction} >
                    <Icon style={styles.main.icon} name='arrow-round-down' />
                    <Text style={styles.main.text}>SPEND BITCOINS (Plugins)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.main.link} onPress={ e => console.log('pressed3') } >
                    <Icon style={styles.main.icon} name='arrow-round-up' />
                    <Text style={styles.main.text}>REFER YOUR FRIENDS {"\n"} (Earn Bitcoin)</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.others.container}>
                <TouchableOpacity style={styles.others.link} onPress={ e => console.log('pressed4') }>
                  <Icon style={styles.others.icon} name='cash' />
                  <Text style={styles.others.text}>WALLETS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.others.link} onPress={ e => console.log('pressed5') }>
                  <Icon style={styles.others.icon} name='log-out' />
                  <Text style={styles.others.text}>LOGOUT</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.others.link} onPress={ e => console.log('pressed6') }>
                  <Icon style={styles.others.icon_settings} name='settings' />
                  <Text style={styles.others.text}>SETTINGS</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        }

      }


    }

    return  (
        <View style={styles.container}>
          <View style={styles.bitcoin.container}>
            <Icon name='logo-bitcoin' style={{ color: '#F8F8F8' }}/>
            <Text style={styles.bitcoin.value}>  = 10000 USD</Text>
          </View>
          <TouchableOpacity style={styles.user.container} onPress={this._handlePressUserList}>
            <Icon style={styles.user.icon} name='person' />
            <Text style={styles.user.name}>{ selectedUser ? selectedUser.name : 'Account' }</Text>
            <Icon style={styles.user.icon} name='arrow-dropdown' />
          </TouchableOpacity>
          {renderMain()}
        </View>
    )
  }
}

export default connect( state => ({

  sidemenu : state.sidemenu.view,
  usersView : state.controlPanel.usersView,
  usersList : state.controlPanel.selectedUser !== null ?
    _.filter(state.controlPanel.usersList, item => item.id !== state.controlPanel.selectedUser) :
    state.controlPanel.usersList,

  selectedUser : state.controlPanel.selectedUser !== null ?
    _.find(state.controlPanel.usersList, item => item.id === state.controlPanel.selectedUser) :
    null

}) )(ControlPanel)
