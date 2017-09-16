import React, {Component} from 'react'
import {TouchableOpacity, View} from 'react-native'
import MDIcon from 'react-native-vector-icons/MaterialIcons'
import T from '../../FormattedText'
import {toggleSelectedWalletListModal, toggleScanToWalletListModal} from '../../WalletListModal/action'
import {WalletListModalConnect} from '../../WalletListModal/WalletListModal.ui'
import {border as b} from '../../../../utils'

export default class WalletSelector extends Component {
  _onPressToggleSelectedWalletModal = () => {
    this.props.dispatch(toggleSelectedWalletListModal())
  }

  _onPressScanToDropdownToggle = () => {
    this.props.dispatch(toggleScanToWalletListModal())
  }

  render () {
    let topDisplacement = 66
    let selectionFunction = 'selectFromWallet'
    let walletNameString = this.props.selectedWallet.name + ':' + this.props.selectedWalletCurrencyCode

    return (
      <TouchableOpacity onPress={this[this.props.toggleFunction]} style={[b(), {flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}]}>
        <View style={{height: 34, width: 34}} />
        <T style={{color: '#FFF', fontSize: 20}} numberOfLines={1} >{walletNameString}</T>
        <View style={[b(), {height: 34, width: 34, justifyContent: 'center', alignItems: 'center'}]}>
          <View style={[b(), {position: 'relative', top: 2}]}>
            {
              !this.props.scanToWalletListModalVisibility
              && !this.props.addressModalVisible
              && <MDIcon name='keyboard-arrow-down' style={{color: '#FFF', fontSize: 25}} />
            }
          </View>
        </View>
        {
          this.props[this.props.visibleFlag]
          && <WalletListModalConnect topDisplacement={topDisplacement} selectionFunction={selectionFunction} type='from' />
        }
        {
          this.props.scanToWalletListModalVisibility
          && <WalletListModalConnect topDisplacement={topDisplacement} selectionFunction={'selectToWallet'} type='to' />
        }
      </TouchableOpacity>
    )
  }
}
