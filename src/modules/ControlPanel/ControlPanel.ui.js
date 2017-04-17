import React, { Component } from 'react'
import { View, StyleSheet, TouchableNativeFeedback } from 'react-native'
import { connect } from 'react-redux'
// import Icon from 'react-native-vector-icons/MaterialIcons'
import { Text, Button, Icon } from 'native-base'
import Icon_FA from 'react-native-vector-icons/FontAwesome'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'

import { openSidebar, closeSidebar } from '../SideMenu/SideMenu.action'

import variables from '../../../native-base-theme/variables/platform'

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
          <View style={styles.main.container}>
            {/* <TouchableNativeFeedback onPress={this._handleOnPressDirectory} background={TouchableNativeFeedback.SelectableBackground()} >
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
            </TouchableNativeFeedback> */}
          </View>

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

const styles = {

  container: {
    flex: 1,
    alignItems: 'stretch',
    backgroundColor: '#FFF'
  },

  bitcoin: {
    container:{
      backgroundColor: '#3b7adb',
      height: variables.toolbarHeight,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20
    },

    value: {
      flex: 1,
      fontSize: 17,
      color: '#FFF',
    }
  },

  user: {
    container: {
      backgroundColor: variables.tabBgColor,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12
    },

    icon: {
      fontSize: 35,
      marginHorizontal: 15
    },

    name:{
      flex: 1,
      fontSize: 15
    }

  },

  main:{
    container: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'flex-start',
    },

    link: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      // backgroundColor: 'yellow',
      // borderStyle: 'solid',
      // borderColor: '#e3e3e3',
      // borderWidth: 1
    },


    icon: {
      fontSize: 35,
      paddingHorizontal: 15
    },

    text: {
      flex: 1,
      fontSize: 14
    }

  },

  others: {
    container: {
      flexDirection: 'column',
      alignItems: 'flex-start'
    },

    link: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      // borderStyle: 'solid',
      // borderColor: '#e3e3e3',
      // borderWidth: 1
    },

    icon: {
      fontSize: 35,
      paddingHorizontal: 15
    },

    icon_settings: {
      paddingHorizontal: 15
    },

    text: {
      flex: 1,
      fontSize: 14
    }

  },

}

export default connect( state => ({

  sidemenu : state.sidemenu.view

}) )(ControlPanel)
