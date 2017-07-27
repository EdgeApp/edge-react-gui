import React, {Component} from 'react'
import {
  ListView,
  Text,
  View,
  TouchableHighlight
} from 'react-native'
import {connect} from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import {Actions} from 'react-native-router-flux'
import styles from './style'
import {toggleWalletListModal} from './action'

class WalletTransferList extends Component {

  _closeWalletListModal () {
    this.props.dispatch(toggleWalletListModal())
  }

  _selectWalletToSendConfirmation () {
    this.props.dispatch(toggleWalletListModal())
    Actions.sendConfirmation()
  }

  render () {
    const ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    })
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
            renderRow={(rowData) => this.renderWalletRow(rowData)} enableEmptySections />
        </View>
      </View>
    )
  }

  renderWalletRow (walletData) {
    return (
      <TouchableHighlight style={styles.individualRowWrap} onPress={this._selectWalletToSendConfirmation.bind(this)}>
        <Text style={styles.individualRowText}>{walletData.walletName}
          ($ {walletData.amount})</Text>
      </TouchableHighlight>
    )
  }

  border (color) {
    return {borderColor: color, borderWidth: 2}
  }
}

const mapStateToProps = state => ({walletTransferList: state.ui.scenes.walletTransferList.walletTransferList, walletListModalVisible: state.ui.scenes.walletTransferList.walletListModalVisible})

export default connect(state => (mapStateToProps))(WalletTransferList)
