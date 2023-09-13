import { add, gt, mul, round } from 'biggystring'
import { EdgeAccount, EdgeBalances, EdgeCurrencyWallet, EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { toggleAccountBalanceVisibility } from '../../actions/LocalSettingsActions'
import { Fontello } from '../../assets/vector'
import { getSymbolFromCurrency, SPECIAL_CURRENCY_INFO, STAKING_BALANCES } from '../../constants/WalletAndCurrencyConstants'
import { ENV } from '../../env'
import { useHandler } from '../../hooks/useHandler'
import { useWalletName } from '../../hooks/useWalletName'
import { useWatch } from '../../hooks/useWatch'
import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { getStakePlugins } from '../../plugins/stake-plugins/stakePlugins'
import { PositionAllocation, StakePlugin, StakePolicy } from '../../plugins/stake-plugins/types'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { getExchangeRate } from '../../selectors/WalletSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { triggerHaptic } from '../../util/haptic'
import { getPluginFromPolicy, getPositionAllocations } from '../../util/stakeUtils'
import { convertNativeToDenomination } from '../../util/utils'
import { VisaCardCard } from '../cards/VisaCardCard'
import { CryptoIcon } from '../icons/CryptoIcon'
import { WalletListMenuModal } from '../modals/WalletListMenuModal'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship, showError, showWarning } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'
import { OutlinedTextInput, OutlinedTextInputRef } from './OutlinedTextInput'
import { SceneHeader } from './SceneHeader'

interface OwnProps {
  navigation: NavigationProp<'transactionList'>

  // Wallet identity:
  tokenId: string | undefined
  wallet: EdgeCurrencyWallet

  // Scene state:
  isEmpty: boolean
  searching: boolean
  onSearchingChange: (isSearching: boolean) => void
  onSearchTextChange: (searchString: string) => void
}

interface StateProps {
  account: EdgeAccount
  balances: EdgeBalances
  currencyCode: string
  displayDenomination: EdgeDenomination
  exchangeDenomination: EdgeDenomination
  exchangeRate: string
  isAccountBalanceVisible: boolean
  walletName: string
}

interface DispatchProps {
  toggleBalanceVisibility: () => void
}

interface State {
  input: string
  stakePolicies: StakePolicy[] | null
  stakePlugins: StakePlugin[] | null
  lockedNativeAmount: string
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

export class TransactionListTopComponent extends React.PureComponent<Props, State> {
  textInput = React.createRef<OutlinedTextInputRef>()

  constructor(props: Props) {
    super(props)
    this.state = {
      input: '',
      lockedNativeAmount: '0',
      stakePolicies: null,
      stakePlugins: null
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.searching && this.props.searching && this.textInput.current) {
      this.textInput.current.focus()
    }

    // Update staking policies if the wallet changes
    if (prevProps.wallet !== this.props.wallet) {
      this.updatePluginsAndPolicies().catch(err => showError(err))
    }
  }

  componentDidMount() {
    this.updatePluginsAndPolicies().catch(err => showError(err))
  }

  updatePluginsAndPolicies = async () => {
    const { currencyCode, wallet } = this.props
    const { pluginId } = wallet.currencyInfo

    if (SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported === true && ENV.ENABLE_STAKING) {
      const stakePlugins = await getStakePlugins()
      const stakePolicies: StakePolicy[] = []
      for (const stakePlugin of stakePlugins) {
        const policies = stakePlugin.getPolicies({ wallet, currencyCode })
        stakePolicies.push(...policies)
      }
      const newState = { stakePolicies, stakePlugins }
      this.setState(newState)
      await this.updatePositions(newState)
    } else {
      const newState = { stakePolicies: [], stakePlugins: [] }
      this.setState(newState)
      await this.updatePositions(newState)
    }
  }

  getTotalPosition = (currencyCode: string, positions: PositionAllocation[]): string => {
    const { pluginId } = this.props.wallet.currencyInfo
    const amount = positions.filter(p => p.currencyCode === currencyCode && p.pluginId === pluginId).reduce((prev, curr) => add(prev, curr.nativeAmount), '0')
    return amount
  }

  updatePositions = async ({ stakePlugins = [], stakePolicies = [] }: { stakePlugins?: StakePlugin[]; stakePolicies?: StakePolicy[] }) => {
    let lockedNativeAmount = '0'
    for (const stakePolicy of stakePolicies) {
      const { stakePolicyId } = stakePolicy
      const stakePlugin = getPluginFromPolicy(stakePlugins, stakePolicy)
      if (stakePlugin == null) continue
      const amount = await stakePlugin
        .fetchStakePosition({
          stakePolicyId,
          wallet: this.props.wallet,
          account: this.props.account
        })
        .then(async stakePosition => {
          const { staked, earned } = getPositionAllocations(stakePosition)
          return this.getTotalPosition(this.props.currencyCode, [...staked, ...earned])
        })
        .catch(err => {
          console.error(err)
          showWarning(lstrings.stake_unable_to_query_locked)
        })
      if (amount == null) return

      lockedNativeAmount = add(lockedNativeAmount, amount)
    }
    this.setState({ lockedNativeAmount })
  }

  handleOpenWalletListModal = () => {
    const { account, navigation } = this.props

    triggerHaptic('impactLight')
    Airship.show<WalletListResult>(bridge => <WalletListModal bridge={bridge} headerTitle={lstrings.select_wallet} navigation={navigation} />)
      .then((result: WalletListResult) => {
        const { currencyCode, walletId } = result
        if (walletId != null && currencyCode != null) {
          const wallet = account.currencyWallets[walletId]
          if (wallet == null) return
          const tokenId = getTokenId(account, wallet.currencyInfo.pluginId, currencyCode)
          navigation.setParams({ tokenId, walletId })
        }
      })
      .catch(err => showError(err))
  }

  handleMenu = () => {
    const { wallet, tokenId, navigation } = this.props
    triggerHaptic('impactLight')
    Airship.show(bridge => <WalletListMenuModal bridge={bridge} tokenId={tokenId} navigation={navigation} walletId={wallet.id} />).catch(err => showError(err))
  }

  renderBalanceBox = () => {
    const { balances, currencyCode, displayDenomination, exchangeDenomination, exchangeRate, isAccountBalanceVisible, theme, tokenId, wallet, walletName } =
      this.props
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
              <TouchableOpacity accessible={false} style={styles.balanceBoxWalletNameContainer} onPress={this.handleOpenWalletListModal}>
                <CryptoIcon sizeRem={1.5} tokenId={tokenId} walletId={wallet.id} />
                <EdgeText accessible style={styles.balanceBoxWalletName}>
                  {walletName}
                </EdgeText>
                <Ionicons name="chevron-forward" size={theme.rem(1.5)} color={theme.iconTappable} />
              </TouchableOpacity>
              <TouchableOpacity testID="gearIcon" onPress={this.handleMenu} style={styles.settingsIcon}>
                <Fontello accessibilityHint={lstrings.wallet_settings_label} color={theme.iconTappable} name="control-panel-settings" size={theme.rem(1.5)} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity accessible={false} onPress={this.props.toggleBalanceVisibility}>
              {isAccountBalanceVisible ? (
                <>
                  <EdgeText accessible style={styles.balanceBoxCurrency} minimumFontScale={0.3}>
                    {cryptoAmountFormat + ' ' + displayDenomination.name}
                  </EdgeText>
                  <EdgeText accessible style={styles.balanceFiatBalance}>
                    {fiatSymbol + fiatBalanceFormat + ' ' + fiatCurrencyCode}
                  </EdgeText>
                </>
              ) : (
                <EdgeText accessible style={styles.balanceFiatShow}>
                  {lstrings.string_show_balance}
                </EdgeText>
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

    const walletBalanceLocked = wallet.balances[`${currencyCode}${STAKING_BALANCES.locked}`] ?? '0'
    const nativeLocked = add(walletBalanceLocked, this.state.lockedNativeAmount)
    if (nativeLocked === '0') return null

    const stakingCryptoAmount = convertNativeToDenomination(displayDenomination.multiplier)(nativeLocked)
    const stakingCryptoAmountFormat = formatNumber(add(stakingCryptoAmount, '0'))

    const stakingExchangeAmount = convertNativeToDenomination(exchangeDenomination.multiplier)(nativeLocked)
    const stakingFiatBalance = mul(stakingExchangeAmount, exchangeRate)
    const stakingFiatBalanceFormat = formatNumber(stakingFiatBalance && gt(stakingFiatBalance, '0.000001') ? stakingFiatBalance : 0, { toFixed: 2 })

    return (
      <View style={styles.stakingBoxContainer}>
        <EdgeText style={styles.stakingStatusText}>
          {sprintf(
            lstrings.staking_status,
            stakingCryptoAmountFormat + ' ' + displayDenomination.name,
            fiatSymbol + stakingFiatBalanceFormat + ' ' + fiatCurrencyCode
          )}
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

  getBestApy = (): string | undefined => {
    const { stakePolicies } = this.state
    if (stakePolicies == null || stakePolicies.length === 0) return
    const bestApy = stakePolicies.reduce((prev, curr) => Math.max(prev, curr.apy ?? 0), 0)
    if (bestApy === 0) return
    return round(bestApy.toString(), -1) + '%'
  }

  handleOnChangeText = (input: string) => {
    this.setState({ input })
  }

  handleTextFieldFocus = () => {
    this.props.onSearchingChange(true)
  }

  handleTextFieldBlur = () => {
    this.props.onSearchTextChange(this.state.input)
  }

  handleRequest = (): void => {
    const { navigation } = this.props

    triggerHaptic('impactLight')
    navigation.push('request', {})
  }

  handleSend = (): void => {
    const { navigation } = this.props

    triggerHaptic('impactLight')
    const { wallet, tokenId } = this.props
    navigation.push('send2', { walletId: wallet.id, tokenId, hiddenFeaturesMap: { scamWarning: false } })
  }

  handleSearchDone = () => {
    triggerHaptic('impactLight')
    this.props.onSearchingChange(false)
    if (this.textInput.current) {
      this.textInput.current.clear()
    }
  }

  handleStakePress = () => {
    triggerHaptic('impactLight')
    const { currencyCode, wallet, navigation } = this.props
    const { stakePlugins, stakePolicies } = this.state

    // Handle FIO staking
    if (currencyCode === 'FIO') {
      navigation.push('fioStakingOverview', {
        currencyCode,
        walletId: wallet.id
      })
    }

    // Handle StakePlugin staking
    if (stakePlugins != null && stakePolicies != null) {
      if (stakePolicies.length > 1) {
        navigation.push('stakeOptions', {
          walletId: wallet.id,
          currencyCode,
          stakePlugins,
          stakePolicies
        })
      } else if (stakePolicies.length === 1) {
        const stakePlugin = getPluginFromPolicy(stakePlugins, stakePolicies[0])
        // Transition to next scene immediately
        if (stakePlugin != null) navigation.push('stakeOverview', { stakePlugin, walletId: wallet.id, stakePolicy: stakePolicies[0] })
      }
    }
  }

  clearText = () => {
    triggerHaptic('impactLight')
    this.setState({ input: '' })
    this.props.onSearchTextChange('')
    if (this.textInput.current) {
      this.textInput.current.blur()
    }
  }

  render() {
    const { wallet, isEmpty, searching, theme, tokenId } = this.props
    const { stakePolicies } = this.state
    const isStakePoliciesLoaded = stakePolicies !== null
    const isStakingAvailable = this.isStakingAvailable()
    const bestApy = this.getBestApy()
    const styles = getStyles(theme)

    return (
      <>
        <View style={styles.container}>
          {!searching && isEmpty ? null : (
            <View style={styles.searchContainer}>
              <View style={{ flex: 1, flexDirection: 'column' }}>
                <OutlinedTextInput
                  returnKeyType="search"
                  label={lstrings.transaction_list_search}
                  onChangeText={this.handleOnChangeText}
                  value={this.state.input}
                  onFocus={this.handleTextFieldFocus}
                  onBlur={this.handleTextFieldBlur}
                  ref={this.textInput}
                  marginRem={0}
                  searchIcon
                />
              </View>
              {!searching ? null : (
                <TouchableOpacity onPress={this.handleSearchDone} style={styles.searchDoneButton}>
                  <EdgeText style={{ color: theme.textLink }}>{lstrings.string_done_cap}</EdgeText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {searching ? null : (
            <>
              {this.renderBalanceBox()}
              {isStakingAvailable && this.renderStakedBalance()}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity accessible={false} onPress={this.handleRequest} style={styles.buttons}>
                  <AntDesignIcon name="arrowdown" size={theme.rem(1)} color={theme.iconTappable} />
                  <EdgeText accessible style={styles.buttonsText}>
                    {lstrings.fragment_request_subtitle}
                  </EdgeText>
                </TouchableOpacity>
                <TouchableOpacity accessible={false} onPress={this.handleSend} style={styles.buttons}>
                  <AntDesignIcon name="arrowup" size={theme.rem(1)} color={theme.iconTappable} />
                  <EdgeText accessible style={styles.buttonsText}>
                    {lstrings.fragment_send_subtitle}
                  </EdgeText>
                </TouchableOpacity>
                {!isStakePoliciesLoaded ? (
                  <ActivityIndicator color={theme.textLink} style={styles.stakingButton} />
                ) : (
                  isStakingAvailable && (
                    <TouchableOpacity onPress={this.handleStakePress} style={styles.buttons}>
                      <AntDesignIcon name="barschart" size={theme.rem(1)} color={theme.iconTappable} />
                      <EdgeText style={styles.buttonsText}>{lstrings.stake_earn_button_label}</EdgeText>
                      {bestApy != null ? <EdgeText style={styles.apyText}>{bestApy}</EdgeText> : null}
                    </TouchableOpacity>
                  )
                )}
              </View>
            </>
          )}
          {isEmpty || searching ? null : <VisaCardCard wallet={wallet} tokenId={tokenId} navigation={this.props.navigation} />}
        </View>
        {isEmpty || searching ? null : (
          <SceneHeader underline>
            <EdgeText style={styles.transactionsDividerText}>{lstrings.fragment_transaction_list_transaction}</EdgeText>
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
  apyText: {
    fontSize: theme.rem(0.75),
    color: theme.textLink,
    fontFamily: theme.fontFaceMedium,
    marginTop: theme.rem(-0.5),
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
  const { tokenId, wallet } = props
  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const theme = useTheme()

  const { currencyCode } = tokenId == null ? wallet.currencyInfo : wallet.currencyConfig.allTokens[tokenId]

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

  return (
    <TransactionListTopComponent
      {...props}
      account={account}
      balances={balances}
      currencyCode={currencyCode}
      displayDenomination={displayDenomination}
      exchangeDenomination={exchangeDenomination}
      exchangeRate={exchangeRate}
      walletName={walletName}
      isAccountBalanceVisible={isAccountBalanceVisible}
      toggleBalanceVisibility={handleBalanceVisibility}
      theme={theme}
    />
  )
}
