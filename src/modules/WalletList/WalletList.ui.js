import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Image, ScrollView, ListView, Text, TextInput, View, StyleSheet, TouchableHighlight, Animated }  from 'react-native'
import { Container, Header, InputGroup, Input, Icon, Button } from 'native-base';
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import styles from './WalletList.style'
import SortableListView from 'react-native-sortable-listview'
import WalletListRow from './WalletListRow.ui'
import { 
          updateWalletOrder, 
          updateWalletListOrder, 
          updateArchiveListOrder, 
          toggleWalletsVisibility, 
          toggleArchiveVisibility, 
          completeRenamWallet, 
          updateWalletRenameInput, 
          toggleWalletRenameModal 
        } from './WalletList.action'

import { forceWalletListUpdate } from './WalletList.middleware'
import Modal from 'react-native-modal'

// Fake stuff to be removed
import { addWallet } from '../Wallets/Wallets.action.js'
// End of fake stuff to be removed later

class WalletList extends Component {

  componentWillMount() {
   
  }

  forceArchiveListUpdate(archiveOrder) {
    this.props.dispatch(updateArchiveListOrder(archiveOrder))
  }

  toggleArchiveDropdown() {
    this.props.dispatch(toggleArchiveVisibility())
  }

  render() {
    const walletOrder = []
    const walletListArray = []
    for (var idx in this.props.walletList) {
      walletOrder.push(this.props.walletList[idx].order)
      walletListArray.push(this.props.walletList[idx])
    }


    return(
      <View style={styles.container}>
          {this.renderDeleteWalletModal()}
          {this.renderRenameWalletModal()}

        <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} style={[styles.totalBalanceBox]} colors={["#3b7adb","#2b569a"]}>
          <View style={[styles.totalBalanceWrap]}>
            <View style={[styles.totalBalanceHeader]}>
              <Text style={[styles.totalBalanceText]}>Total Balance</Text>
            </View>
            <View style={styles.currentBalanceBoxDollarsWrap}>
              <Text style={[styles.currentBalanceBoxDollars]}>$ 8,200.00</Text>
            </View>
            <Text style={[styles.currentBalanceBoxBits]}>b 6.4616</Text>
          </View>
        </LinearGradient>          
        <View style={styles.walletsBox}>
          <View style={styles.walletsBoxHeaderWrap}>
            <View style={[styles.walletsBoxHeaderTextWrap]}>
              <Text style={styles.walletsBoxHeaderText}>Wallets</Text>
            </View>
            <TouchableHighlight onPress={() => Actions.addWallet()} style={[styles.walletsBoxHeaderAddWallet]}>
              <FAIcon name="plus" size={18} style={[styles.dropdownIcon]}  color="#666666" />
            </TouchableHighlight>
          </View>
          <SortableListView
            style={styles.sortableWalletList}
            data={walletListArray}
            order={walletOrder}
            onRowMoved={e => {
              walletOrder.splice(e.to, 0, walletOrder.splice(e.from, 1)[0])
              this.props.dispatch(updateWalletListOrder(walletOrder, this.props.walletList, walletListArray))
            }}            
            renderRow={ row => <WalletListRow data={row} />}
          />

          <View style={styles.archiveBoxHeaderWrap}>
            <View style={[styles.archiveBoxHeaderTextWrap]}>
              <Text style={styles.archiveBoxHeaderText}>Archive</Text>
            </View>
            <TouchableHighlight onPress={this.toggleArchiveDropdown.bind(this)} style={[styles.archiveBoxHeaderDropdown]}>
              <FAIcon name="chevron-down" size={18} style={[styles.dropdownIcon]}  color="#666666" />
            </TouchableHighlight>
          </View>          
          {this.props.archiveVisible && 
            <SortableListView
              style={styles.sortableWalletList}
              data={archiveList}
              order={archiveOrder}
              onRowMoved={e => {
                archiveOrder.splice(e.to, 0, archiveOrder.splice(e.from, 1)[0]);
                this.forceArchiveListUpdate(archiveOrder);
              }}
              onRowMoved={this._onRowMoved}
              onMoveStart={this._onMoveStart}
              onMoveEnd={this._onMoveEnd}
              rowHasChanged={this._rowHasChanged}              
              renderRow={ row => <WalletListRow data={row} />}
            />             
          }
        </View>
      </View>
    )
  }

  renderDeleteWalletModal() {
    return(
        <Modal isVisible={this.props.deleteWalletVisible}>
          <View style={styles.modalContainer}>
          </View>
        </Modal>      
    )
  }

  _onToggleRenameModal() {
    this.props.dispatch(toggleWalletRenameModal())
  }

  _onCancelRenameModal() {
    this.props.dispatch(toggleWalletRenameModal())
    this.props.dispatch(updateWalletRenameInput(''))
  }

  _onNameModalDone() {
    this.props.dispatch(completeRenamWallet())
  }

  _onNameInputChange(input) {
    this.props.dispatch(updateWalletRenameInput(input))
  }

  renderRenameWalletModal() {
    return(
      <Modal isVisible={this.props.renameWalletVisible}>
        <View style={styles.modalContainer}>

            <View style={[styles.modalOverlay]}>
              <View style={[styles.modalBox]}>
                <View style={[styles.modalTopTextWrap]}>
                  <Text style={styles.modalTopText}>Rename Wallet:</Text>
                </View>
                <View style={[styles.modalMiddle]}>
                  <View style={[styles.nameInputWrap]}>
                    <TextInput style={[styles.nameInput]} onChangeText={(input) => this._onNameInputChange(input)}></TextInput>
                  </View>
                </View>
                <View style={[styles.modalBottom]}>
                  <View style={[styles.emptyBottom]}>
                  </View>
                  <View style={[styles.buttonsWrap]}>
                    <TouchableHighlight onPress={this._onCancelRenameModal.bind(this)} style={[styles.cancelButtonWrap]}>
                      <Text style={styles.cancelButton}>CANCEL</Text>
                    </TouchableHighlight>
                    <TouchableHighlight onPress={ this._onNameModalDone.bind(this) } style={[styles.doneButtonWrap]}>
                      <Text style={styles.doneButton}>DONE</Text>
                    </TouchableHighlight>
                  </View>
                </View>
              </View>
            </View>
        </View>    
      </Modal>
    )
  }

  border(color) {
    return {
      borderColor: color,
      borderWidth: 2
    }
  }
}

WalletList.propTypes = {
  archiveList: PropTypes.array
}

export default connect( state => ({

  walletList: state.wallets.wallets,
  archiveList: state.walletList.archiveList,
  archiveVisible: state.walletList.archiveVisible,
  renameWalletVisible: state.walletList.renameWalletVisible,
  deleteWalletVisible: state.walletList.deleteWalletVisible,
  currentWalletRename: state.walletList.currentWalletRename,
  walletOrder: state.wallets.walletListOrder

}) )(WalletList)
