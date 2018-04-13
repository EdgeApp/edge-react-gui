/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { ListView, Text, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import FAIcon from 'react-native-vector-icons/FontAwesome'

import * as Constants from '../../../../constants/indexConstants'
import styles from './style'

export default class WalletTransferList extends Component {
  _closeWalletListModal () {
    this.props.toggleWalletListModal()
  }

  _selectWalletToSendConfirmation () {
    this.props.toggleWalletListModal()
    Actions.sendConfirmation()
  }

  render () {
    const ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    })
    const walletRowSource = ds.cloneWithRows(this.props.walletTransferList)
    return (
      <View style={styles.container}>
        <View style={[styles.headerRowWrap]}>
          <View style={[styles.headerTextWrap]}>
            <Text style={styles.headerText}>Select destination wallet:</Text>
          </View>
          <TouchableHighlight style={[styles.exitIconWrap]} onPress={this._closeWalletListModal.bind(this)}>
            <FAIcon name={Constants.CLOSE_ICON} size={24} style={[styles.exitIcon]} color="#666666" />
          </TouchableHighlight>
        </View>

        <View style={styles.walletListWrap}>
          <ListView dataSource={walletRowSource} renderRow={rowData => this.renderWalletRow(rowData)} enableEmptySections />
        </View>
      </View>
    )
  }

  renderWalletRow (walletData) {
    return (
      <TouchableHighlight style={styles.individualRowWrap} onPress={this._selectWalletToSendConfirmation.bind(this)}>
        <Text style={styles.individualRowText}>
          {walletData.walletName}
          ($ {walletData.amount})
        </Text>
      </TouchableHighlight>
    )
  }

  border (color) {
    return { borderColor: color, borderWidth: 2 }
  }
}
