import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Image, ScrollView, ListView, Text, View, StyleSheet, TouchableHighlight, Animated }  from 'react-native'
import { Container, Header, InputGroup, Input, Icon, Button } from 'native-base';
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import styles from './WalletList.style'

class WalletListRow extends Component {

  render() {
    return(
      <TouchableHighlight style={styles.container}
        underlayColor={'#eee'}
        delayLongPress={500}
        style={{padding: 25, backgroundColor: "#F8F8F8", borderBottomWidth:1, borderColor: '#eee'}}
        {...this.props.sortHandlers}
      >
        <Text style={{color: 'black', height: 30}}>{this.props.data.text}</Text>
      </TouchableHighlight>
    )
  }


  border(color) {
    return {
      borderColor: color,
      borderWidth: 2
    }
  }
}

WalletListRow.propTypes = {

}

export default connect( state => ({



}) )(WalletListRow)
