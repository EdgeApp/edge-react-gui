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
    console.log('this is: ', this)
    let btcSeed = this.props.data.BitcoinSeed.slice(0,5) + '...'
    return(
      <TouchableHighlight style={styles.rowContainer}
        underlayColor={'#eee'}
        delayLongPress={500}
        {...this.props.sortHandlers}
      >
        <Text style={styles.rowNameText}>{btcSeed}</Text>
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
