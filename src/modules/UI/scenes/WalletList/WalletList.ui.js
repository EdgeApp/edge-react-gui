import React, { Component } from 'react'
import t from '../../../../lib/LocaleStrings'
import {sprintf} from 'sprintf-js'
import PropTypes from 'prop-types'
import { TouchableWithoutFeedback, Image, ScrollView, ListView, Text, TextInput, View, StyleSheet, TouchableHighlight, Animated } from 'react-native'
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
  updateRenameWalletInput,
  toggleWalletRenameModal,
  closeWalletDeleteModal,
  updateCurrentWalletBeingRenamed,
  closeRenameWalletModal,
  renameWallet,
  deleteWallet
} from './action'
import {border} from '../../../../util/border'

import { forceWalletListUpdate } from './middleware'
import Modal from 'react-native-modal'
import StylizedModal from '../../components/Modal/Modal.ui'

// Fake stuff to be removed
import { addWallet, completeDeleteWallet } from '../../Wallets/action.js'
// End of fake stuff to be removed later

class WalletList extends Component {
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
            <View style={[styles.totalBalanceHeader, border('red')]}>
              <FormattedText style={[styles.totalBalanceText]}>
                {sprintf('%s', t('fragment_wallets_balance_text'))}
              </FormattedText>
            </View>
            <View style={[styles.currentBalanceBoxDollarsWrap, border('green')]}>
              <FormattedText style={[styles.currentBalanceBoxDollars]}>
                $ 8,200.00
              </FormattedText>
            </View>
          </View>
        </View>
        <View style={styles.walletsBox}>
          <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[styles.walletsBoxHeaderWrap]} colors={['#3B7ADA', '#2B5698']}>
            <View style={[styles.walletsBoxHeaderTextWrap, border('yellow')]}>
              <View style={styles.leftArea}>
                <SimpleLineIcons name='wallet' style={[styles.walletIcon, border('green')]} color='white' />
                <FormattedText style={styles.walletsBoxHeaderText}>
                  {sprintf('%s', t('fragment_wallets_header'))}
                </FormattedText>
              </View>
            </View>
            <TouchableWithoutFeedback onPress={() => Actions.createWallet()} style={[styles.walletsBoxHeaderAddWallet, border('red')]}>
              <Ionicon name='md-add'style={[styles.dropdownIcon, border('green')]} color='white' />
            </TouchableWithoutFeedback>
          </LinearGradient>

          {console.log('walletListArray', walletListArray)}
          {(walletListArray.length > 0) &&
            <SortableListView
              style={styles.sortableWalletList}
              data={walletListArray}
              order={walletOrder}
              onRowMoved={e => {
                walletOrder.splice(e.to, 0, walletOrder.splice(e.from, 1)[0])
                this.props.dispatch(updateWalletListOrder(walletOrder, this.props.walletList, walletListArray))
              }}
              renderRow={row => <WalletListRow data={row} archiveLabel={sprintf('%s', t('fragmet_wallets_list_archive_title_capitalized'))} />}
            />
          }

          <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[styles.archiveBoxHeaderWrap]} colors={['#3B7ADA', '#2B5698']}>
            <View style={[styles.archiveBoxHeaderTextWrap]}>
              <View style={styles.leftArea}>
                <EvilIcons name='archive' style={[styles.archiveIcon, border('green')]} color='white' />
                <FormattedText style={styles.archiveBoxHeaderText}>
                  {sprintf('%s', t('fragmet_wallets_list_archive_title_capitalized'))}
                </FormattedText>
              </View>
            </View>
            <TouchableWithoutFeedback onPress={this.toggleArchiveDropdown.bind(this)} style={[styles.archiveBoxHeaderDropdown, border('red')]}>
              <FAIcon name='angle-down' style={[styles.dropdownIcon, border('green')]} color='white' />
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
              renderRow={row => <WalletListRow archiveLabel={sprintf('%s', t('fragmet_wallets_list_restore_title_capitalized'))} data={row} />}
            />
          }
        </View>
      </View>
    )
  }

  renderDeleteWalletModal () {
    return (
      <StylizedModal
        featuredIcon={<DeleteIcon />}
        headerText={sprintf('%s', t('fragment_wallets_delete_wallet'))} // t(')
        modalMiddle={<DeleteSubtext />}
        modalBottom={<DeleteWalletButtonsConnect />}
        visibilityBoolean={this.props.deleteWalletModalVisible}
      />
    )
  }

  renderRenameWalletModal = () => {
    return (
      <StylizedModal
        featuredIcon={<AddressIcon />}
        headerText={sprintf('%s', t('fragment_wallets_rename_wallet'))} // t(')
        headerSubtext={this.props.walletName}
        modalMiddle={<WalletNameInputConnect />}
        modalBottom={<RenameWalletButtonsConnect
        walletId={this.props.walletId}
        renameWalletInput={this.props.renameWalletInput} />}
        visibilityBoolean={this.props.renameWalletModalVisible}
      />
    )
  }

  checkIndexIsEven (n) {
    console.info('n is: ' , n)
      return n % 2 == 0;
  }
}

WalletList.propTypes = {
  archiveList: PropTypes.array
}

const mapStateToProps = state => ({
  walletList:               state.ui.wallets.byId,
  walletArchivesVisible:    state.ui.scenes.walletList.walletArchivesVisible,
  renameWalletModalVisible: state.ui.scenes.walletList.renameWalletModalVisible,
  deleteWalletModalVisible: state.ui.scenes.walletList.deleteWalletModalVisible,
  walletName:               state.ui.scenes.walletList.walletName,
  walletId:                 state.ui.scenes.walletList.walletId,
  renameWalletInput:        state.ui.scenes.walletList.renameWalletInput,
  walletOrder:              state.ui.wallets.walletListOrder
})

export default connect(state => (mapStateToProps))(WalletList)

////// Beginning of Delete Area ////////

class DeleteIcon extends Component {
  render() {
    return(
      <FAIcon name='trash-o' size={24} color='#2A5799' style={[{position: 'relative', top:12, left:14, height: 24, width: 24, backgroundColor: 'transparent', zIndex: 1015, elevation: 1015}]} />
    )
  }
}

class DeleteSubtext extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return(
      <FormattedText style={styles.subHeaderSyntax}>
        {sprintf('%s', t('fragmet_wallets_delete_wallet_first_confirm_message_mobile'))}
        {
          (this.props.currentWalletBeingDeleted) ?
          (
            <FormattedText
              style={{fontWeight: 'bold'}}>
              {this.props.currentWalletBeingDeleted}?
            </FormattedText>
          ):
          (
            <FormattedText>{sprintf('%s', t(' this wallet?'))}</FormattedText>
          )
        }
      </FormattedText>
    )
  }
}
export const DeleteSubtextConnect = connect( state => ({
  currentWalletBeingDeleted: state.ui.scenes.walletList.currentWalletBeingDeleted
}))(DeleteSubtext)

class DeleteWalletButtons extends Component {
  _onCancelDeleteModal = () => {
    this.props.dispatch(closeWalletDeleteModal())
  }

  _onDeleteModalDone = () => {
    this.props.dispatch(deleteWallet(this.props.walletId))
  }

  render() {
    return(
      <View style={[styles.buttonsWrap, border('gray')]}>

        <TouchableHighlight onPress={this._onCancelDeleteModal} style={[styles.cancelButtonWrap, styles.stylizedButton]}>

          <View style={styles.stylizedButtonTextWrap}>
            <FormattedText style={[styles.cancelButton, styles.stylizedButtonText]}>{sprintf('%s', t('string_cancel_cap'))}</FormattedText>
          </View>

        </TouchableHighlight>

        <TouchableHighlight onPress={this._onDeleteModalDone} style={[styles.doneButtonWrap, styles.stylizedButton]}>

          <View style={styles.stylizedButtonTextWrap}>
            <FormattedText style={[styles.doneButton, styles.stylizedButtonText]}>{sprintf('%s', t('string_delete'))}</FormattedText>
          </View>

        </TouchableHighlight>
      </View>
    )
  }
}
export const DeleteWalletButtonsConnect = connect(state => ({

}))(DeleteWalletButtons)

/////////End of Delete Area //////////


/////// Beginning of Rename Area ////////



class AddressIcon extends Component {
  render() {
    return(
      <MAIcon name='edit' size={24} color='#2A5799' style={[{position: 'relative', top:12, left:14, height: 24, width: 24, backgroundColor: 'transparent'}] }/>
    )
  }
}

class WalletNameInput extends Component {
  _onNameInputChange = (input) => {
    this.props.dispatch(updateRenameWalletInput(input))
  }

  render() {
    let walletName = this.props.currentWalletRename
    return(
      <View style={[styles.nameInputWrap, border('orange')]}>
        <TextInput style={[styles.nameInput, border('red')]}
          onChangeText={(input) => this._onNameInputChange(input)}
          value={this.props.renameWalletInput}
          autoFocus />
      </View>
    )
  }
}
export const WalletNameInputConnect = connect( state => ({
  currentWalletBeingRenamed: state.ui.scenes.walletList.currentWalletBeingRenamed,
  currentWalletRename:       state.ui.scenes.walletList.currentWalletRename,
  renameWalletVisible:       state.ui.scenes.walletList.renameWalletVisible,
}))(WalletNameInput)

class RenameWalletButtons extends Component {
  constructor(props){
    super(props)
    this.state = {

    }
  }

  _onRenameModalDone = () => {
    this.props.dispatch(closeRenameWalletModal())
    this.props.dispatch(renameWallet(this.props.walletId, this.props.renameWalletInput))
  }

  _onCancelRenameModal = () => {
    this.props.dispatch(closeRenameWalletModal())    
    this.props.dispatch(updateRenameWalletInput(''))    
  }

  render() {
    return(
      <View style={[styles.buttonsWrap, border('gray')]}>

        <TouchableHighlight onPress={this._onCancelRenameModal} style={[styles.cancelButtonWrap, styles.stylizedButton]}>

          <View style={styles.stylizedButtonTextWrap}>
            <FormattedText style={[styles.cancelButton, styles.stylizedButtonText]}>{sprintf('%s', t('string_cancel_cap'))}</FormattedText>
          </View>

        </TouchableHighlight>

        <TouchableHighlight onPress={this._onRenameModalDone}
          style={[styles.doneButtonWrap, styles.stylizedButton]}>

          <View style={styles.stylizedButtonTextWrap}>
            <FormattedText style={[styles.doneButton, styles.stylizedButtonText]}>{sprintf('%s', t('calculator_done'))}</FormattedText>
          </View>

        </TouchableHighlight>
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
export const RenameWalletButtonsConnect = connect(state => ({
  currentWalletBeingRenamed: state.ui.wallets.byId[state.ui.scenes.wallets.selectedWallet]
}))(RenameWalletButtons)

/////// End of Rename Area ////////
