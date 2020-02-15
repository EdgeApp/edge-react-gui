// @flow

import { createYesNoModal } from 'edge-components'
import React, { Component } from 'react'
import { ActivityIndicator, Alert, Animated, FlatList, Image, Linking, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import slowlog from 'react-native-slowlog'
import SortableListView from 'react-native-sortable-listview'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import Ionicon from 'react-native-vector-icons/Ionicons'

import iconImage from '../../assets/images/otp/OTP-badge_sm.png'
import WalletIcon from '../../assets/images/walletlist/my-wallets.png'
import WalletOptions from '../../connectors/WalletOptionsConnector.js'
import * as Constants from '../../constants/indexConstants.js'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { getDefaultIsoFiat, getIsAccountBalanceVisible } from '../../modules/Settings/selectors.js'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui.js'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index.js'
import { WiredProgressBar } from '../../modules/UI/components/WiredProgressBar/WiredProgressBar.ui.js'
import { getWalletLoadingPercent } from '../../modules/UI/selectors.js'
import { addWalletStyle } from '../../styles/components/AddWalletStyle.js'
import { buyMultipleCryptoStyle } from '../../styles/components/BuyCryptoStyle.js'
import { TwoButtonModalStyle } from '../../styles/indexStyles.js'
import styles from '../../styles/scenes/WalletListStyle'
import THEME from '../../theme/variables/airbitz'
import { type AppMessage, type AppTweaks, getActiveMessage } from '../../types/AppTweaks.js'
import type { GuiWalletType } from '../../types/types.js'
import { type DeviceDimensions } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { getObjectDiff, getTotalFiatAmountFromExchangeRates } from '../../util/utils'
import FullWalletListRow from '../common/FullWalletListRow.js'
import { launchModal } from '../common/ModalProvider.js'
import SortableWalletListRow from '../common/SortableWalletListRow.js'
import { WiredBalanceBox } from '../common/WiredBalanceBox.js'
import { StaticModalComponent, TwoButtonTextModalComponent } from '../indexComponents'

const DONE_TEXT = s.strings.string_done_cap
const WALLETS_HEADER_TEXT = s.strings.fragment_wallets_header
const ARCHIVED_TEXT = s.strings.fragmet_wallets_list_archive_title_capitalized

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
  isWalletProgressVisible: boolean,
  messageModalMessage: ?string
}
type Props = {
  activeWalletIds: Array<string>,
  creationTweaks: AppTweaks,
  customTokens: Array<any>,
  dimensions: DeviceDimensions,
  wallets: any,
  renameWalletInput: string,
  otpResetPending: boolean,
  updateArchivedWalletsOrder: (Array<string>) => void,
  updateActiveWalletsOrder: (Array<string>) => void,
  walletRowOption: (walletId: string, option: string, archived: boolean) => void,
  disableOtp: () => void,
  keepOtp: () => void,
  removeCreationMessage(message: AppMessage): void,
  toggleAccountBalanceVisibility: () => void,
  isAccountBalanceVisible: boolean,
  ethereumWalletType?: GuiWalletType,
  exchangeRates: Object
}
export default class WalletList extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
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
      isWalletProgressVisible: true
    }
  }

  shouldComponentUpdate (nextProps: Props, nextState: State) {
    let traverseObjects, ignoreObjects
    if (this.state.sortableListExists) {
      traverseObjects = { dimensions: true }
      ignoreObjects = undefined
    } else {
      traverseObjects = undefined
      ignoreObjects = { dimensions: true }
    }

    let diffElement2: string = ''
    const diffElement = getObjectDiff(this.props, nextProps, {
      traverseObjects,
      ignoreObjects
    })
    if (!diffElement) {
      diffElement2 = getObjectDiff(this.state, nextState)
    }
    return !!diffElement || !!diffElement2
  }

  UNSAFE_componentWillReceiveProps (nextProps: Props) {
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
    const { wallets, activeWalletIds } = this.props
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

    return (
      <SafeAreaView>
        <View style={styles.container}>
          <WalletOptions />
          <Gradient style={styles.gradient} />
          <WiredProgressBar progress={getWalletLoadingPercent} />
          <WiredBalanceBox
            showBalance={getIsAccountBalanceVisible}
            fiatAmount={getTotalFiatAmountFromExchangeRates}
            isoFiatCurrencyCode={getDefaultIsoFiat}
            onPress={this.props.toggleAccountBalanceVisibility}
            exchangeRates={this.props.exchangeRates}
          />
          <View style={[styles.walletsBox]}>
            <Gradient style={[styles.walletsBoxHeaderWrap]}>
              <View style={[styles.walletsBoxHeaderTextWrap]}>
                <View style={styles.leftArea}>
                  <Image source={WalletIcon} style={[styles.walletIcon]} />
                  <T style={styles.walletsBoxHeaderText}>{WALLETS_HEADER_TEXT}</T>
                </View>
              </View>

              <View style={[styles.donePlusContainer, this.state.sortableListExists && styles.donePlusSortable]}>
                {this.state.sortableListExists && (
                  <Animated.View
                    style={[
                      styles.doneContainer,
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
                      {
                        opacity: this.state.fullListOpacity,
                        zIndex: this.state.fullListZIndex
                      }
                    ]}
                  >
                    <View style={styles.plusSpacer} />
                    <TouchableOpacity style={[styles.walletsBoxHeaderAddWallet]} onPress={Actions[Constants.CREATE_WALLET_SELECT_CRYPTO]}>
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
          {this.launchModal()}
        </View>
      </SafeAreaView>
    )
  }

  launchModal = () => {
    if (this.state.showOtpResetModal) {
      return (
        <TwoButtonTextModalComponent
          style={TwoButtonModalStyle}
          headerText={s.strings.otp_modal_reset_headline}
          launchModal
          middleText={s.strings.otp_modal_reset_description}
          iconImage={iconImage}
          cancelText={s.strings.otp_disable}
          doneText={s.strings.otp_keep}
          onCancel={this.disableOtp}
          onDone={this.keepOtp}
        />
      )
    }
    if (this.state.showMessageModal && this.state.messageModalMessage != null) {
      return <StaticModalComponent cancel={this.cancelStatic} body={this.state.messageModalMessage} modalDismissTimerSeconds={8} isVisible />
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

  renderRow = (row: Object) => {
    return <SortableWalletListRow data={row} showBalance={getIsAccountBalanceVisible} dimensions={this.props.dimensions} />
  }

  renderItem = (item: Object) => {
    return <FullWalletListRow data={item} showBalance={getIsAccountBalanceVisible} customTokens={this.props.customTokens} />
  }

  renderActiveSortableList = (activeWalletsArray: Array<{ key: string }>, activeWalletsObject: {}) => {
    return (
      <View style={styles.listsContainer}>
        {this.state.sortableListExists && (
          <Animated.View
            testID={'sortableList'}
            style={[{ flex: 1, opacity: this.state.sortableListOpacity, zIndex: this.state.sortableListZIndex }, styles.sortableList]}
          >
            <SortableListView
              style={styles.sortableWalletListContainer}
              data={activeWalletsObject}
              order={this.props.activeWalletIds}
              onRowMoved={this.onActiveRowMoved}
              render={ARCHIVED_TEXT}
              renderRow={this.renderRow}
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
              renderItem={this.renderItem}
              sortableMode={this.state.sortableMode}
              executeWalletRowOption={this.executeWalletRowOption}
              ListFooterComponent={this.renderFooter()}
              ListHeaderComponent={this.renderPromoCard()}
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

  sortActiveWallets = (wallets: any): Array<string> => {
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
    const newOrder = [...order]
    newOrder.splice(to, 0, newOrder.splice(from, 1)[0])

    return newOrder
  }

  addToken = async () => {
    const { wallets, ethereumWalletType } = this.props
    let tokenEnabledWallets = 0

    // count number of token-enabled wallets
    for (const key in wallets) {
      const wallet = wallets[key]
      const specialCurrencyInfo = getSpecialCurrencyInfo(wallet.currencyCode)
      if (specialCurrencyInfo.isCustomTokensSupported) {
        tokenEnabledWallets++
      }
    }

    // check for existence of any token-enabled wallets
    if (tokenEnabledWallets > 0) {
      for (const key in wallets) {
        const wallet = wallets[key]
        const specialCurrencyInfo = getSpecialCurrencyInfo(wallet.currencyCode)
        if (specialCurrencyInfo.isCustomTokensSupported) {
          return this.props.walletRowOption(wallet.id, 'manageTokens', wallet.archived)
        }
      }
    }

    // if no token-enabled wallets then allow creation of token-enabled wallet
    if (tokenEnabledWallets === 0) {
      const modal = createYesNoModal({
        title: s.strings.wallet_list_add_token_modal_title,
        message: s.strings.wallet_list_add_token_modal_message,
        icon: <Icon type={Constants.ION_ICONS} name={Constants.WALLET_ICON} size={30} />,
        noButtonText: s.strings.string_cancel_cap,
        yesButtonText: s.strings.title_create_wallet
      })

      if (ethereumWalletType) {
        return (await launchModal(modal)) ? Actions[Constants.CREATE_WALLET_SELECT_FIAT]({ selectedWalletType: ethereumWalletType }) : null
      } else {
        return Alert.alert(s.strings.create_wallet_invalid_input, s.strings.create_wallet_select_valid_crypto)
      }
    }
  }

  renderFooter = () => {
    return (
      <View style={buyMultipleCryptoStyle.multipleCallToActionWrap}>
        <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
          <TouchableWithoutFeedback onPress={Actions[Constants.CREATE_WALLET_SELECT_CRYPTO]} style={addWalletStyle.addWalletButton}>
            <View style={addWalletStyle.addWalletContentWrap}>
              <Ionicon name="md-add-circle" style={addWalletStyle.addWalletIcon} size={scale(24)} color={THEME.COLORS.GRAY_2} />
              <T style={addWalletStyle.addWalletText}>{s.strings.wallet_list_add_wallet}</T>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={this.addToken} style={addWalletStyle.addWalletButton}>
            <View style={addWalletStyle.addTokenContentWrap}>
              <Ionicon name="md-add-circle" style={addWalletStyle.addWalletIcon} size={scale(24)} color={THEME.COLORS.GRAY_2} />
              <T style={addWalletStyle.addWalletText}>{s.strings.wallet_list_add_token}</T>
            </View>
          </TouchableWithoutFeedback>
        </View>
        <TouchableWithoutFeedback onPress={Actions[Constants.PLUGIN_BUY]} style={buyMultipleCryptoStyle.buyMultipleCryptoContainer}>
          <View style={buyMultipleCryptoStyle.buyMultipleCryptoBox}>
            <View style={buyMultipleCryptoStyle.buyMultipleCryptoContentWrap}>
              <Image style={buyMultipleCryptoStyle.buyMultipleCryptoBoxImage} source={{ uri: Constants.CURRENCY_SYMBOL_IMAGES['BTC'] }} resizeMode={'cover'} />
              <Image style={buyMultipleCryptoStyle.buyMultipleCryptoBoxImage} source={{ uri: Constants.CURRENCY_SYMBOL_IMAGES['ETH'] }} resizeMode={'cover'} />
              <Image style={buyMultipleCryptoStyle.buyMultipleCryptoBoxImage} source={{ uri: Constants.CURRENCY_SYMBOL_IMAGES['BCH'] }} resizeMode={'cover'} />
            </View>
            <T style={buyMultipleCryptoStyle.buyMultipleCryptoBoxText}>{s.strings.title_plugin_buy}</T>
          </View>
        </TouchableWithoutFeedback>
      </View>
    )
  }

  renderPromoCard () {
    const { creationTweaks, removeCreationMessage } = this.props
    const message = getActiveMessage(creationTweaks)
    if (message == null) return null

    const { uri, iconUri } = message
    function handlePress () {
      if (uri != null) Linking.openURL(uri)
    }
    function handleClose () {
      removeCreationMessage(message)
    }

    return (
      <View style={styles.promoArea}>
        <TouchableOpacity onPress={handlePress}>
          <View style={styles.promoCard}>
            {iconUri != null ? <Image resizeMode="contain" source={{ uri: iconUri }} style={styles.promoIcon} /> : null}
            <Text style={styles.promoText}>{message.message}</Text>
            <TouchableOpacity onPress={handleClose}>
              <AntDesignIcon name="close" color={THEME.COLORS.GRAY_2} size={THEME.rem(1)} style={styles.promoClose} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    )
  }
}
