import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  TouchableWithoutFeedback,
  Image,
  ScrollView,
  ListView,
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Animated } from 'react-native'
import Locale from 'react-native-locale'
import T from '../../components/FormattedText'
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
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'

import {
  toggleArchiveVisibility,
  updateRenameWalletInput,
  closeWalletDeleteModal,
  closeRenameWalletModal,
  renameWallet,
  deleteWallet,
  updateActiveWalletsOrder,
  updateArchivedWalletsOrder
} from './action'
import {border as b} from '../../../utils'

import { forceWalletListUpdate } from './middleware'
import Modal from 'react-native-modal'
import StylizedModal from '../../components/Modal/Modal.ui'

// Fake stuff to be removed
import { addWallet, completeDeleteWallet, selectWallet } from '../../Wallets/action.js'
// End of fake stuff to be removed later
import * as UI_SELECTORS from '../../selectors.js'

class WalletList extends Component {
  toggleArchiveDropdown = () => {
    this.props.dispatch(toggleArchiveVisibility())
  }

  constructor(props){
    super(props)
    const localeInfo = Locale.constants() // should likely be moved to login system and inserted into Redux
    console.log('localeInfo is: ', localeInfo)
    console.log('strings is: ' , strings)
  }

  /*forceArchiveListUpdate (archiveOrder) {
    this.props.dispatch(updateArchiveListOrder(archiveOrder))
  }*/ // delete this function?

  render () {
    const { wallets, coreWallets, activeWalletIds, archivedWalletIds } = this.props
    return (
      <View style={styles.container}>
        {this.renderDeleteWalletModal()}
        {this.renderRenameWalletModal()}

        <View style={[styles.totalBalanceBox]}>
          <View style={[styles.totalBalanceWrap]}>
            <View style={[styles.totalBalanceHeader, b()]}>
              <T style={[styles.totalBalanceText]}>
                {sprintf(strings.enUS['fragment_wallets_balance_text'])}
              </T>
            </View>
            <View style={[styles.currentBalanceBoxDollarsWrap, b('green')]}>
              <T style={[styles.currentBalanceBoxDollars]}>
                {this.props.settings.defaultFiat} 8,200.00
              </T>
            </View>
          </View>
        </View>

        <View style={styles.walletsBox}>
          <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[styles.walletsBoxHeaderWrap]} colors={['#3B7ADA', '#2B5698']}>
            <View style={[styles.walletsBoxHeaderTextWrap, b()]}>
              <View style={styles.leftArea}>
                <SimpleLineIcons name='wallet' style={[styles.walletIcon, b()]} color='white' />
                <T style={styles.walletsBoxHeaderText}>
                  {sprintf(strings.enUS['fragment_wallets_header'])}
                </T>
              </View>
            </View>

            <TouchableOpacity onPress={() => Actions.createWallet()} style={[styles.walletsBoxHeaderAddWallet, b('red'), {width: 35}]}>
              <Ionicon name='md-add'style={[styles.dropdownIcon, b()]} color='white' />
            </TouchableOpacity>
          </LinearGradient>
          {
            this.renderActiveSortableList(
              wallets,
              activeWalletIds,
              sprintf(strings.enUS['fragmet_wallets_list_archive_title_capitalized']),
              this.renderActiveRow,
              this.onActiveRowMoved,

            )
          }

          {/* <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[styles.archiveBoxHeaderWrap]} colors={['#3B7ADA', '#2B5698']}> */}
          {/*   <View style={[styles.archiveBoxHeaderTextWrap]}> */}
          {/*     <View style={styles.leftArea}> */}
          {/*       <EvilIcons name='archive' style={[styles.archiveIcon, b('green')]} color='white' /> */}
          {/*       <T style={styles.archiveBoxHeaderText}> */}
          {/*         {sprintf(strings.enUS['fragmet_wallets_list_archive_title_capitalized'])} */}
          {/*       </T> */}
          {/*     </View> */}
          {/*   </View> */}
          {/*  */}
          {/*   <TouchableOpacity onPress={this.toggleArchiveDropdown} style={[styles.archiveBoxHeaderDropdown, b('red'), {width: 35}]}> */}
          {/*     <FAIcon name='angle-down' style={[styles.dropdownIcon, b()]} color='white' /> */}
          {/*   </TouchableOpacity> */}
          {/* </LinearGradient> */}
          {/* { */}
          {/*   this.renderArchivedSortableList( */}
          {/*     wallets, */}
          {/*     archivedWalletIds, */}
          {/*     sprintf(strings.enUS['fragmet_wallets_list_restore_title_capitalized']), */}
          {/*     this.renderArchivedRow, */}
          {/*     this.onArchivedRowMoved */}
          {/*   ) */}
          {/* } */}
        </View>
      </View>
    )
  }

  renderActiveSortableList = (data, order, label, renderRow, onRowMoved) => {
    if (order) {
      console.log('active order', order)
      return (
        <SortableListView
          style={styles.sortableWalletList}
          data={data}
          order={order}
          render={label}
          onRowMoved={this.onActiveRowMoved}
          renderRow={renderRow}
        />
      )
    }
  }

  renderArchivedSortableList = (data, order, label, renderRow, onRowMoved) => {
    if (order) {
      console.log('archive order', order)
      return (
        <SortableListView
          style={styles.sortableWalletList}
          data={data}
          order={order}
          render={label}
          onRowMoved={this.onArchivedRowMoved}
          renderRow={renderRow}
        />
      )
    }
  }

  renderActiveRow = row => {
    return <WalletListRow data={row} archiveLabel='Archive' />
  }

  renderArchivedRow = row => {
    return <WalletListRow data={row} archiveLabel='Restore' />
  }

  onActiveRowMoved = action => {
    const wallets = this.props.wallets
    const activeOrderedWallets = Object.keys(wallets)
      .filter(key => { return wallets[key].archived })
      .sort((a, b) => { return wallets[a].sortIndex - wallets[b].sortIndex })
    const order = activeOrderedWallets
    const newOrder = this.getNewOrder(order, action)

    this.props.dispatch(updateActiveWalletsOrder(newOrder))
    this.forceUpdate()
  }

  onArchivedRowMoved = action => {
    const wallets = this.props.wallets
    const activeOrderedWallets = Object.keys(wallets)
      .filter(key => { return wallets[key].archived })
      .sort((a, b) => { return wallets[a].sortIndex - wallets[b].sortIndex })
    const order = activeOrderedWallets
    const newOrder = this.getNewOrder(order, action)

    this.props.dispatch(updateArchivedWalletsOrder(newOrder))
    this.forceUpdate()
  }

  getNewOrder = (order, action) => {
    const { to, from, row: { index } } = action
    const newOrder = [].concat(order)
    newOrder.splice(action.to, 0, newOrder.splice(action.from, 1)[0])

    console.log('order', order)
    console.log('newOrder', newOrder)
    return newOrder
  }

  renderDeleteWalletModal = () => {
    return (
      <StylizedModal
        featuredIcon={<DeleteIcon />}
        headerText='fragment_wallets_delete_wallet' // t(')
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
        headerText='fragment_wallets_rename_wallet'
        headerSubtext={this.props.walletName}
        modalMiddle={<WalletNameInputConnect />}
        modalBottom={<RenameWalletButtonsConnect />}
        walletId={this.props.walletId}
        visibilityBoolean={this.props.renameWalletModalVisible}
      />
    )
  }

  checkIndexIsEven = (n) => {
    console.info('n is: ' , n)
      return n % 2 == 0;
  }
}

WalletList.propTypes = {}

const mapStateToProps = state => ({
  coreWallets:              state.core.wallets.byId,
  wallets:                  state.ui.wallets.byId,
  activeWalletIds:          UI_SELECTORS.getActiveWalletIds(state),
  archivedWalletIds:        UI_SELECTORS.getArchivedWalletIds(state),
  walletArchivesVisible:    state.ui.scenes.walletList.walletArchivesVisible,
  renameWalletModalVisible: state.ui.scenes.walletList.renameWalletModalVisible,
  deleteWalletModalVisible: state.ui.scenes.walletList.deleteWalletModalVisible,
  walletName:               state.ui.scenes.walletList.walletName,
  walletId:                 state.ui.scenes.walletList.walletId,
  walletOrder:              state.ui.wallets.walletListOrder,
  settings:                 state.ui.settings
})

const mapDispatchToProps = dispatch => ({
  updateActiveWalletsOrder: activeWalletIds => {
    dispatch(updateActiveWalletsOrder(activeWalletIds))
  },
  updateArchivedWalletsOrder: archivedWalletIds => {
    dispatch(updateArchivedWalletsOrder(archivedWalletIds))
  }
})

export default connect((mapStateToProps), (mapDispatchToProps))(WalletList)

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
      <T style={styles.subHeaderSyntax}>
        {sprintf(strings.enUS['fragmet_wallets_delete_wallet_first_confirm_message_mobile'])}
        {
          (this.props.currentWalletBeingDeleted) ?
            (
              <T
                style={{fontWeight: 'bold'}}>
                {this.props.currentWalletBeingDeleted}?
            </T>
          ):
          (
            <T>{sprintf(strings.enUS['fragment_wallets_this_wallet'])}</T>
          )
        }
      </T>
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
      <View style={[styles.buttonsWrap, b('gray')]}>

        <TouchableHighlight onPress={this._onCancelDeleteModal} style={[styles.cancelButtonWrap, styles.stylizedButton]}>

          <View style={styles.stylizedButtonTextWrap}>
            <T style={[styles.cancelButton, styles.stylizedButtonText]}>{sprintf(strings.enUS['string_cancel_cap'])}</T>
          </View>

        </TouchableHighlight>

        <TouchableHighlight onPress={this._onDeleteModalDone} style={[styles.doneButtonWrap, styles.stylizedButton]}>

          <View style={styles.stylizedButtonTextWrap}>
            <T style={[styles.doneButton, styles.stylizedButtonText]}>{sprintf(strings.enUS['string_delete'])}</T>
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
    // be aware that walletListRowOptions.ui.js also initially dispatches this action
    this.props.dispatch(updateRenameWalletInput(input))
  }

  render() {
    return(
      <View style={[styles.nameInputWrap, b('orange')]}>
        <TextInput style={[styles.nameInput, b('red')]}
          onChangeText={(input) => this._onNameInputChange(input)}
          defaultValue={this.props.currentWalletBeingRenamed}
          autoFocus />
      </View>
    )
  }
}
export const WalletNameInputConnect = connect( state => ({
  currentWalletBeingRenamed: state.ui.scenes.walletList.walletName,
  ///currentWalletRename:       state.ui.scenes.walletList.currentWalletRename,
  renameWalletVisible:       state.ui.scenes.walletList.renameWalletVisible,
  renameWalletInput:         state.ui.scenes.walletList.renameWalletInput

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
      <View style={[styles.buttonsWrap, b('gray')]}>

        <TouchableHighlight onPress={this._onCancelRenameModal} style={[styles.cancelButtonWrap, styles.stylizedButton]}>

          <View style={styles.stylizedButtonTextWrap}>
            <T style={[styles.cancelButton, styles.stylizedButtonText]}>{sprintf(strings.enUS['string_cancel_cap'])}</T>
          </View>

        </TouchableHighlight>

        <TouchableHighlight onPress={this._onRenameModalDone}
          style={[styles.doneButtonWrap, styles.stylizedButton]}>

          <View style={styles.stylizedButtonTextWrap}>
            <T style={[styles.doneButton, styles.stylizedButtonText]}>{sprintf(strings.enUS['calculator_done'])}</T>
          </View>

        </TouchableHighlight>
      </View>
    )
  }
}
export const RenameWalletButtonsConnect = connect(state => ({
  currentWalletBeingRenamed: state.ui.wallets.byId[state.ui.wallets.selectedWalletId],
  walletId:                  state.ui.scenes.walletList.walletId,
  renameWalletInput:         state.ui.scenes.walletList.renameWalletInput
}))(RenameWalletButtons)

/////// End of Rename Area ////////
