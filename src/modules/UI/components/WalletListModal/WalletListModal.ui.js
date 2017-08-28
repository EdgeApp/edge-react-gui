// @flow
import React, { Component } from 'react'
import { View, TouchableHighlight, LayoutAnimation, ScrollView, TouchableOpacity } from 'react-native'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import PropTypes from 'prop-types'
import T from '../../components/FormattedText'
import { connect } from 'react-redux'
import Ionicon from 'react-native-vector-icons/Ionicons'
import styles from './style'
import {
  toggleScanToWalletListModal,
  disableWalletListModalVisibility
} from './action'
import * as UI_ACTIONS from '../../Wallets/action.js'
import {getTransactionsRequest} from '../../../UI/scenes/TransactionList/action.js'
import * as Animatable from 'react-native-animatable'
import {border as b, cutOffText} from '../../../utils'
import * as UI_SELECTORS from '../../selectors.js'
import {updateReceiveAddress} from '../../scenes/Request/action.js'
import { bns } from 'biggystring'

class WalletListModal extends Component {
  constructor (props) {
    super(props)
    if (!this.props.topDisplacement) {
      this.props.topDisplacement = 68
    }
  }

  render () {
    return (
      <Animatable.View style={[b(), styles.topLevel, {position: 'absolute', top: 38, height: (this.props.dimensions.deviceDimensions.height - this.props.dimensions.headerHeight - this.props.dimensions.tabBarHeight)}]}
        animation='fadeInDown'
        duration={100} >
        <ScrollView>
          <WalletListModalHeaderConnect type={this.props.type} />
          <WalletListModalBodyConnect onPress={this.props.onPress}
            selectionFunction={this.props.selectionFunction} style={{flex: 1}} />
        </ScrollView>
      </Animatable.View>
    )
  }
}

WalletListModal.propTypes = {
  dropdownWalletListVisible: PropTypes.bool,
  currentScene: PropTypes.string,
  dimensions: PropTypes.object
}
const mapStateToProps = state => ({
  walletList: state.ui.wallets.byId,
  dropdownWalletListVisible: state.ui.scenes.walletListModal.walletListModalVisible,
  walletTransferModalVisible: state.ui.scenes.walletTransferList.walletListModalVisible,
  scanToWalletListModalVisibility: state.ui.scenes.scan.scanToWalletListModalVisibility,
  dimensions: state.ui.scenes.dimensions
})
export const WalletListModalConnect = connect(mapStateToProps)(WalletListModal)

class WalletListModalBody extends Component {
  selectFromWallet = (id, currencyCode = null) => {
    console.log('currencyCode', currencyCode)
    LayoutAnimation.easeInEaseOut()
    this.props.disableWalletListModalVisibility()
  }

  selectToWallet = (idx, currencyCode = null) => {
    console.log('currencyCode', currencyCode)
    LayoutAnimation.easeInEaseOut()
    this.props.disableWalletListModalVisibility()
  }

  renderTokens = (walletId, metaTokenBalances, code) => {
    var tokens = []
    for (var property in metaTokenBalances) {
      if (property !== code) {
        tokens.push(this.renderTokenRowContent(walletId, property, metaTokenBalances[property]))
      }
    }
    return tokens
  }

  renderTokenRowContent = (parentId, currencyCode, balance) => {
    let multiplier = this.props.walletList[parentId].allDenominations[currencyCode][this.props.settings[currencyCode].denomination].multiplier
    let cryptoAmount = bns.divf(balance, multiplier)

    return (
      <TouchableOpacity style={[styles.tokenRowContainer]}
        key={currencyCode} onPress={() => {
          this.props.getTransactions(parentId, currencyCode)
          this.props.disableWalletListModalVisibility()
          this.props.selectWallet(parentId, currencyCode)
          this.props.updateReceiveAddress(parentId, currencyCode)
        }}>
        <View style={[styles.currencyRowContent]}>
          <View style={[styles.currencyRowNameTextWrap]}>
            <T style={[styles.currencyRowText]}>{currencyCode}</T>
          </View>
          <View style={[styles.currencyRowBalanceTextWrap]}>
            <T style={[styles.currencyRowText]}>{ cryptoAmount }</T>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  renderWalletRow = (guiWallet, i) => {
    let multiplier = guiWallet.allDenominations[guiWallet.currencyCode][this.props.settings[guiWallet.currencyCode].denomination].multiplier
    let symbol = guiWallet.allDenominations[guiWallet.currencyCode][multiplier].symbol
    let denomAmount = bns.divf(guiWallet.primaryNativeBalance, multiplier)

    return (
      <View key={i}>
        <TouchableOpacity style={[styles.rowContainer]}
          onPress={() => {
            this.props.getTransactions(guiWallet.id, guiWallet.currencyCode)
            this.props.disableWalletListModalVisibility()
            this.props.selectWallet(guiWallet.id, guiWallet.currencyCode)
            this.props.updateReceiveAddress(guiWallet.id, guiWallet.currencyCode)
          }}>
          <View style={[styles.currencyRowContent]}>
            <View style={[styles.currencyRowNameTextWrap]}>
              <T style={[styles.currencyRowText]}>{cutOffText(guiWallet.name, 34)}</T>
            </View>
            <View style={[styles.rowBalanceTextWrap]}>
              <T style={[styles.currencyRowText]}>{symbol || ''} { denomAmount }</T>
            </View>
          </View>
        </TouchableOpacity>

        {this.renderTokens(guiWallet.id, guiWallet.nativeBalances, guiWallet.currencyCode)}
      </View>
    )
  }

  renderWalletRows () {
    let i = -1
    let rows = []
    for (const n in this.props.walletList) {
      i++
      const guiWallet = this.props.walletList[n]
      if (typeof guiWallet.id !== 'undefined' && this.props.activeWalletIds.includes(guiWallet.id)) {
        rows.push(this.renderWalletRow(guiWallet, i))
      }
    }
    return rows
  }

  render () {
    console.log('rendering dropdown', this.props.selectedWalletId)
    return (
      <View>{ this.renderWalletRows() }</View>
    )
  }
}

WalletListModalBody.propTypes = {
  selectionFunction: PropTypes.string
}

export const WalletListModalBodyConnect = connect(
  (state) => {
    return {
      walletList: state.ui.wallets.byId,
      activeWalletIds: state.ui.wallets.activeWalletIds,
      selectedWalletId: UI_SELECTORS.getSelectedWalletId(state),
      settings: state.ui.settings
    }
  },
  dispatch => ({
    selectWallet: (walletId, currencyCode) => dispatch(UI_ACTIONS.selectWallet(walletId, currencyCode)),
    getTransactions: (walletId, currencyCode) => dispatch(getTransactionsRequest(walletId, currencyCode)),
    disableWalletListModalVisibility: () => dispatch(disableWalletListModalVisibility()),
    toggleSelectedWalletListModal: () => dispatch(toggleScanToWalletListModal()),
    toggleScanToWalletListModal: () => dispatch(toggleScanToWalletListModal()),
    updateReceiveAddress: (walletId, currencyCode) => dispatch(updateReceiveAddress(walletId, currencyCode))
  }))(WalletListModalBody)

class WalletListModalHeader extends Component {
  constructor (props) {
    super(props)
    this.props.type = 'from'
  }

  _onSearchExit = () => {
    this.props.dispatch(disableWalletListModalVisibility())
  }

  render () {
    let headerSyntax = (this.props.type === 'from') ? 'fragment_select_wallet_header_title' : 'fragment_send_other_wallet_header_title'
    return (
      <View style={[styles.rowContainer, styles.headerContainer]}>
        <View style={[styles.headerContent, b()]}>
          <View style={[styles.headerTextWrap, b()]}>
            <T style={[styles.headerText, {color: 'white'}, b()]}>
              {sprintf(strings.enUS[headerSyntax])}
            </T>
          </View>
          <TouchableHighlight style={[styles.modalCloseWrap, b()]}
            onPress={this._onSearchExit}>
            <Ionicon style={[styles.donebutton, b()]}
              name='ios-close'
              size={26}
              color='white'
            />
          </TouchableHighlight>
        </View>
      </View>
    )
  }
}

WalletListModalHeader.propTypes = {
  type: PropTypes.string
}

export const WalletListModalHeaderConnect = connect()(WalletListModalHeader)
