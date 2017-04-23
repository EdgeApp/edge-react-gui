import React, { Component } from 'react'
import { Platform, View, StyleSheet, TouchableNativeFeedback, TouchableOpacity } from 'react-native'
import { connect } from 'react-redux'
// import Icon from 'react-native-vector-icons/MaterialIcons'
import { Text, Button, Icon } from 'native-base'
import Icon_FA from 'react-native-vector-icons/FontAwesome'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'

import { openSidebar, closeSidebar } from '../SideMenu/SideMenu.action'

import styles from './style'
const platform = Platform.OS;

class ControlPanel extends Component {

  _handleOnPressDirectory = () => {
    Actions.directory()
    return this.props.dispatch(closeSidebar())
  }

  _handleOnPressTransaction = () => {
    Actions.transactions()
    return this.props.dispatch(closeSidebar())
  }

  render () {

    const renderMain = () => {
      console.log(this.props.usersView)
      if(this.props.usersView) {
        return(
          <h1>Fuck Yeah</h1>
        )
      }

      if(!this.props.usersView) {
        if(platform === 'android') {
          return(
            <View style={styles.main.container}>
              <TouchableNativeFeedback onPress={this._handleOnPressDirectory} background={TouchableNativeFeedback.SelectableBackground()} >
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
                  <Text style={styles.main.text}>REFER YOUR FRIENDS (Earn Bitcoin)</Text>
                </View>
              </TouchableNativeFeedback>
            </View>
          )
        }
        if(platform !== 'android') {
          return(
            <View style={styles.main.container}>
              <TouchableOpacity onPress={this._handleOnPressDirectory} >
                <View style={styles.main.link}>
                  <Icon style={styles.main.icon} name='repeat' />
                  <Text style={styles.main.text}>BUY/SELL BITCOINS</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={this._handleOnPressTransaction} >
                <View style={styles.main.link}>
                  <Icon style={styles.main.icon} name='arrow-round-down' />
                  <Text style={styles.main.text}>SPEND BITCOINS (Plugins)</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={ e => console.log('pressed3') } >
                <View style={styles.main.link}>
                  <Icon style={styles.main.icon} name='arrow-round-up' />
                  <Text style={styles.main.text}>REFER YOUR FRIENDS (Earn Bitcoin)</Text>
                </View>
              </TouchableOpacity>
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
          <View style={styles.user.container}>
            <Icon style={styles.user.icon} name='person' />
            <Text style={styles.user.name}>foofoo_user01</Text>
            <Icon style={styles.user.icon} name='arrow-dropdown' />
          </View>
          { renderMain() }
          <View style={styles.others.container}>
            <View style={styles.others.link}>
              <Icon style={styles.others.icon} name='cash' />
              <Text style={styles.others.text}>WALLETS</Text>
            </View>
            <View style={styles.others.link}>
              <Icon style={styles.others.icon} name='log-out' />
              <Text style={styles.others.text}>LOGOUT</Text>
              <Icon style={styles.others.icon_settings} name='settings' />
            </View>
          </View>
        </View>
    )
  }
}

export default connect( state => ({

  sidemenu : state.sidemenu.view,
  usersView : state.controlPanel.usersView

}) )(ControlPanel)
