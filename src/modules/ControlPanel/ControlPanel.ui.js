import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
// import Icon from 'react-native-vector-icons/MaterialIcons'
import Icon_FA from 'react-native-vector-icons/FontAwesome'
import { Icon } from 'native-base'

import variables from '../../../native-base-theme/variables/platform'

class ControlPanel extends Component {
  render () {
    return (
      <View style={styles.container}>
        <View style={styles.bitcoin.container}>
          <Text style={styles.bitcoin.value}>Bitcoin: 10000 USD</Text>
        </View>
        <View style={styles.user.container}>
          <Icon style={styles.user.icon} name='person' size={48} />
          <Text style={styles.user.name}>foofoo_user01</Text>
          <Icon style={styles.user.icon} name='arrow-dropdown' size={43} />
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
            <Icon style={styles.others.icon} name='account-balance-wallet' size={30} />
            <Text style={styles.others.text}>WALLETS</Text>
          </View>
          <View style={styles.others.link}>
            <Icon_FA style={styles.others.icon} name='arrow-left' size={30} />
            <Text style={styles.others.text}>LOGOUT</Text>
            <Icon_FA style={styles.others.icon_settings} name='gears' size={30} />
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

  bitcoin: StyleSheet.create({
    container:{
      backgroundColor: variables.toolbarDefaultBg,
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

  user: StyleSheet.create({
    container: {
      backgroundColor: variables.tabBgColor,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12
    },

    icon: {
      marginHorizontal: 10
    },

    name:{
      flex: 1,
      fontSize: 15
    }

  }),

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
      borderStyle: 'solid',
      borderColor: '#e3e3e3',
      borderWidth: 1
    },


    icon: {
      paddingHorizontal: 15
    },

    text: {
      flex: 1,
      fontSize: 14
    }

  }),

  others: StyleSheet.create({
    container: {
      flexDirection: 'column',
      alignItems: 'flex-start'
    },

    link: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderStyle: 'solid',
      borderColor: '#e3e3e3',
      borderWidth: 1
    },

    icon: {
      paddingHorizontal: 15
    },

    icon_settings: {
      paddingHorizontal: 15
    },

    text: {
      flex: 1,
      fontSize: 14
    }

  }),

}

export default connect()(ControlPanel)

