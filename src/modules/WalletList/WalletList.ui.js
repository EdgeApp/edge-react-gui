import React, { Component } from 'react'
import { Image, ScrollView, ListView, Text, View, StyleSheet, TouchableHighlight, Animated }  from 'react-native'
import { Container, Header, InputGroup, Input, Icon, Button } from 'native-base';
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import styles from './WalletList.style'

class WalletList extends Component {

  render() {
    return(
      <View>
        <Text>This is the wallet list!</Text>
      </View>
    )
  }

  border(color) {
    return {
      borderColor: color,
      borderWidth: 1
    }
  }
}

export default connect( state => ({

  walletList: state.walletList.walletList

}) )(WalletList)
