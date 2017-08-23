// @flow

import React, {Component} from 'react'
import {
  ActivityIndicator,
  TextInput,
  View,
  TouchableHighlight,
  TouchableOpacity
} from 'react-native'
import Permissions from 'react-native-permissions'
import Contacts from 'react-native-contacts'
import {setContactList} from '../../contacts/action'
import T from '../../components/FormattedText'
import { bns } from 'biggystring'
import {connect} from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
import Ionicon from 'react-native-vector-icons/Ionicons'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'
// $FlowFixMe: suppressing this error since module IS available
import LinearGradient from 'react-native-linear-gradient'
import {Actions} from 'react-native-router-flux'
import styles from './style'
import SortableListView from 'react-native-sortable-listview'
import SortableList from 'react-native-sortable-list'
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
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import {border as b} from '../../../utils'
import {colors as c} from '../../../../theme/variables/airbitz.js'
import StylizedModal from '../../components/Modal/Modal.ui'
import * as UI_SELECTORS from '../../selectors.js'

class WalletList extends Component {
  toggleArchiveDropdown = () => {
    this.props.dispatch(toggleArchiveVisibility())
  }

  componentDidMount () {
    console.log('in WalletList->componentDidMount')
    Permissions.getPermissionStatus('contacts').then((response) => {
      if (response === 'authorized') {
        Contacts.getAll((err, contacts) => {
          if (err === 'denied') {
            // error
          } else {
            contacts.sort((a, b) => {
              return a.givenName > b.givenName
            })
            this.props.dispatch(setContactList(contacts))
          }
        })
      }
    })
  }

  render () {
    console.log('entering walletList render, this.props.wallets is: ', this.props.wallets)
    const {wallets} = this.props
    return (
      <View style={styles.container}>
        {this.renderDeleteWalletModal()}
        {this.renderRenameWalletModal()}

        <View style={[styles.totalBalanceBox]}>
          <View style={[styles.totalBalanceWrap]}>
            <View style={[styles.totalBalanceHeader]}>
              <T style={[styles.totalBalanceText]}>
                {sprintf(strings.enUS['fragment_wallets_balance_text'])}
              </T>
            </View>
            <View style={[styles.currentBalanceBoxDollarsWrap]}>
              <T style={[styles.currentBalanceBoxDollars]}>
                $ {this.tallyUpTotalCrypto()}
                {/* {this.props.settings.defaultFiat} */}
              </T>
            </View>
          </View>
        </View>

        <View style={styles.walletsBox}>
          <LinearGradient start={{
            x: 0,
            y: 0
          }} end={{
            x: 1,
            y: 0
          }} style={[styles.walletsBoxHeaderWrap]} colors={[c.gradient.light, c.gradient.dark]}>
            <View style={[styles.walletsBoxHeaderTextWrap]}>
              <View style={styles.leftArea}>
                <SimpleLineIcons name='wallet' style={[styles.walletIcon]} color='white' />
                <T style={styles.walletsBoxHeaderText}>
                  {sprintf(strings.enUS['fragment_wallets_header'])}
                </T>
              </View>
            </View>

            <TouchableOpacity style={[styles.walletsBoxHeaderAddWallet, {width: 35}]}
              onPress={() => Actions.createWallet()}>
              <Ionicon name='md-add' style={[styles.dropdownIcon]} color='white' />
            </TouchableOpacity>
          </LinearGradient>
          {Object.keys(wallets).length > 0
            ? this.renderActiveSortableList(this.props.wallets, this.sortActiveWallets(this.props.wallets), sprintf(strings.enUS['fragmet_wallets_list_archive_title_capitalized']), this.renderActiveRow, this.onActiveRowMoved)
            : <ActivityIndicator style={{flex: 1, alignSelf: 'center'}} size={'large'} />}
        </View>
      </View>
    )
  }

  renderActiveSortableList = (datum, order, label, renderRow, onRowMoved) => {
    console.log('going into renderActiveSortable list, datum is: ', datum, ' , order is: ', order, ' , label is: ', label)

    if (order) {
      console.log('order is true, datum is: ', datum)
      return (
        <View style={[{flex: 1, flexDirection: 'column'}]}>
          <SortableList
            rowActivationTime={400}
            style={[styles.sortableWalletList, b(), {flexDirection: 'row'}]}
            contentContainerStyle={[styles.sortableWalletList]}
            data={datum}
            order={order}
            render={label}
            onRowMoved={this.onActiveRowMoved}
            renderRow={this.renderActiveRow}
          />
        </View>
      )
    }
  }

  renderArchivedSortableList = (data, order, label, renderRow, onRowMoved) => {
    if (order) {
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

  renderActiveRow = (data, active) => {
    return <WalletListRow active={data.active} data={data.data} key={data.data.id} archiveLabel={sprintf(strings.enUS['fragmet_wallets_list_archive_title_capitalized'])} />
  }

  renderArchivedRow = data => {
    return <WalletListRow settings={this.props.settings} data={data} archiveLabel={sprintf(strings.enUS['fragmet_wallets_list_restore_title_capitalized'])} />
  }

  sortActiveWallets = (wallets) => {
    let activeOrdered = Object.keys(wallets).filter(key => {
      return !wallets[key].archived
    }) // filter out archived wallets
    .sort((a, b) => {
      if (wallets[a].sortIndex === wallets[b].sortIndex) {
        return -1
      } else {
        return wallets[a].sortIndex - wallets[b].sortIndex
      }
    }) // sort them according to their (previous) sortIndices
    console.log('inside sortActiveWallets, wallets is: ', wallets, ' , activeOrdered is now: ', activeOrdered)
    return activeOrdered
  }

  onActiveRowMoved = action => {
    const wallets = this.props.wallets
    const activeOrderedWallets = Object.keys(wallets).filter(key => {
      return !wallets[key].archived
    }) // filter out archived wallets
    .sort((a, b) => {
      return wallets[a].sortIndex - wallets[b].sortIndex
    }) // sort them according to their (previous) sortIndices
    const order = activeOrderedWallets
    const newOrder = this.getNewOrder(order, action) // pass the old order to getNewOrder with the action ( from, to, and  )

    this.props.dispatch(updateActiveWalletsOrder(newOrder))
    this.forceUpdate()
  }

  onArchivedRowMoved = action => {
    const wallets = this.props.wallets
    const activeOrderedWallets = Object.keys(wallets).filter(key => {
      return wallets[key].archived
    }).sort((a, b) => {
      return wallets[a].sortIndex - wallets[b].sortIndex
    })
    const order = activeOrderedWallets
    const newOrder = this.getNewOrder(order, action)

    this.props.dispatch(updateArchivedWalletsOrder(newOrder))
    this.forceUpdate()
  }

  getNewOrder = (order, action) => {
    const {to, from} = action
    const newOrder = [].concat(order)
    newOrder.splice(to, 0, newOrder.splice(from, 1)[0])

    return newOrder
  }

  renderDeleteWalletModal = () => {
    return <StylizedModal featuredIcon={< DeleteIcon />} headerText='fragment_wallets_delete_wallet' // t(')
      modalMiddle={< DeleteSubtext />} modalBottom={< DeleteWalletButtonsConnect />}
      visibilityBoolean={this.props.deleteWalletModalVisible} />
  }

  renderRenameWalletModal = () => {
    return <StylizedModal featuredIcon={< AddressIcon />} headerText='fragment_wallets_rename_wallet'
      headerSubtext={this.props.walletName} modalMiddle={< WalletNameInputConnect />}
      modalBottom={< RenameWalletButtonsConnect />} walletId={this.props.walletId}
      visibilityBoolean={this.props.renameWalletModalVisible} />
  }

  tallyUpTotalCrypto = () => {
    const temporaryTotalCrypto = {}
    for (const parentProp in this.props.wallets) {
      for (const balanceProp in this.props.wallets[parentProp].nativeBalances) {
        if (!temporaryTotalCrypto[balanceProp]) {
          temporaryTotalCrypto[balanceProp] = 0
        }
        const nativeBalance = this.props.wallets[parentProp].nativeBalances[balanceProp]
        if (nativeBalance && nativeBalance !== '0') {
          const wallet = this.props.wallets[parentProp]
          const currencyDenomination = wallet.allDenominations[balanceProp]
          const currencySettings = this.props.settings[balanceProp]
          const denomMultiplier:string = currencyDenomination[currencySettings.denomination].multiplier

          const cryptoAmount:number = bns.divf(nativeBalance, denomMultiplier)
          temporaryTotalCrypto[balanceProp] += cryptoAmount
        }
      }
    }
    let totalBalance = this.calculateTotalBalance(temporaryTotalCrypto)
    return totalBalance
  }

  calculateTotalBalance = (values) => {
    var total = 0
    for (var currency in values) {
      let addValue = this.props.currencyConverter.convertCurrency(currency, this.props.settings.defaultISOFiat, values[currency])
      total += addValue
    }
    return total.toFixed(2)
  }

}

WalletList.propTypes = {}

const mapStateToProps = (state) => {
  const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)

  return {
    // updatingBalance: state.ui.scenes.transactionList.updatingBalance,
    coreWallets: state.core.wallets.byId,
    wallets: state.ui.wallets.byId,
    activeWalletIds: UI_SELECTORS.getActiveWalletIds(state),
    archivedWalletIds: UI_SELECTORS.getArchivedWalletIds(state),
    walletArchivesVisible: state.ui.scenes.walletList.walletArchivesVisible,
    renameWalletModalVisible: state.ui.scenes.walletList.renameWalletModalVisible,
    deleteWalletModalVisible: state.ui.scenes.walletList.deleteWalletModalVisible,
    walletName: state.ui.scenes.walletList.walletName,
    walletId: state.ui.scenes.walletList.walletId,
    walletOrder: state.ui.wallets.walletListOrder,
    settings: state.ui.settings,
    currencyConverter
  }
}

const mapDispatchToProps = dispatch => ({
  updateActiveWalletsOrder: activeWalletIds => {
    dispatch(updateActiveWalletsOrder(activeWalletIds))
  },
  updateArchivedWalletsOrder: archivedWalletIds => {
    dispatch(updateArchivedWalletsOrder(archivedWalletIds))
  }
})

export default connect((mapStateToProps), (mapDispatchToProps))(WalletList)

// //// Beginning of Delete Area ////////

class DeleteIcon extends Component {
  render () {
    return <FAIcon name='trash-o' size={24} color={c.primary} style={[{
      position: 'relative',
      top: 12,
      left: 14,
      height: 24,
      width: 24,
      backgroundColor: 'transparent',
      zIndex: 1015,
      elevation: 1015
    }]} />
  }
}

class DeleteSubtext extends Component {
  render () {
    return (
      <T style={styles.subHeaderSyntax}>
        {sprintf(strings.enUS['fragmet_wallets_delete_wallet_first_confirm_message_mobile'])}
        {(this.props.currentWalletBeingDeleted)
          ? <T style={{fontWeight: 'bold'}}>
            {this.props.currentWalletBeingDeleted}?
            </T>
          : <T>{sprintf(strings.enUS['fragment_wallets_this_wallet'])}</T>}
      </T>
    )
  }
}
export const DeleteSubtextConnect = connect(state => ({
  currentWalletBeingDeleted: state.ui.scenes.walletList.currentWalletBeingDeleted
}))(DeleteSubtext)

class DeleteWalletButtons extends Component {
  _onCancelDeleteModal = () => {
    this.props.dispatch(closeWalletDeleteModal())
  }

  _onDeleteModalDone = () => {
    this.props.dispatch(deleteWallet(this.props.walletId))
  }

  render () {
    return (
      <View style={[styles.buttonsWrap]}>

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
export const DeleteWalletButtonsConnect = connect(state => ({}))(DeleteWalletButtons)

// ///////End of Delete Area //////////

// ///// Beginning of Rename Area ////////

class AddressIcon extends Component {
  render () {
    return <MAIcon name='edit' size={24} color={c.primary} style={[{
      position: 'relative',
      top: 12,
      left: 14,
      height: 24,
      width: 24,
      backgroundColor: 'transparent'
    }]} />
  }
}

class WalletNameInput extends Component {

  _onNameInputChange = (input) => {
    // be aware that walletListRowOptions.ui.js also initially dispatches this action
    this.props.dispatch(updateRenameWalletInput(input))
  }

  render () {
    return (
      <View style={[styles.nameInputWrap]}>
        <TextInput style={[styles.nameInput]}
          onChangeText={(input) => this._onNameInputChange(input)}
          defaultValue={this.props.currentWalletBeingRenamed} autoFocus />
      </View>
    )
  }
}
export const WalletNameInputConnect = connect(state => ({
  currentWalletBeingRenamed: state.ui.scenes.walletList.walletName,
  // /currentWalletRename:       state.ui.scenes.walletList.currentWalletRename,
  renameWalletVisible: state.ui.scenes.walletList.renameWalletVisible,
  renameWalletInput: state.ui.scenes.walletList.renameWalletInput
}))(WalletNameInput)

class RenameWalletButtons extends Component {
  state:any

  constructor (props) {
    super(props)
    this.state = {}
  }

  _onRenameModalDone = () => {
    this.props.dispatch(closeRenameWalletModal())
    this.props.dispatch(renameWallet(this.props.walletId, this.props.renameWalletInput))
  }

  _onCancelRenameModal = () => {
    this.props.dispatch(closeRenameWalletModal())
    this.props.dispatch(updateRenameWalletInput(''))
  }

  render () {
    return (
      <View style={[styles.buttonsWrap]}>

        <TouchableHighlight onPress={this._onCancelRenameModal} style={[styles.cancelButtonWrap, styles.stylizedButton]}>

          <View style={styles.stylizedButtonTextWrap}>
            <T style={[styles.cancelButton, styles.stylizedButtonText]}>{sprintf(strings.enUS['string_cancel_cap'])}</T>
          </View>

        </TouchableHighlight>

        <TouchableHighlight onPress={this._onRenameModalDone} style={[styles.doneButtonWrap, styles.stylizedButton]}>

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
  walletId: state.ui.scenes.walletList.walletId,
  renameWalletInput: state.ui.scenes.walletList.renameWalletInput
}))(RenameWalletButtons)

// ///// End of Rename Area ////////
