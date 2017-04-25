import React, { Component } from 'react'
import { Platform, View, TouchableNativeFeedback, TouchableOpacity } from 'react-native'
import { connect } from 'react-redux'
import { Text, Icon } from 'native-base'
import { Actions } from 'react-native-router-flux'

import { closeSidebar } from '../../SideMenu/SideMenu.action'
import UserList from './UserList'

import styles from '../style'
const platform = Platform.OS;

class MainComponent extends Component {


  _handleOnPressDirectory = () => {
    Actions.directory()
    return this.props.dispatch(closeSidebar())
  }

  _handleOnPressTransaction = () => {
    Actions.transactions()
    return this.props.dispatch(closeSidebar())
  }

  render () {

    if(this.props.usersView) {
      return <UserList />
    }

    if(!this.props.usersView) {
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
}

export default connect( state => ({

  usersView : state.controlPanel.usersView

}) )(MainComponent)
