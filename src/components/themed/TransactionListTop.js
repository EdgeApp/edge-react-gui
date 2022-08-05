// @flow

import { add, gt } from 'biggystring'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { selectWalletFromModal } from '../../actions/WalletActions.js'
import { toggleAccountBalanceVisibility } from '../../actions/WalletListActions.js'
import { getSymbolFromCurrency, SPECIAL_CURRENCY_INFO, STAKING_BALANCES } from '../../constants/WalletAndCurrencyConstants'
import { formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { type StakePolicy } from '../../plugins/stake-plugins'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { convertCurrency } from '../../selectors/WalletSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { stakePlugin } from '../../util/stakeUtils.js'
import { convertNativeToDenomination } from '../../util/utils'
import { CryptoIcon } from '../icons/CryptoIcon.js'
import { type WalletListResult, WalletListModal } from '../modals/WalletListModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { type OutlinedTextInputRef, OutlinedTextInput } from './OutlinedTextInput.js'
import { SceneHeader } from './SceneHeader'

type OwnProps = {
  walletId: string,
  isEmpty: boolean,
  searching: boolean,
  onChangeSortingState: (isSearching: boolean) => void,
  onSearchTransaction: (searchString: string) => void,
  navigation: NavigationProp<any>
}

type StateProps = {
  cryptoAmount: string,
  currencyCode: string,
  pluginId: string,
  denominationName: string,
  fiatCurrencyCode: string,
  fiatBalance: string,
  fiatSymbol: string,
  walletName: string,
  isAccountBalanceVisible: boolean,
  stakingBalances: {
    [cCode: string]: {
      crypto: string,
      fiat: string
    }
  }
}

type DispatchProps = {
  onSelectWallet: (walletId: string, currencyCode: string) => void,
  toggleBalanceVisibility: () => void
}

type State = {
  input: string,
  stakePolicies: StakePolicy[]
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

export class TransactionListTopComponent extends React.PureComponent<Props, State> {
  textInput: { current: OutlinedTextInputRef | null } = React.createRef()

  constructor(props: Props) {
    super(props)
    this.state = {
      input: '',
      stakePolicies: []
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.searching === false && this.props.searching === true && this.textInput.current) {
      this.textInput.current.focus()
    }
  }

  componentDidMount() {
    stakePlugin.getStakePolicies().then(stakePolicies => {
      this.setState({ stakePolicies })
    })
  }

  handleOpenWalletListModal = () => {
    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} />).then(({ walletId, currencyCode }: WalletListResult) => {
      if (walletId && currencyCode) {
        this.props.onSelectWallet(walletId, currencyCode)
      }
    })
  }

  renderBalanceBox = () => {
    const { cryptoAmount, currencyCode, denominationName, fiatSymbol, fiatBalance, fiatCurrencyCode, walletId, walletName, isAccountBalanceVisible, theme } =
      this.props
    const styles = getStyles(theme)

    return (
      <View style={styles.balanceBoxContainer}>
        <View style={styles.balanceBoxRow}>
          <View style={styles.balanceBoxBalanceContainer}>
            <View style={styles.balanceBoxWalletNameCurrencyContainer}>
              <TouchableOpacity style={styles.balanceBoxWalletNameContainer} onPress={this.handleOpenWalletListModal}>
                <EdgeText style={styles.balanceBoxWalletName}>{walletName}</EdgeText>
                <Ionicons name="chevron-forward" size={theme.rem(1.5)} color={theme.iconTappable} />
              </TouchableOpacity>
              <CryptoIcon currencyCode={currencyCode} sizeRem={1.5} walletId={walletId} />
            </View>
            <TouchableOpacity onPress={this.props.toggleBalanceVisibility}>
              {isAccountBalanceVisible ? (
                <>
                  <EdgeText style={styles.balanceBoxCurrency} minimumFontScale={0.3}>
                    {cryptoAmount + ' ' + denominationName}
                  </EdgeText>
                  <EdgeText style={styles.balanceFiatBalance}>{fiatSymbol + fiatBalance + ' ' + fiatCurrencyCode}</EdgeText>
                </>
              ) : (
                <EdgeText style={styles.balanceFiatShow}>{s.strings.string_show_balance}</EdgeText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  renderStakingBox() {
    const { theme, currencyCode, stakingBalances, fiatSymbol, fiatCurrencyCode } = this.props
    const styles = getStyles(theme)
    const lockedBalance = stakingBalances[`${currencyCode}${STAKING_BALANCES.locked}`] ?? {}

    return lockedBalance.crypto != null && lockedBalance.crypto !== '0' ? (
      <View style={styles.stakingBoxContainer}>
        <EdgeText style={styles.stakingStatusText}>
          {sprintf(s.strings.staking_status, lockedBalance.crypto + ' ' + currencyCode, fiatSymbol + lockedBalance.fiat + ' ' + fiatCurrencyCode)}
        </EdgeText>
      </View>
    ) : null
  }

  hasStaking = () => {
    const { currencyCode, pluginId } = this.props
    const { stakePolicies } = this.state

    const isStakingPolicyAvailable = stakePolicies.some(stakePolicy => {
      return [...stakePolicy.rewardAssets, ...stakePolicy.stakeAssets].some(asset => asset.pluginId === pluginId && asset.currencyCode === currencyCode)
    })

    // Special case for FIO because it uses it's own staking plugin
    return SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported && (isStakingPolicyAvailable || currencyCode === 'FIO')
  }

  handleOnChangeText = (input: string) => {
    this.setState({ input })
  }

  handleTextFieldFocus = () => {
    this.props.onChangeSortingState(true)
  }

  handleTextFieldBlur = () => {
    this.props.onSearchTransaction(this.state.input)
  }

  handleRequest = (): void => {
    this.props.navigation.push('request')
  }

  handleSend = (): void => {
    this.props.navigation.push('send', {})
  }

  handleSearchDone = () => {
    this.props.onChangeSortingState(false)
    if (this.textInput.current) {
      this.textInput.current.clear()
    }
  }

  handleStakePress = () => {
    const { currencyCode, walletId, navigation } = this.props
    if (currencyCode === 'FIO') navigation.push('fioStakingOverview', { currencyCode, walletId })
    else navigation.push('stakeOptions', { walletId, currencyCode })
  }

  clearText = () => {
    this.setState({ input: '' })
    this.props.onSearchTransaction('')
    if (this.textInput.current) {
      this.textInput.current.blur()
    }
  }

  render() {
    const { isEmpty, searching, theme } = this.props
    const styles = getStyles(theme)
    const hasStaking = this.hasStaking()

    return (
      <>
        <View style={styles.container}>
          {!isEmpty && (
            <View style={styles.searchContainer}>
              <View style={{ flex: 1, flexDirection: 'column' }}>
                <OutlinedTextInput
                  returnKeyType="search"
                  label={s.strings.transaction_list_search}
                  onChangeText={this.handleOnChangeText}
                  value={this.state.input}
                  onFocus={this.handleTextFieldFocus}
                  onBlur={this.handleTextFieldBlur}
                  ref={this.textInput}
                  marginRem={0}
                  searchIcon
                />
              </View>
              {searching && (
                <TouchableOpacity onPress={this.handleSearchDone} style={styles.searchDoneButton}>
                  <EdgeText style={{ color: theme.textLink }}>{s.strings.string_done_cap}</EdgeText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!searching && (
            <>
              {this.renderBalanceBox()}
              {hasStaking && this.renderStakingBox()}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity onPress={this.handleRequest} style={styles.buttons}>
                  <AntDesignIcon name="arrowdown" size={theme.rem(1)} color={theme.iconTappable} />
                  <EdgeText style={styles.buttonsText}>{s.strings.fragment_request_subtitle}</EdgeText>
                </TouchableOpacity>
                <TouchableOpacity onPress={this.handleSend} style={styles.buttons}>
                  <AntDesignIcon name="arrowup" size={theme.rem(1)} color={theme.iconTappable} />
                  <EdgeText style={styles.buttonsText}>{s.strings.fragment_send_subtitle}</EdgeText>
                </TouchableOpacity>
                {hasStaking && (
                  <TouchableOpacity onPress={this.handleStakePress} style={styles.buttons}>
                    <AntDesignIcon name="barschart" size={theme.rem(1)} color={theme.iconTappable} />
                    <EdgeText style={styles.buttonsText}>{s.strings.fragment_stake_label}</EdgeText>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
        {!isEmpty && !searching && (
          <SceneHeader underline>
            <EdgeText style={styles.transactionsDividerText}>{s.strings.fragment_transaction_list_transaction}</EdgeText>
          </SceneHeader>
        )}
      </>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    paddingHorizontal: theme.rem(1),
    paddingBottom: theme.rem(1),
    marginBottom: theme.rem(0.5)
  },

  // Balance Box
  balanceBoxContainer: {
    marginTop: theme.rem(1)
  },
  balanceBoxRow: {
    flexDirection: 'row'
  },
  balanceBoxBalanceContainer: {
    flex: 1
  },
  balanceBoxWalletNameCurrencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  balanceBoxWalletNameContainer: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.rem(0.5)
  },
  balanceBoxWalletName: {
    flexShrink: 1,
    marginRight: theme.rem(0.25),
    fontSize: theme.rem(1.25)
  },
  balanceBoxCurrency: {
    fontSize: theme.rem(2),
    fontFamily: theme.fontFaceMedium
  },
  balanceFiatBalance: {
    fontSize: theme.rem(1.25)
  },
  balanceFiatShow: {
    fontSize: theme.rem(2)
  },

  // Send/Receive Buttons
  buttonsContainer: {
    marginTop: theme.rem(1),
    flexDirection: 'row'
  },
  buttons: {
    flexShrink: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingRight: theme.rem(1.5)
  },
  buttonsText: {
    fontSize: theme.rem(1),
    color: theme.textLink,
    fontFamily: theme.fontFaceMedium,
    marginLeft: theme.rem(0.25)
  },

  // Transactions Divider
  transactionsDividerText: {
    fontFamily: theme.fontFaceMedium
  },

  searchContainer: {
    flexDirection: 'row',
    marginTop: theme.rem(0.5)
  },
  searchDoneButton: {
    justifyContent: 'center',
    paddingLeft: theme.rem(0.75)
  },

  // Staking Box
  stakingBoxContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  stakingStatusText: {
    color: theme.secondaryText,
    maxWidth: '70%',
    fontSize: theme.rem(1)
  }
}))

export const TransactionListTop = connect<StateProps, DispatchProps, OwnProps>(
  state => {
    const selectedWalletId = state.ui.wallets.selectedWalletId
    const { currencyInfo } = state.core.account.currencyWallets[selectedWalletId]
    const { pluginId } = currencyInfo
    const selectedCurrencyCode = state.ui.wallets.selectedCurrencyCode
    const guiWallet = state.ui.wallets.byId[selectedWalletId]
    const balance = guiWallet.nativeBalances[selectedCurrencyCode]
    const stakingBalances = {}

    // Crypto Amount Formatting
    const currencyDenomination = getDisplayDenomination(state, currencyInfo.pluginId, selectedCurrencyCode)
    const cryptoAmount: string = convertNativeToDenomination(currencyDenomination.multiplier)(balance) // convert to correct denomination
    const cryptoAmountFormat = formatNumber(add(cryptoAmount, '0'))

    // Fiat Balance Formatting
    const defaultDenomination = getExchangeDenomination(state, currencyInfo.pluginId, selectedCurrencyCode)
    const defaultCryptoAmount = convertNativeToDenomination(defaultDenomination.multiplier)(balance)
    const fiatBalance = convertCurrency(state, selectedCurrencyCode, guiWallet.isoFiatCurrencyCode, defaultCryptoAmount)
    const fiatBalanceFormat = formatNumber(fiatBalance && gt(fiatBalance, '0.000001') ? fiatBalance : 0, { toFixed: 2 })

    if (SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported) {
      for (const cCodeKey in STAKING_BALANCES) {
        const stakingCurrencyCode = `${selectedCurrencyCode}${STAKING_BALANCES[cCodeKey]}`

        const stakingNativeAmount = guiWallet.nativeBalances[stakingCurrencyCode] || '0'
        const stakingCryptoAmount: string = convertNativeToDenomination(currencyDenomination.multiplier)(stakingNativeAmount)
        const stakingCryptoAmountFormat = formatNumber(add(stakingCryptoAmount, '0'))

        const stakingDefaultCryptoAmount = convertNativeToDenomination(defaultDenomination.multiplier)(stakingNativeAmount)
        const stakingFiatBalance = convertCurrency(state, selectedCurrencyCode, guiWallet.isoFiatCurrencyCode, stakingDefaultCryptoAmount)
        const stakingFiatBalanceFormat = formatNumber(stakingFiatBalance && gt(stakingFiatBalance, '0.000001') ? stakingFiatBalance : 0, { toFixed: 2 })

        stakingBalances[stakingCurrencyCode] = {
          crypto: stakingCryptoAmountFormat,
          fiat: stakingFiatBalanceFormat
        }
      }
    }

    return {
      currencyCode: selectedCurrencyCode,
      pluginId,
      cryptoAmount: cryptoAmountFormat,
      denominationName: currencyDenomination.name,
      fiatCurrencyCode: guiWallet.fiatCurrencyCode,
      fiatBalance: fiatBalanceFormat,
      fiatSymbol: getSymbolFromCurrency(guiWallet.isoFiatCurrencyCode),
      walletName: guiWallet.name,
      isAccountBalanceVisible: state.ui.settings.isAccountBalanceVisible,
      stakingBalances
    }
  },
  dispatch => ({
    toggleBalanceVisibility() {
      dispatch(toggleAccountBalanceVisibility())
    },
    onSelectWallet(walletId: string, currencyCode: string) {
      dispatch(selectWalletFromModal(walletId, currencyCode))
    }
  })
)(withTheme(TransactionListTopComponent))
