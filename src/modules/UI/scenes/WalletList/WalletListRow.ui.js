import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Image, ScrollView, ListView, Text, View, StyleSheet, TouchableHighlight, Animated, Picker }  from 'react-native'
import { Container, Header, InputGroup, Input, Icon, Button } from 'native-base';
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import styles from './style'
import Menu, { MenuContext, MenuOptions, MenuOption, MenuTrigger } from 'react-native-menu'
import {executeWalletRowOption} from './action'
import RowOptions from './WalletListRowOptions.ui'

class WalletListRow extends Component {

  render() {
    let id = this.props.data.id
    let name = this.props.data.name || 'No name'

    return(
      <TouchableHighlight style={[styles.rowContainer]}
        underlayColor={'#eee'}
        delayLongPress={500}
        {...this.props.sortHandlers}
      >
        <View style={[styles.rowContent]}>
          <View style={[styles.rowNameTextWrap]}>
            <Text style={[styles.rowNameText]}>{name}</Text>
          </View>
          <RowOptions walletKey={id} archiveLabel={this.props.archiveLabel} />
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
