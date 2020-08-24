// @flow

import * as React from 'react'
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import slowlog from 'react-native-slowlog'
import SortableListView from 'react-native-sortable-listview'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import { hideMessageTweak } from '../../actions/AccountReferralActions.js'
import { disableOtp, keepOtp } from '../../actions/OtpActions.js'
import { linkReferralWithCurrencies, toggleAccountBalanceVisibility, updateActiveWalletsOrder } from '../../actions/WalletListActions.js'
import { type WalletListMenuKey, walletListMenuAction } from '../../actions/WalletListMenuActions.js'
import otpIcon from '../../assets/images/otp/OTP-badge_sm.png'
import WalletIcon from '../../assets/images/walletlist/my-wallets.png'
import { Fontello } from '../../assets/vector/index.js'
import XPubModal from '../../connectors/XPubModalConnector.js'
import * as Constants from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { getDefaultIsoFiat, getIsAccountBalanceVisible, getOtpResetPending } from '../../modules/Settings/selectors.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { WiredProgressBar } from '../../modules/UI/components/WiredProgressBar/WiredProgressBar.ui.js'
import { getActiveWalletIds, getWalletLoadingPercent } from '../../modules/UI/selectors.js'
import { dayText, nightText } from '../../styles/common/textStyles.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import { type AccountReferral } from '../../types/ReferralTypes.js'
import { type MessageTweak } from '../../types/TweakTypes.js'
import { type FlatListItem, type GuiWallet } from '../../types/types.js'
import { type TweakSource, bestOfMessages } from '../../util/ReferralHelpers.js'
import { getTotalFiatAmountFromExchangeRates } from '../../util/utils.js'
import { CrossFade } from '../common/CrossFade.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { WalletListEmptyRow } from '../common/WalletListEmptyRow.js'
import { WalletListFooter } from '../common/WalletListFooter.js'
import { WalletListRow } from '../common/WalletListRow.js'
import { WalletListSortableRow } from '../common/WalletListSortableRow.js'
import { WiredBalanceBox } from '../common/WiredBalanceBox.js'
import { TwoButtonSimpleConfirmationModal } from '../modals/TwoButtonSimpleConfirmationModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow.js'

type StateProps = {
  accountMessages: MessageTweak[],
  accountReferral: AccountReferral,
  activeWalletIds: Array<string>,
  exchangeRates: Object,
  otpResetPending: boolean,
  wallets: { [walletId: string]: GuiWallet }
}
type DispatchProps = {
  hideMessageTweak(messageId: string, source: TweakSource): void,
  toggleAccountBalanceVisibility(): void,
  updateActiveWalletsOrder(walletIds: Array<string>): void,
  walletRowOption(walletId: string, option: WalletListMenuKey, currencyCode?: string): void,
  disableOtp(): void,
  keepOtp(): void,
  linkReferralWithCurrencies(string): void
}
type Props = StateProps & DispatchProps

type State = {
  sorting: boolean
}

class WalletListComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
    this.state = {
      sorting: false
    }
  }

  componentDidMount() {
    this.checkOtpResetPendingModal()
  }

  checkOtpResetPendingModal = async () => {
    if (this.props.otpResetPending) {
      const resolved = await Airship.show(bridge => (
        <TwoButtonSimpleConfirmationModal
          bridge={bridge}
          icon={<Image source={otpIcon} />}
          title={s.strings.otp_modal_reset_headline}
          subTitle={s.strings.otp_modal_reset_description}
          cancelText={s.strings.request_review_answer_no}
          doneText={s.strings.request_review_answer_yes}
        />
      ))
      resolved ? this.props.keepOtp() : this.props.disableOtp()
    }
  }

  executeWalletRowOption = (walletId: string, option: WalletListMenuKey, currencyCode?: string) => {
    if (currencyCode == null && this.props.wallets[walletId] != null) {
      currencyCode = this.props.wallets[walletId].currencyCode
    }
    return this.props.walletRowOption(walletId, option, currencyCode)
  }

  render() {
    const { wallets, activeWalletIds } = this.props
    const { sorting } = this.state
    const loading = Object.keys(wallets).length <= 0

    const walletIcon = <Image source={WalletIcon} style={styles.walletIcon} />
    const sort = () => this.setState({ sorting: true })

    return (
      <SceneWrapper background="body">
        <WiredProgressBar progress={getWalletLoadingPercent} />
        <WiredBalanceBox
          showBalance={getIsAccountBalanceVisible}
          fiatAmount={getTotalFiatAmountFromExchangeRates}
          isoFiatCurrencyCode={getDefaultIsoFiat}
          onPress={this.props.toggleAccountBalanceVisibility}
          exchangeRates={this.props.exchangeRates}
        />
        <View /* header stack */>
          <SettingsHeaderRow icon={walletIcon} text={s.strings.fragment_wallets_header} />
          <CrossFade activeKey={sorting ? 'doneButton' : 'defaultButtons'}>
            <View key="defaultButtons" style={[styles.headerButton, styles.defaultButtons]}>
              <TouchableOpacity style={styles.addButton} onPress={Actions[Constants.CREATE_WALLET_SELECT_CRYPTO]}>
                <Ionicon name="md-add" size={THEME.rem(1.75)} color={THEME.COLORS.WHITE} />
              </TouchableOpacity>
              <TouchableOpacity onPress={sort}>
                <Fontello name="sort" size={THEME.rem(1.75)} color={THEME.COLORS.WHITE} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity key="doneButton" style={styles.headerButton} onPress={this.disableSorting}>
              <T style={nightText()}>{s.strings.string_done_cap}</T>
            </TouchableOpacity>
          </CrossFade>
        </View>
        <View style={styles.listStack}>
          <CrossFade activeKey={loading ? 'spinner' : sorting ? 'sortList' : 'fullList'}>
            <ActivityIndicator key="spinner" style={styles.listSpinner} size="large" />
            <FlatList
              key="fullList"
              style={StyleSheet.absoltueFill}
              data={activeWalletIds.map(key => ({ key }))}
              extraData={wallets}
              renderItem={this.renderRow}
              ListFooterComponent={WalletListFooter}
              ListHeaderComponent={this.renderPromoCard()}
            />
            <SortableListView
              key="sortList"
              style={StyleSheet.absoltueFill}
              data={wallets}
              order={this.props.activeWalletIds}
              onRowMoved={this.onActiveRowMoved}
              renderRow={this.renderSortableRow}
            />
          </CrossFade>
        </View>
        <XPubModal />
      </SceneWrapper>
    )
  }

  renderSortableRow = (guiWallet: GuiWallet | void) => {
    return guiWallet != null ? <WalletListSortableRow guiWallet={guiWallet} showBalance={getIsAccountBalanceVisible} /> : <WalletListEmptyRow />
  }

  renderRow = (data: FlatListItem<{ key: string }>) => {
    const { wallets } = this.props
    const guiWallet = wallets[data.item.key]

    return guiWallet != null ? (
      <WalletListRow guiWallet={guiWallet} executeWalletRowOption={this.executeWalletRowOption} showBalance={getIsAccountBalanceVisible} />
    ) : (
      <WalletListEmptyRow walletId={data.item.key} executeWalletRowOption={this.executeWalletRowOption} />
    )
  }

  disableSorting = () => this.setState({ sorting: false })

  onActiveRowMoved = (action: { from: number, to: number }) => {
    const newOrder = [...this.props.activeWalletIds]
    newOrder.splice(action.to, 0, newOrder.splice(action.from, 1)[0])
    this.props.updateActiveWalletsOrder(newOrder)
    this.forceUpdate()
  }

  renderPromoCard() {
    const { accountMessages, accountReferral, hideMessageTweak, linkReferralWithCurrencies } = this.props
    const messageSummary = bestOfMessages(accountMessages, accountReferral)
    if (messageSummary == null) return null

    const { message, messageId, messageSource } = messageSummary
    const { uri, iconUri } = message
    function handlePress() {
      if (uri != null) linkReferralWithCurrencies(uri)
    }
    function handleClose() {
      hideMessageTweak(messageId, messageSource)
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

const rawStyles = {
  // The sort & add buttons are stacked on top of the header component:
  headerButton: {
    alignSelf: 'flex-end',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: THEME.rem(1)
  },
  defaultButtons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  addButton: {
    marginRight: THEME.rem(0.75)
  },
  walletIcon: {
    width: THEME.rem(1.375),
    height: THEME.rem(1.375)
  },

  // The two lists are stacked vertically on top of each other:
  listStack: {
    flexGrow: 1
  },
  listSpinner: {
    flexGrow: 1,
    alignSelf: 'center'
  },

  // Promo area:
  promoArea: {
    padding: THEME.rem(0.5)
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.WHITE,
    margin: THEME.rem(0.5),
    padding: THEME.rem(0.5)
  },
  promoIcon: {
    width: THEME.rem(2),
    height: THEME.rem(2),
    margin: THEME.rem(0.5)
  },
  promoText: {
    ...dayText('row-left'),
    flex: 1,
    margin: THEME.rem(0.5)
  },
  promoClose: {
    padding: THEME.rem(0.5)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const WalletListScene = connect(
  (state: ReduxState): StateProps => {
    let activeWalletIds = getActiveWalletIds(state)

    // FIO disable changes below
    if (global.isFioDisabled) {
      const { currencyWallets = {} } = state.core.account
      activeWalletIds = activeWalletIds.filter(id => {
        const wallet = currencyWallets[id]
        return wallet == null || wallet.type !== 'wallet:fio'
      })
    }

    return {
      accountMessages: state.account.referralCache.accountMessages,
      accountReferral: state.account.accountReferral,
      activeWalletIds,
      exchangeRates: state.exchangeRates,
      otpResetPending: getOtpResetPending(state),
      wallets: state.ui.wallets.byId
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    hideMessageTweak(messageId: string, source: TweakSource) {
      dispatch(hideMessageTweak(messageId, source))
    },
    toggleAccountBalanceVisibility() {
      dispatch(toggleAccountBalanceVisibility())
    },
    updateActiveWalletsOrder(activeWalletIds) {
      dispatch(updateActiveWalletsOrder(activeWalletIds))
    },
    walletRowOption(walletId, option, currencyCode) {
      dispatch(walletListMenuAction(walletId, option, currencyCode))
    },
    disableOtp() {
      dispatch(disableOtp())
    },
    keepOtp() {
      dispatch(keepOtp())
    },
    linkReferralWithCurrencies(uri) {
      dispatch(linkReferralWithCurrencies(uri))
    }
  })
)(WalletListComponent)
