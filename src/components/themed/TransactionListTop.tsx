import { add, gt, mul } from 'biggystring'
import { EdgeBalances, EdgeCurrencyWallet, EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { selectWalletFromModal } from '../../actions/WalletActions'
import { toggleAccountBalanceVisibility } from '../../actions/WalletListActions'
import { Fontello } from '../../assets/vector'
import { getSymbolFromCurrency, SPECIAL_CURRENCY_INFO, STAKING_BALANCES } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useWalletName } from '../../hooks/useWalletName'
import { useWatch } from '../../hooks/useWatch'
import { formatNumber } from '../../locales/intl'
import s from '../../locales/strings'
import { StakePolicy } from '../../plugins/stake-plugins'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { getExchangeRate } from '../../selectors/WalletSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { Actions, NavigationProp } from '../../types/routerTypes'
import { stakePlugin } from '../../util/stakeUtils'
import { convertNativeToDenomination } from '../../util/utils'
import { CryptoIcon } from '../icons/CryptoIcon'
import { WalletListMenuModal } from '../modals/WalletListMenuModal'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, useTheme } from '../services/ThemeContext'
import { EarnCrypto } from './EarnCrypto'
import { EdgeText } from './EdgeText'
import { OutlinedTextInput, OutlinedTextInputRef } from './OutlinedTextInput'
import { SceneHeader } from './SceneHeader'

interface OwnProps {
  navigation: NavigationProp<'transactionList'>

  // Wallet identity:
  currencyCode: string
  tokenId?: string
  wallet: EdgeCurrencyWallet

  // Scene state:
  isEmpty: boolean
  searching: boolean
  onChangeSortingState: (isSearching: boolean) => void
  onSearchTransaction: (searchString: string) => void
}

interface StateProps {
  balances: EdgeBalances
  displayDenomination: EdgeDenomination
  exchangeDenomination: EdgeDenomination
  exchangeRate: string
  isAccountBalanceVisible: boolean
  walletName: string
}

interface DispatchProps {
  onSelectWallet: (walletId: string, currencyCode: string) => void
  toggleBalanceVisibility: () => void
}

interface State {
  input: string
  stakePolicies: StakePolicy[] | null
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

export class TransactionListTopComponent extends React.PureComponent<Props, State> {
  textInput: { current: OutlinedTextInputRef | null } = React.createRef()

  constructor(props: Props) {
    super(props)
    this.state = {
      input: '',
      stakePolicies: null
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.searching && this.props.searching && this.textInput.current) {
      this.textInput.current.focus()
    }
  }

  componentDidMount() {
    const { currencyCode, wallet } = this.props
    const { pluginId } = wallet.currencyInfo

    if (SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported === true) {
      stakePlugin.getStakePolicies().then(stakePolicies => {
        const filteredStatePolicies = stakePolicies.filter(stakePolicy => {
          return [...stakePolicy.rewardAssets, ...stakePolicy.stakeAssets].some(asset => asset.pluginId === pluginId && asset.currencyCode === currencyCode)
        })
        this.setState({ stakePolicies: filteredStatePolicies })
      })
    } else {
      this.setState({ stakePolicies: [] })
    }
  }

  handleOpenWalletListModal = () => {
    const { navigation } = this.props
    Airship.show<WalletListResult>(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} />).then(
      ({ walletId, currencyCode }: WalletListResult) => {
        if (walletId != null && currencyCode != null) {
          navigation.setParams({ currencyCode, walletId })
        }
      }
    )
  }

  handleMenu = () => {
    const { wallet, tokenId, navigation } = this.props
    Airship.show(bridge => <WalletListMenuModal bridge={bridge} tokenId={tokenId} navigation={navigation} walletId={wallet.id} />)
  }

  renderBalanceBox = () => {
    const { balances, displayDenomination, exchangeDenomination, exchangeRate, currencyCode, isAccountBalanceVisible, theme, wallet, walletName } = this.props
    const styles = getStyles(theme)

    const fiatCurrencyCode = wallet.fiatCurrencyCode.replace(/^iso:/, '')
    const fiatSymbol = getSymbolFromCurrency(wallet.fiatCurrencyCode)

    const nativeBalance = balances[currencyCode] ?? '0'
    const cryptoAmount = convertNativeToDenomination(displayDenomination.multiplier)(nativeBalance) // convert to correct denomination
    const cryptoAmountFormat = formatNumber(add(cryptoAmount, '0'))

    // Fiat Balance Formatting
    const exchangeAmount = convertNativeToDenomination(exchangeDenomination.multiplier)(nativeBalance)
    const fiatBalance = mul(exchangeAmount, exchangeRate)
    const fiatBalanceFormat = formatNumber(fiatBalance && gt(fiatBalance, '0.000001') ? fiatBalance : 0, { toFixed: 2 })

    return (
      <View style={styles.balanceBoxContainer}>
        <View style={styles.balanceBoxRow}>
          <View style={styles.balanceBoxBalanceContainer}>
            <View style={styles.balanceBoxWalletNameCurrencyContainer}>
              <TouchableOpacity style={styles.balanceBoxWalletNameContainer} onPress={this.handleOpenWalletListModal}>
                <CryptoIcon currencyCode={currencyCode} sizeRem={1.5} walletId={wallet.id} />
                <EdgeText style={styles.balanceBoxWalletName}>{walletName}</EdgeText>
                <Ionicons name="chevron-forward" size={theme.rem(1.5)} color={theme.iconTappable} />
              </TouchableOpacity>
              <TouchableOpacity onPress={this.handleMenu} style={styles.settingsIcon}>
                <Fontello name="control-panel-settings" size={theme.rem(1.5)} color={theme.iconTappable} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={this.props.toggleBalanceVisibility}>
              {isAccountBalanceVisible ? (
                <>
                  <EdgeText style={styles.balanceBoxCurrency} minimumFontScale={0.3}>
                    {cryptoAmountFormat + ' ' + displayDenomination.name}
                  </EdgeText>
                  <EdgeText style={styles.balanceFiatBalance}>{fiatSymbol + fiatBalanceFormat + ' ' + fiatCurrencyCode}</EdgeText>
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

  /**
   * If the parent chain supports staking, query the info server if staking is
   * supported for this specific asset. While waiting for the query, show a
   * spinner.
   */
  renderStakedBalance() {
    const { theme, currencyCode, wallet, displayDenomination, exchangeDenomination, exchangeRate } = this.props
    const styles = getStyles(theme)

    if (SPECIAL_CURRENCY_INFO[wallet.currencyInfo.pluginId]?.isStakingSupported !== true) return null

    const fiatCurrencyCode = wallet.fiatCurrencyCode.replace(/^iso:/, '')
    const fiatSymbol = getSymbolFromCurrency(wallet.fiatCurrencyCode)

    const nativeLocked = wallet.balances[`${currencyCode}${STAKING_BALANCES.locked}`] ?? '0'
    if (nativeLocked === '0') return null

    const stakingCryptoAmount = convertNativeToDenomination(displayDenomination.multiplier)(nativeLocked)
    const stakingCryptoAmountFormat = formatNumber(add(stakingCryptoAmount, '0'))

    const stakingExchangeAmount = convertNativeToDenomination(exchangeDenomination.multiplier)(nativeLocked)
    const stakingFiatBalance = mul(stakingExchangeAmount, exchangeRate)
    const stakingFiatBalanceFormat = formatNumber(stakingFiatBalance && gt(stakingFiatBalance, '0.000001') ? stakingFiatBalance : 0, { toFixed: 2 })

    return (
      <View style={styles.stakingBoxContainer}>
        <EdgeText style={styles.stakingStatusText}>
          {sprintf(s.strings.staking_status, stakingCryptoAmountFormat + ' ' + currencyCode, fiatSymbol + stakingFiatBalanceFormat + ' ' + fiatCurrencyCode)}
        </EdgeText>
      </View>
    )
  }

  isStakingAvailable = (): boolean => {
    const { currencyCode, wallet } = this.props
    const { pluginId } = wallet.currencyInfo
    const { stakePolicies } = this.state

    const isStakingPolicyAvailable = stakePolicies != null && stakePolicies.length > 0

    // Special case for FIO because it uses it's own staking plugin
    const isStakingSupported = SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported === true && (isStakingPolicyAvailable || currencyCode === 'FIO')
    return isStakingSupported
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
    Actions.push('request', {})
  }

  handleSend = (): void => {
    Actions.push('send', {})
  }

  handleSearchDone = () => {
    this.props.onChangeSortingState(false)
    if (this.textInput.current) {
      this.textInput.current.clear()
    }
  }

  handleStakePress = () => {
    const { currencyCode, wallet } = this.props
    const { stakePolicies } = this.state

    // Handle FIO staking
    if (currencyCode === 'FIO') {
      Actions.push('fioStakingOverview', {
        currencyCode,
        walletId: wallet.id
      })
    }

    // Handle StakePlugin staking
    if (stakePolicies != null && stakePolicies.length > 0) {
      Actions.push('stakeOptions', {
        walletId: wallet.id,
        currencyCode,
        stakePolicies
      })
    }
  }

  clearText = () => {
    this.setState({ input: '' })
    this.props.onSearchTransaction('')
    if (this.textInput.current) {
      this.textInput.current.blur()
    }
  }

  render() {
    const { wallet, isEmpty, searching, theme, tokenId } = this.props
    const { stakePolicies } = this.state
    const isStakePoliciesLoaded = stakePolicies !== null
    const isStakingAvailable = this.isStakingAvailable()
    const styles = getStyles(theme)

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
              {isStakingAvailable && this.renderStakedBalance()}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity onPress={this.handleRequest} style={styles.buttons}>
                  <AntDesignIcon name="arrowdown" size={theme.rem(1)} color={theme.iconTappable} />
                  <EdgeText style={styles.buttonsText}>{s.strings.fragment_request_subtitle}</EdgeText>
                </TouchableOpacity>
                <TouchableOpacity onPress={this.handleSend} style={styles.buttons}>
                  <AntDesignIcon name="arrowup" size={theme.rem(1)} color={theme.iconTappable} />
                  <EdgeText style={styles.buttonsText}>{s.strings.fragment_send_subtitle}</EdgeText>
                </TouchableOpacity>
                {!isStakePoliciesLoaded ? (
                  <ActivityIndicator color={theme.textLink} style={styles.stakingButton} />
                ) : (
                  isStakingAvailable && (
                    <TouchableOpacity onPress={this.handleStakePress} style={styles.buttons}>
                      <AntDesignIcon name="barschart" size={theme.rem(1)} color={theme.iconTappable} />
                      <EdgeText style={styles.buttonsText}>{s.strings.fragment_stake_label}</EdgeText>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </>
          )}
          {!isEmpty && !searching && <EarnCrypto wallet={wallet} tokenId={tokenId} />}
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
    marginTop: theme.rem(1.5)
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
    marginLeft: theme.rem(0.5),
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
  settingsIcon: {
    alignSelf: 'center'
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
  },
  stakingButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: theme.rem(1)
  }
}))

export function TransactionListTop(props: OwnProps) {
  const { wallet, currencyCode } = props
  const dispatch = useDispatch()
  const theme = useTheme()

  const { pluginId } = wallet.currencyInfo
  const displayDenomination = useSelector(state => getDisplayDenomination(state, pluginId, currencyCode))
  const exchangeDenomination = useSelector(state => getExchangeDenomination(state, pluginId, currencyCode))
  const exchangeRate = useSelector(state => getExchangeRate(state, currencyCode, wallet.fiatCurrencyCode))
  const isAccountBalanceVisible = useSelector(state => state.ui.settings.isAccountBalanceVisible)

  const walletName = useWalletName(wallet)
  const balances = useWatch(wallet, 'balances')

  const handleBalanceVisibility = useHandler(() => {
    dispatch(toggleAccountBalanceVisibility())
  })
  const handleSelectWallet = useHandler((walletId: string, currencyCode: string) => {
    dispatch(selectWalletFromModal(walletId, currencyCode))
  })

  return (
    <TransactionListTopComponent
      {...props}
      balances={balances}
      displayDenomination={displayDenomination}
      exchangeDenomination={exchangeDenomination}
      exchangeRate={exchangeRate}
      walletName={walletName}
      isAccountBalanceVisible={isAccountBalanceVisible}
      toggleBalanceVisibility={handleBalanceVisibility}
      onSelectWallet={handleSelectWallet}
      theme={theme}
    />
  )
}
