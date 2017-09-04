// @flow
import React, {Component} from 'react'
import {
  TextInput,
  View,
  TouchableHighlight,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  FlatList
} from 'react-native'
// $FlowFixMe: suppressing this error until we can find a workaround
import Permissions from 'react-native-permissions'
import Contacts from 'react-native-contacts'
import {setContactList} from '../../contacts/action'
import T from '../../components/FormattedText'
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
import {
  FullWalletListRowConnect as FullWalletListRow,
  SortableWalletListRowConnect as SortableWalletListRow
} from './WalletListRow.ui'
import { options } from './WalletListRowOptions.ui.js'
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
import {colors as c} from '../../../../theme/variables/airbitz.js'
import StylizedModal from '../../components/Modal/Modal.ui'
import * as UI_SELECTORS from '../../selectors.js'
import * as SETTINGS_SELECTORS from '../../Settings/selectors'
import * as UTILS from '../../../utils'

class WalletList extends Component {
  state: { sortableMode: boolean , sortableListOpacity: number, fullListOpacity: number}

  constructor(props) {
    super(props)
    this.state = {
      sortableMode: false,
      sortableListOpacity: new Animated.Value(0),
      fullListOpacity: new Animated.Value(1)
    }
    console.log('end of walletList constructor, this.state is: ', this.state)
  }

  toggleArchiveDropdown = () => {
    this.props.dispatch(toggleArchiveVisibility())
  }

  componentDidMount () {
    console.log('in WalletList->componentDidMount')
    Permissions.request('contacts').then((response) => {
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

  executeWalletRowOption = (walletId, option) => {
    console.log('in executeWalletRowOption, option is: ', option)
    switch (option) {
    case options[0].value: // 'rename'
      console.log('executing rename')
      break
    case options[1].value: // 'sort'
      if (this.state.sortableMode) {
        this.disableSorting()
      } else {
        this.enableSorting()
      }
      break
    case options[2].value: // 'addToken'
      console.log('executing addToken')
      break
    case options[3].value: // 'archive'
      console.log('executing archive / restore')
      break
    case options[4].value: // 'delete
      console.log('executing delete')
      break
    }
  }

  render () {
    console.log('beginning of walletList render, this.state is: ', this.state)
    console.log('entering walletList render, this.props.wallets is: ', this.props.wallets)
    const {wallets} = this.props
    let walletsArray = []
    for (var wallet in wallets) {
      let theWallet = wallets[wallet]
      theWallet.key = wallet
      theWallet.executeWalletRowOption = this.executeWalletRowOption
      walletsArray.push(theWallet)
      console.log('walletsArray is now: ', walletsArray)      
    }    
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
              </T>
            </View>
          </View>
        </View>

        <View style={styles.walletsBox}>
          <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[styles.walletsBoxHeaderWrap]} colors={[c.gradient.light, c.gradient.dark]}>
            <View style={[styles.walletsBoxHeaderTextWrap]}>
              <View style={styles.leftArea}>
                <SimpleLineIcons name='wallet' style={[styles.walletIcon]} color='white' />
                <T style={styles.walletsBoxHeaderText}>
                  {sprintf(strings.enUS['fragment_wallets_header'])}
                </T>
              </View>
            </View>

              {this.state.sortableMode ? (
                <Animated.View style={[{opacity: this.state.sortableListOpacity}]}>
                  <TouchableOpacity style={[{}]} onPress={() => this.disableSorting()}>
                    <T style={[styles.walletsBoxDoneText]}>{sprintf(strings.enUS['string_done_cap'])}</T>
                  </TouchableOpacity>
                </Animated.View>
                ) : (
                <Animated.View style={[{opacity: this.state.fullListOpacity}]}>
                  <TouchableOpacity style={[styles.walletsBoxHeaderAddWallet, {width: 35}]}
                    onPress={() => Actions.createWallet()}>                  
                      <Ionicon name='md-add' style={[styles.dropdownIcon]} color='white' />
                  </TouchableOpacity>
                </Animated.View>
              )}
          </LinearGradient>
          {Object.keys(wallets).length > 0 ? this.renderActiveSortableList(walletsArray) : <ActivityIndicator style={{flex: 1, alignSelf: 'center'}} size={'large'} />}
        </View>
      </View>
    )
  }

  renderActiveSortableList = (walletsArray) => {
    if(this.state.sortableMode) {
      return (
        <Animated.View style={[{flex: 1, opacity: this.state.sortableListOpacity}]}>
          <SortableListView
            style={{ flex: 1}}
            data={this.props.wallets}
            order={this.sortActiveWallets(this.props.wallets)}
            onRowMoved={this.onActiveRowMoved}
            render={sprintf(strings.enUS['fragmet_wallets_list_archive_title_capitalized'])}
            renderRow={this.renderActiveRow /*, this.onActiveRowMoved*/}
            sortableMode={this.state.sortableMode}
            executeWalletRowOption={this.executeWalletRowOption}
            activeOpacity={0.6}
          />
        </Animated.View>
      )} else {
      return (
        <Animated.View style={[{flex: 1, opacity: this.state.fullListOpacity}]}>
          <FlatList
            style={{ flex: 1}}          
            data={walletsArray}
            extraData={this.props.wallets}
            renderItem={(item) => <FullWalletListRow data={item} />}
            sortableMode={this.state.sortableMode}
            executeWalletRowOption={this.executeWalletRowOption}
          />
        </Animated.View>
      )
    }
  }

  renderActiveRow = (row) => {
    console.log('executing renderActiveRow, row is: ', row)
    return <SortableWalletListRow data={row} />
  }

  enableSorting = () => {
    // start animation, use callback to setState, then setState's callback to execute 2nd animation
    let sortableToOpacity = 1
    let fullListToOpacity = 0

    Animated.timing(
      this.state.fullListOpacity,
      {
        toValue: fullListToOpacity,
        timing: 50
      }
    ).start(() => this.setState({sortableMode: true}, () => {
      Animated.timing(
        this.state.sortableListOpacity,
        {
          toValue: sortableToOpacity,
          duration: 50
        }
      ).start()
    }))
  }

  disableSorting = () => {
    let sortableToOpacity = 0
    let fullListToOpacity = 1  
    Animated.timing(
      this.state.sortableListOpacity,
      {
        toValue: sortableToOpacity,
        timing: 50
      }
    ).start(() => this.setState({sortableMode: false}, () => {
      Animated.timing(
        this.state.fullListOpacity,
        {
          toValue: fullListToOpacity,
          duration: 50
        }
      ).start()
    }))  
  }

  renderArchivedSortableList = (data, order, label, renderRow) => {
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
          const denominations = this.props.settings[balanceProp].denominations
          const exchangeDenomination = denominations.find(denomination => {
            return denomination.name === balanceProp
          })
          const nativeToExchangeRatio:string = exchangeDenomination.multiplier

          const cryptoAmount:number = parseFloat(UTILS.convertNativeToExchange(nativeToExchangeRatio)(nativeBalance))
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

const mapStateToProps = (state) => {
  const currencyConverter = CORE_SELECTORS.getCurrencyConverter(state)
  const settings = SETTINGS_SELECTORS.getSettings(state)

  return {
    // updatingBalance: state.ui.scenes.transactionList.updatingBalance,
    settings,
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
export const DeleteWalletButtonsConnect = connect()(DeleteWalletButtons)

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