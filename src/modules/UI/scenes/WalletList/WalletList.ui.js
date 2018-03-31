// @flow

import React, { Component } from 'react'
import { ActivityIndicator, Animated, FlatList, Image, TouchableOpacity, View } from 'react-native'
import { TwoButtonTextModalComponent, StaticModalComponent } from '../../../../components/indexComponents'
import { Actions } from 'react-native-router-flux'
import SortableListView from 'react-native-sortable-listview'
import Ionicon from 'react-native-vector-icons/Ionicons'
import SimplifiedDropdown from '../../components/SimpleDropdown/SimpleDropdown.ui.js'

import WalletIcon from '../../../../assets/images/walletlist/my-wallets.png'
import * as Constants from '../../../../constants/indexConstants.js'
import { intl } from '../../../../locales/intl'
import s from '../../../../locales/strings.js'
import * as UTILS from '../../../utils'
import T from '../../components/FormattedText'
import Gradient from '../../components/Gradient/Gradient.ui'
import styles from './style'
import {TwoButtonModalStyle} from '../../../../styles/indexStyles.js'
import SafeAreaView from '../../components/SafeAreaView/index.js'
import FullWalletListRow from './components/WalletListRow/FullWalletListRowConnector'
import SortableWalletListRow from './components/WalletListRow/SortableWalletListRow.ui.js'
import WalletOptions from './components/WalletOptions/WalletOptionsConnector.ui.js'
import iconImage from '../../../../assets/images/otp/OTP-badge_sm.png'

const DONE_TEXT = s.strings.string_done_cap
const WALLETS_HEADER_TEXT = s.strings.fragment_wallets_header
const ARCHIVED_TEXT = s.strings.fragmet_wallets_list_archive_title_capitalized
const SHOW_BALANCE_TEXT = s.strings.string_show_balance
const BALANCE_TEXT = s.strings.fragment_wallets_balance_text

type State = {
  sortableMode: boolean,
  sortableListOpacity: number,
  fullListOpacity: number,
  sortableListZIndex: number,
  sortableListExists: boolean,
  fullListZIndex: number,
  fullListExists: boolean,
  balanceBoxVisible: boolean,
  showOtpResetModal: boolean,
  showMessageModal: boolean,
  messageModalMessage: ?string,
  isWalletProgressVisible: boolean
}
type Props = {
  activeWalletIds: Array<string>,
  currencyConverter: any,
  customTokens: Array<any>,
  dimensions: any,
  settings: any,
  walletId: string,
  walletName: string,
  wallets: any,
  renameWalletInput: string,
  otpResetPending: boolean,
  updateArchivedWalletsOrder: (Array<string>) => void,
  updateActiveWalletsOrder: (Array<string>) => void,
  walletRowOption: (walletId: string, option: string, archived: boolean) => void,
  disableOtp: () => void,
  keepOtp: () => void,
  progressPercentage: number
}

export default class WalletList extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      sortableMode: false,
      sortableListOpacity: new Animated.Value(0),
      sortableListZIndex: new Animated.Value(0),
      sortableListExists: false,
      fullListOpacity: new Animated.Value(1),
      fullListZIndex: new Animated.Value(100),
      fullListExists: true,
      balanceBoxVisible: true,
      showOtpResetModal: this.props.otpResetPending,
      showMessageModal: false,
      messageModalMessage: null,
      isWalletProgressVisible: true,
      progressPercentage: 0
    }
  }

  componentWillReceiveProps (nextProps: Props) {
    if (nextProps.otpResetPending && nextProps.otpResetPending !== this.props.otpResetPending) {
      this.setState({
        showOtpResetModal: true
      })
    }
  }

  executeWalletRowOption = (walletId: string, option: string) => {
    if (option !== 'sort') {
      return this.props.walletRowOption(walletId, option, this.props.wallets[walletId].archived)
    }
    if (this.state.sortableMode) {
      this.disableSorting()
    } else {
      this.enableSorting()
    }
  }

  render () {
    const { wallets, activeWalletIds, settings } = this.props
    const walletsArray = []
    const activeWallets = {}
    for (const wallet in wallets) {
      const theWallet = wallets[wallet]
      theWallet.key = wallet
      theWallet.executeWalletRowOption = this.executeWalletRowOption
      walletsArray.push(theWallet)
      if (activeWalletIds.includes(wallet)) activeWallets[wallet] = wallets[wallet]
    }

    const activeWalletsArray = activeWalletIds.map(function (x) {
      const tempWalletObj = { key: x }
      return wallets[x] || tempWalletObj
    })

    const activeWalletsObject = {}
    activeWalletIds.forEach(function (x) {
      const tempWalletObj = wallets[x] ? wallets[x] : { key: null }
      activeWalletsObject[x] = tempWalletObj
    })
    let fiatBalanceString
    const fiatSymbol = settings.defaultFiat ? UTILS.getFiatSymbol(settings.defaultFiat) : ''
    if (fiatSymbol.length !== 1) {
      fiatBalanceString = this.tallyUpTotalCrypto() + ' ' + settings.defaultFiat
    } else {
      fiatBalanceString = fiatSymbol + ' ' + this.tallyUpTotalCrypto() + ' ' + settings.defaultFiat
    }

    return (
      <SafeAreaView>
        <View style={styles.container}>
          <WalletOptions />
          <Gradient style={styles.gradient} />
          <TouchableOpacity onPress={this.handleOnBalanceBoxPress}>
            {this.state.isWalletProgressVisible && this.renderWalletListProgressDropdown()}
            {this.state.balanceBoxVisible ? this.balanceBox(fiatBalanceString) : this.hiddenBalanceBox()}
          </TouchableOpacity>

          <View style={[styles.walletsBox]}>
            <Gradient style={[styles.walletsBoxHeaderWrap, UTILS.border()]}>
              <View style={[styles.walletsBoxHeaderTextWrap, UTILS.border()]}>
                <View style={styles.leftArea}>
                  <Image source={WalletIcon} style={[styles.walletIcon]} />
                  <T style={styles.walletsBoxHeaderText}>{WALLETS_HEADER_TEXT}</T>
                </View>
              </View>

              <View style={[styles.donePlusContainer, UTILS.border()]}>
                {this.state.sortableListExists && (
                  <Animated.View
                    style={[
                      styles.doneContainer,
                      UTILS.border(),
                      {
                        opacity: this.state.sortableListOpacity,
                        zIndex: this.state.sortableListZIndex
                      }
                    ]}
                  >
                    <TouchableOpacity style={[styles.walletsBoxDoneTextWrap]} onPress={this.disableSorting}>
                      <T style={[styles.walletsBoxDoneText]}>{DONE_TEXT}</T>
                    </TouchableOpacity>
                  </Animated.View>
                )}
                {this.state.fullListExists && (
                  <Animated.View
                    style={[
                      styles.plusContainer,
                      UTILS.border(),
                      {
                        opacity: this.state.fullListOpacity,
                        zIndex: this.state.fullListZIndex
                      }
                    ]}
                  >
                    <TouchableOpacity style={[styles.walletsBoxHeaderAddWallet, { width: 41 }]} onPress={Actions[Constants.CREATE_WALLET_SELECT_CRYPTO]}>
                      <Ionicon name="md-add" style={[styles.dropdownIcon]} size={28} color="white" />
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </View>
            </Gradient>

            {Object.keys(wallets).length > 0 ? (
              this.renderActiveSortableList(activeWalletsArray, activeWalletsObject)
            ) : (
              <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size={'large'} />
            )}
          </View>
          {this.showModal()}
        </View>
      </SafeAreaView>
    )
  }

  onDismissProgressDropdown = () => {
    this.setState({
      isWalletProgressVisible: false
    })
  }

  renderWalletListProgressDropdown = () => {
    if (this.props.progressPercentage === 100) {
      setTimeout(() => {
        this.setState({
          isWalletProgressVisible: false
        })
      }, 2000)
    }
    const heightOfDropdown = 100 // pixels
    return (
      <SimplifiedDropdown onPress={this.onDismissProgressDropdown} containerHeight={heightOfDropdown} containerStyle={styles.walletListProgressDropdown}>
        <T style={styles.walletListProgressDropdownTopText}>Loading Wallets... {this.props.progressPercentage}%</T>
      </SimplifiedDropdown>
    )
  }

  showModal = () => {
    if (this.state.showOtpResetModal) {
      return <TwoButtonTextModalComponent
        style={TwoButtonModalStyle}
        headerText={s.strings.otp_modal_reset_headline}
        showModal
        middleText={s.strings.otp_modal_reset_description}
        iconImage={iconImage}
        cancelText={s.strings.otp_disable}
        doneText={s.strings.otp_keep}
        onCancel={this.disableOtp}
        onDone={this.keepOtp}
      />
    }
    if (this.state.showMessageModal) {
      return <StaticModalComponent
        cancel={this.cancelStatic}
        body={this.state.messageModalMessage}
        modalDismissTimerSeconds={8} />
    }
    return null
  }
  disableOtp = () => {
    this.props.disableOtp()
    this.setState({
      showMessageModal: true,
      showOtpResetModal: false,
      messageModalMessage: s.strings.otp_disabled_modal
    })
  }

  keepOtp = () => {
    this.props.keepOtp()
    this.setState({
      showOtpResetModal: false
    })
  }

  cancelStatic = () => {
    this.setState({
      showMessageModal: false
    })
  }

  renderActiveSortableList = (activeWalletsArray: any, activeWalletsObject: any) => {
    return (
      <View style={[styles.listsContainer, UTILS.border()]}>
        {this.state.sortableListExists && (
          <Animated.View
            testID={'sortableList'}
            style={[
              UTILS.border(),
              { flex: 1, opacity: this.state.sortableListOpacity, zIndex: this.state.sortableListZIndex },
              styles.sortableList,
              UTILS.border()
            ]}
          >
            <SortableListView
              style={styles.sortableWalletListContainer}
              data={activeWalletsObject}
              order={this.props.activeWalletIds}
              onRowMoved={this.onActiveRowMoved}
              render={ARCHIVED_TEXT}
              renderRow={row => <SortableWalletListRow data={row} dimensions={this.props.dimensions} />}
              executeWalletRowOption={this.executeWalletRowOption}
              dimensions={this.props.dimensions}
            />
          </Animated.View>
        )}
        {this.state.fullListExists && (
          <Animated.View testID={'fullList'} style={[{ flex: 1, opacity: this.state.fullListOpacity, zIndex: this.state.fullListZIndex }, styles.fullList]}>
            <FlatList
              style={styles.sortableWalletListContainer}
              data={activeWalletsArray}
              extraData={this.props.wallets}
              renderItem={item => <FullWalletListRow data={item} settings={this.props.settings} customTokens={this.props.customTokens} />}
              sortableMode={this.state.sortableMode}
              executeWalletRowOption={this.executeWalletRowOption}
              settings={this.props.settings}
            />
          </Animated.View>
        )}
      </View>
    )
  }

  enableSorting = () => {
    // start animation, use callback to setState, then setState's callback to execute 2nd animation
    const sortableToOpacity = 1
    const sortableListToZIndex = 100
    const fullListToOpacity = 0
    const fullListToZIndex = 0

    this.setState({ sortableListExists: true }, () => {
      Animated.parallel([
        Animated.timing(this.state.sortableListOpacity, {
          toValue: sortableToOpacity,
          timing: 300,
          useNativeDriver: false
        }),
        Animated.timing(this.state.sortableListZIndex, {
          toValue: sortableListToZIndex,
          timing: 300
        }),
        Animated.timing(this.state.fullListOpacity, {
          toValue: fullListToOpacity,
          timing: 300,
          useNativeDriver: false
        }),
        Animated.timing(this.state.fullListZIndex, {
          toValue: fullListToZIndex,
          timing: 300
        })
      ]).start(() => {
        this.setState({ fullListExists: false })
      })
    })
  }

  disableSorting = () => {
    const sortableToOpacity = 0
    const sortableListToZIndex = 0
    const fullListToOpacity = 1
    const fullListToZIndex = 100

    this.setState({ fullListExists: true }, () => {
      Animated.parallel([
        Animated.timing(this.state.sortableListOpacity, {
          toValue: sortableToOpacity,
          timing: 300,
          useNativeDriver: false
        }),
        Animated.timing(this.state.sortableListZIndex, {
          toValue: sortableListToZIndex,
          timing: 300
        }),
        Animated.timing(this.state.fullListOpacity, {
          toValue: fullListToOpacity,
          timing: 300,
          useNativeDriver: false
        }),
        Animated.timing(this.state.fullListZIndex, {
          toValue: fullListToZIndex,
          timing: 300
        })
      ]).start(() => {
        this.setState({ sortableListExists: false })
      })
    })
  }

  renderArchivedSortableList = (data: any, order: any, label: any, renderRow: any) => {
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

  sortActiveWallets = (wallets: any) => {
    const activeOrdered = Object.keys(wallets)
      .filter(key => !wallets[key].archived) // filter out archived wallets
      .sort((a, b) => {
        if (wallets[a].sortIndex === wallets[b].sortIndex) {
          return -1
        } else {
          return wallets[a].sortIndex - wallets[b].sortIndex
        }
      }) // sort them according to their (previous) sortIndices
    return activeOrdered
  }

  onActiveRowMoved = (action: any) => {
    const newOrder = this.getNewOrder(this.props.activeWalletIds, action) // pass the old order to getNewOrder with the action ( from, to, and  )

    this.props.updateActiveWalletsOrder(newOrder)
    this.forceUpdate()
  }

  onArchivedRowMoved = (action: any) => {
    const wallets = this.props.wallets
    const activeOrderedWallets = Object.keys(wallets)
      .filter(key => wallets[key].archived)
      .sort((a, b) => wallets[a].sortIndex - wallets[b].sortIndex)
    const order = activeOrderedWallets
    const newOrder = this.getNewOrder(order, action)

    this.props.updateArchivedWalletsOrder(newOrder)
    this.forceUpdate()
  }

  getNewOrder = (order: any, action: any) => {
    const { to, from } = action
    const newOrder = [].concat(order)
    newOrder.splice(to, 0, newOrder.splice(from, 1)[0])

    return newOrder
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
          let denominations
          if (this.props.settings[balanceProp]) {
            denominations = this.props.settings[balanceProp].denominations
          } else {
            const tokenInfo = this.props.settings.customTokens.find(token => token.currencyCode === balanceProp)
            denominations = tokenInfo.denominations
          }
          const exchangeDenomination = denominations.find(denomination => denomination.name === balanceProp)
          const nativeToExchangeRatio: string = exchangeDenomination.multiplier

          const cryptoAmount: number = parseFloat(UTILS.convertNativeToExchange(nativeToExchangeRatio)(nativeBalance))
          temporaryTotalCrypto[balanceProp] = temporaryTotalCrypto[balanceProp] + cryptoAmount
        }
      }
    }
    const totalBalance = this.calculateTotalBalance(temporaryTotalCrypto)
    return totalBalance
  }

  calculateTotalBalance = (values: any) => {
    let total = 0
    for (const currency in values) {
      const addValue = this.props.currencyConverter.convertCurrency(currency, 'iso:' + this.props.settings.defaultFiat, values[currency])
      total = total + addValue
    }
    return intl.formatNumber(total, { toFixed: 2 })
  }

  handleOnBalanceBoxPress = () => this.setState({ balanceBoxVisible: !this.state.balanceBoxVisible })
  balanceBox (fiatBalanceString: string) {
    return (
      <View style={[styles.totalBalanceBox]}>
        <View style={[styles.totalBalanceWrap]}>
          <View style={[styles.totalBalanceHeader]}>
            <T style={[styles.totalBalanceText]}>{BALANCE_TEXT}</T>
          </View>
          <View style={[styles.currentBalanceBoxDollarsWrap]}>
            <T style={[styles.currentBalanceBoxDollars]}>{fiatBalanceString}</T>
          </View>
        </View>
      </View>
    )
  }

  hiddenBalanceBox () {
    return (
      <View style={[styles.totalBalanceBox]}>
        <View style={[styles.totalBalanceWrap]}>
          <View style={[styles.hiddenBalanceBoxDollarsWrap]}>
            <T style={[styles.currentBalanceBoxDollars]}>{SHOW_BALANCE_TEXT}</T>
          </View>
        </View>
      </View>
    )
  }
}
