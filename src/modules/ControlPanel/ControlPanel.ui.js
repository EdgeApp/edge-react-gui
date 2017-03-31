import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import Icon from 'react-native-vector-icons/MaterialIcons'

class ControlPanel extends Component {
  render () {
    return (
      <View style={styles.container}>
        <View style={styles.bitcoin.container}>
          <Text style={styles.bitcoin.value}>Bitcoin: 10000 USD</Text>
        </View>
        <View style={styles.user.container}>
          <Icon style={styles.user.icon} name='face' size={48} />
          <Text style={styles.user.name}>foofoo_user01</Text>
          <Icon style={styles.userIcon} name='arrow-drop-down' size={43} />
        </View>
        <View style={styles.main.container}>
          <Text>Link 1</Text>
        </View>
      </View>
    )
  }
}

const styles = {

  container: {
    flex: 1,
    alignItems: 'center',
    marginTop: 35,
    marginBottom: 70,
    borderStyle: 'solid',
    borderColor: '#e3e3e3',
    borderWidth: 1
  },

  bitcoin: StyleSheet.create({
    container:{
      backgroundColor: '#007AFF',
      paddingVertical: 13,
      paddingHorizontal: 18,
      flexDirection: 'row'
    },

    value: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 15
    }
  }),

  user: StyleSheet.create({
    container: {
      flexDirection: 'row',
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: '#f3f3f3',
      borderStyle: 'solid',
      borderColor: '#e3e3e3',
      borderWidth: 1
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
      flex: 1
    }
  }),

}

export default connect()(ControlPanel)

