import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Image, ScrollView, ListView, Text, View, StyleSheet, TouchableHighlight, Animated }  from 'react-native'
import { Container, Header, InputGroup, Input, Icon, Button } from 'native-base';
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import styles from './WalletList.style'
import DropdownPicker from '../AddWallet/AddWallet.ui'

class WalletListRow extends Component {
  
  _handleToggleOptions() {
    
  }

  render() {
    console.log('this is: ', this)
    let btcSeed = this.props.data.id
    return(
      <TouchableHighlight style={[styles.rowContainer]}
        underlayColor={'#eee'}
        delayLongPress={500}
        {...this.props.sortHandlers}
      >
        <View style={[styles.rowContent]}>
          <View style={[styles.rowNameTextWrap]}>
            <Text style={[styles.rowNameText]}>{btcSeed}</Text>
          </View>
          <Button style={styles.rowDotsWrap}
            onPress={ this._handleToggleOptions() }
            transparent
          >
            <Icon name='md-more' style={{fontSize: 20, color: '#777777'}} />
          </Button>
        </View>
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
