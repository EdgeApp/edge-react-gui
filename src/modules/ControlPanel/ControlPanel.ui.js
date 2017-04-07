import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
// import Icon from 'react-native-vector-icons/MaterialIcons'
import Icon_FA from 'react-native-vector-icons/FontAwesome'
import { Icon } from 'native-base'
import LinearGradient from 'react-native-linear-gradient'

import variables from '../../../native-base-theme/variables/platform'

class ControlPanel extends Component {
  render () {
    return (
      <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} style={styles.container} colors={["#3b7adb","#2b569a"]}>
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
            <View style={styles.main.link}>
              <Icon_FA style={styles.main.icon} name='refresh' size={30} />
              <Text style={styles.main.text}>BUY/SELL BITCOINS</Text>
            </View>
            <View style={styles.main.link}>
              <Icon_FA style={styles.main.icon} name='upload' size={30} />
              <Text style={styles.main.text}>SPEND BITCOINS (Plugins)</Text>
            </View>
            <View style={styles.main.link}>
              <Icon_FA style={styles.main.icon} name='download' size={30} />
              <Text style={styles.main.text}>REFER YOUR FRIENDS (Earn Bitcoin)</Text>
            </View>
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
      </LinearGradient>
    )
  }
}

const styles = {

  container: {
    flex: 1,
    alignItems: 'stretch'
    // backgroundColor: '#FFF'
  },

  bitcoin: StyleSheet.create({
    container:{
      // backgroundColor: variables.toolbarDefaultBg,
      height: variables.toolbarHeight,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20
    },

    value: {
      flex: 1,
      color: '#FFF',
      fontSize: 17
    }
  }),

  user: {
    container: {
      // backgroundColor: variables.tabBgColor,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12
    },

    icon: {
      fontSize: 35,
      color: "#FFF",
      marginHorizontal: 15
    },

    name:{
      flex: 1,
      color: "#FFF",
      fontSize: 15
    }

  },

  main: StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'flex-start',
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
      color: "#FFF",
      paddingHorizontal: 15
    },

    text: {
      flex: 1,
      color: "#FFF",
      fontSize: 14
    }

  }),

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
      color: "#FFF",
      paddingHorizontal: 15
    },

    icon_settings: {
      color: "#FFF",
      paddingHorizontal: 15
    },

    text: {
      flex: 1,
      color: "#FFF",
      fontSize: 14
    }

  },

}

export default connect()(ControlPanel)

