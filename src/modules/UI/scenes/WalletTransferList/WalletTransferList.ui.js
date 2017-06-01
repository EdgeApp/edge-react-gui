import React, { Component } from 'react'
import { ScrollView, ListView, Text, View, StyleSheet, TouchableHighlight } from 'react-native'
import { Container, Header, InputGroup, Input, Icon, Button } from 'native-base'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import { getWalletTransferList } from './middleware'
import styles from './style'
import { toggleWalletListModal } from './action'

class WalletTransferList extends Component {

  _closeWalletListModal () {
    this.props.dispatch(toggleWalletListModal())
  }

  componentWillMount () {
    this.props.dispatch(getWalletTransferList())
  }

  _selectWalletToSendConfirmation () {
    this.props.dispatch(toggleWalletListModal())
    Actions.sendConfirmation()
  }

  render () {
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    let walletRowSource = ds.cloneWithRows(this.props.walletTransferList)
    return (
      <View style={styles.container}>
        <View style={[styles.headerRowWrap]}>
          <View style={[styles.headerTextWrap]}>
            <Text style={styles.headerText}>Select destination wallet:</Text>
          </View>
          <TouchableHighlight style={[styles.exitIconWrap]} onPress={this._closeWalletListModal.bind(this)}>
            <FAIcon name='close' size={24} style={[styles.exitIcon]} color='#666666' />
          </TouchableHighlight>
        </View>

        <View style={styles.walletListWrap}>
          <ListView dataSource={walletRowSource}
            renderRow={(rowData) => this.renderWalletRow(rowData)}
            enableEmptySections
            />
        </View>
      </View>
    )
  }

  renderWalletRow (walletData) {
    return (
      <TouchableHighlight style={styles.individualRowWrap} onPress={this._selectWalletToSendConfirmation.bind(this)}>
        <Text style={styles.individualRowText}>{walletData.walletName} ($ {walletData.amount})</Text>
      </TouchableHighlight>
    )
  }

  border (color) {
    return {
      borderColor: color,
      borderWidth: 2
    }
  }
}

export default connect(state => ({

  walletTransferList: state.ui.walletTransferList.walletTransferList,
  walletListModalVisible: state.ui.walletTransferList.walletListModalVisible

}))(WalletTransferList)
