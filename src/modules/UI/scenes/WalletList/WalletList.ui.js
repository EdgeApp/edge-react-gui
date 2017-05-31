import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { TouchableWithoutFeedback,Image, ScrollView, ListView, Text, TextInput, View, StyleSheet, TouchableHighlight, Animated } from 'react-native'
import FormattedText from '../../components/FormattedText'
import { Container, Header, InputGroup, Input, Icon, Button } from 'native-base'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
import Ionicon from 'react-native-vector-icons/Ionicons'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import styles from './style'
import SortableListView from 'react-native-sortable-listview'
import WalletListRow from './WalletListRow.ui'
import {
          updateWalletOrder,
          updateWalletListOrder,
          updateArchiveListOrder,
          toggleWalletsVisibility,
          toggleArchiveVisibility,
          completeRenameWallet,
          updateWalletRenameInput,
          toggleWalletRenameModal,
          closeWalletDeleteModal,
          updateCurrentWalletBeingRenamed,
          closeWalletRenameModal
        } from './action'
import { forceWalletListUpdate } from './middleware'
import Modal from 'react-native-modal'
import StylizedModal from '../../components/Modal/Modal.ui'

// Fake stuff to be removed
import { addWallet, completeDeleteWallet } from '../../Wallets/action.js'
// End of fake stuff to be removed later

class WalletList extends Component {

  componentWillMount () {

  }

  forceArchiveListUpdate (archiveOrder) {
    this.props.dispatch(updateArchiveListOrder(archiveOrder))
  }

  toggleArchiveDropdown () {
    this.props.dispatch(toggleArchiveVisibility())
  }

  render () {
    const walletOrder = []
    const walletListArray = []
    const archiveOrder = []
    const archiveListArray = []
    let walletIterator = 0
    let archiveIterator = 0
    for (var idx in this.props.walletList) {
      console.log('iterating over wallets, current wallet is: ', this.props.walletList[idx])      
      if (this.props.walletList[idx].archived === true) {
        archiveOrder.push(archiveIterator)
        archiveListArray.push(this.props.walletList[idx])
        archiveIterator++
      } else {
        walletOrder.push(walletIterator)
        walletListArray.push(this.props.walletList[idx])
        walletIterator++
      }
    }

    return (
      <View style={styles.container}>
        {this.renderDeleteWalletModal()}
        {this.renderRenameWalletModal()}

        <View style={[styles.totalBalanceBox]}>
          <View style={[styles.totalBalanceWrap]}>
            <View style={[styles.totalBalanceHeader, this.border('red')]}>
              <FormattedText style={[styles.totalBalanceText]}>Total Balance</FormattedText>
            </View>
            <View style={[styles.currentBalanceBoxDollarsWrap, this.border('green')]}>
              <FormattedText style={[styles.currentBalanceBoxDollars]}>$ 8,200.00</FormattedText>
            </View>
          </View>
        </View>
        <View style={styles.walletsBox}>
          <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[styles.walletsBoxHeaderWrap]} colors={['#3B7ADA', '#2B5698']}>
            <View style={[styles.walletsBoxHeaderTextWrap, this.border('yellow')]}>
              <View style={styles.leftArea}>
                <SimpleLineIcons name='wallet' style={[styles.walletIcon, this.border('green')]} color='white' />              
                <FormattedText style={styles.walletsBoxHeaderText}>My Wallets</FormattedText>
              </View>
            </View>
            <TouchableWithoutFeedback onPress={() => Actions.addWallet()} style={[styles.walletsBoxHeaderAddWallet, this.border('red')]}>
              <Ionicon name='md-add'style={[styles.dropdownIcon, this.border('green')]} color='white' />
            </TouchableWithoutFeedback>
          </LinearGradient>
          <SortableListView
            style={styles.sortableWalletList}
            data={walletListArray}
            order={walletOrder}
            onRowMoved={e => {
              walletOrder.splice(e.to, 0, walletOrder.splice(e.from, 1)[0])
              this.props.dispatch(updateWalletListOrder(walletOrder, this.props.walletList, walletListArray))
            }}
            renderRow={row => <WalletListRow data={row} archiveLabel='Archive' />}
          />

          <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[styles.archiveBoxHeaderWrap]} colors={['#3B7ADA', '#2B5698']}>
            <View style={[styles.archiveBoxHeaderTextWrap]}>
              <View style={styles.leftArea}>
                <EvilIcons name='archive' style={[styles.archiveIcon, this.border('green')]} color='white' />
                <FormattedText style={styles.archiveBoxHeaderText}>Archive</FormattedText>
              </View>
            </View>
            <TouchableWithoutFeedback onPress={this.toggleArchiveDropdown.bind(this)} style={[styles.archiveBoxHeaderDropdown, this.border('red')]}>
              <FAIcon name='angle-down' style={[styles.dropdownIcon, this.border('green')]} color='white' />
            </TouchableWithoutFeedback>
          </LinearGradient>
          {this.props.archiveVisible &&
          <SortableListView
            style={styles.sortableWalletList}
            data={archiveListArray}
            order={archiveOrder}
            render='archive'
            onRowMoved={e => {
              archiveOrder.splice(e.to, 0, archiveOrder.splice(e.from, 1)[0])
              this.forceArchiveListUpdate(archiveOrder)
            }}
            renderRow={row => <WalletListRow archiveLabel='Restore' data={row} />}
              />
            }
        </View>
      </View>
    )
  }

  _onCancelDeleteModal () {
    this.props.dispatch(closeWalletDeleteModal())
  }

  _onDeleteModalDone () {
    this.props.dispatch(completeDeleteWallet(this.props.currentWalletBeingDeleted))
  }

  renderDeleteWalletModal () {
    let currentWalletBeingDeletedName = 'this wallet'
    if (this.props.currentWalletBeingDeleted) {
      currentWalletBeingDeletedName = "'" + this.props.walletList[this.props.currentWalletBeingDeleted].name + "'"
    }
    return (
      <Modal isVisible={this.props.deleteWalletVisible}>
        <View style={styles.modalContainer}>

          <View style={[styles.modalOverlay]}>
            <View style={[styles.modalBox]}>
              <View style={[styles.modalTopTextWrap]}>
                <FormattedText style={styles.modalTopText}>Delete Wallet?</FormattedText>
              </View>
              <View style={[styles.modalMiddle]}>
                <View style={[styles.modalMiddleTextWrap]}>
                  <FormattedText style={styles.modalMiddleText}>Are you sure you would like to delete {currentWalletBeingDeletedName}?</FormattedText>
                </View>
              </View>
              <View style={[styles.modalBottom]}>
                <View style={[styles.emptyBottom]} />
                <View style={[styles.buttonsWrap]}>
                  <TouchableHighlight onPress={this._onCancelDeleteModal.bind(this)} style={[styles.cancelButtonWrap]}>
                    <FormattedText style={styles.cancelButton}>CANCEL</FormattedText>
                  </TouchableHighlight>
                  <TouchableHighlight onPress={this._onDeleteModalDone.bind(this)} style={[styles.doneButtonWrap]}>
                    <FormattedText style={styles.doneButton}>DONE</FormattedText>
                  </TouchableHighlight>
                </View>
              </View>
            </View>
          </View>
        </View>

      </Modal>
    )
  }

  renderRenameWalletModal = () => {

    return (
      <StylizedModal 
        featuredIcon={<AddressIcon />} 
        headerText='Rename Wallet:'
        headerSubtext={this.props.currentWalletBeingRenamed} 
        modalMiddle={<WalletNameInputConnect />}
        modalBottom={<RenameWalletButtonsConnect />}
        visibilityBoolean={this.props.renameWalletVisible}
      />
    )
  }

  checkIndexIsEven (n) {
    console.info('n is: ' , n)
      return n % 2 == 0;
  }

  border (color) {
    return {
      borderColor: color,
      borderWidth: 0
    }
  }
}

WalletList.propTypes = {
  archiveList: PropTypes.array
}

export default connect(state => ({

  walletList: state.ui.wallets.byId,
  archiveList: state.ui.walletList.archiveList,
  archiveVisible: state.ui.walletList.archiveVisible,
  renameWalletVisible: state.ui.walletList.renameWalletVisible,
  deleteWalletVisible: state.ui.walletList.deleteWalletVisible,
  currentWalletRename: state.ui.walletList.currentWalletRename,
  currentWalletBeingRenamed: state.ui.walletList.currentWalletBeingRenamed,
  walletOrder: state.ui.wallets.walletListOrder,
  currentWalletBeingDeleted: state.ui.walletList.currentWalletBeingDeleted

}))(WalletList)

class AddressIcon extends Component {
  render() {
    return(
      <MAIcon name="edit" size={24} color="#2A5799" style={[{position: 'relative', top:12, left:12, height: 24, width: 24, backgroundColor: 'transparent', zIndex: 1015, elevation: 1015}]} />        
    )
  }
}

class WalletNameInput extends Component {
  _onToggleRenameModal () {
    // this.props.dispatch(updateCurrentWalletBeingRenamed(null))
    // this.props.dispatch(updateWalletRenameInput(''))
    // this.props.dispatch(toggleWalletRenameModal())
  }



  _onNameInputChange (input) {
    this.props.dispatch(updateWalletRenameInput(input))
  }

  render() {
    let walletName = this.props.currentWalletRename ? this.props.currentWalletRename : ''    
    return(
      <View style={[styles.nameInputWrap, this.border('orange')]}>
          <TextInput style={[styles.nameInput, this.border('red')]} onChangeText={(input) => this._onNameInputChange(input)} value={walletName} />
      </View>      
    )
  }
  border (color) {
    return {
      borderColor: color,
      borderWidth: 0
    }
  }  
}
export const WalletNameInputConnect = connect( state => ({
  currentWalletBeingRenamed: state.ui.walletList.currentWalletBeingRenamed,
  currentWalletRename: state.ui.walletList.currentWalletRename,  
  renameWalletVisible: state.ui.walletList.renameWalletVisible,  
}))(WalletNameInput)

class RenameWalletButtons extends Component {

  _onRenameModalDone = () => {
    this.props.dispatch(completeRenameWallet(this.props.currentWalletBeingRenamed, this.props.currentWalletRename))
  }

  _onCancelRenameModal = () => {
    this.props.dispatch(toggleWalletRenameModal())
    this.props.dispatch(closeWalletRenameModal())
    this.props.dispatch(updateWalletRenameInput(''))
    this.props.dispatch(updateCurrentWalletBeingRenamed(null))
  }

  render() {
    return(
      <View style={[styles.buttonsWrap, this.border('gray')]}>
          <TouchableHighlight onPress={this._onCancelRenameModal} style={[styles.cancelButtonWrap, styles.stylizedButton]}>
            <View style={styles.stylizedButtonTextWrap}>
                <FormattedText style={[styles.cancelButton, styles.stylizedButtonText]}>Cancel</FormattedText>
            </View>
          </TouchableHighlight>
          <TouchableHighlight onPress={this._onRenameModalDone} style={[styles.doneButtonWrap, styles.stylizedButton]}>
            <View style={styles.stylizedButtonTextWrap}>            
              <FormattedText style={[styles.doneButton, styles.stylizedButtonText]}>Done</FormattedText>
            </View>
          </TouchableHighlight>
      </View>      
    )
  }

  border (color) {
    return {
      borderColor: color,
      borderWidth: 1
    }
  }    

}
export const RenameWalletButtonsConnect = connect( state => ({

}))(RenameWalletButtons)