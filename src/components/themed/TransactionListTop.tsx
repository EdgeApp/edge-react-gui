import { add, gt, mul } from 'biggystring'
import type { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import Entypo from 'react-native-vector-icons/Entypo'
import Feather from 'react-native-vector-icons/Feather'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { checkAndShowLightBackupModal } from '../../actions/BackupModalActions'
import { toggleAccountBalanceVisibility } from '../../actions/LocalSettingsActions'
import { updateStakingState } from '../../actions/scene/StakingActions'
import {
  DONE_THRESHOLD,
  getFiatSymbol,
  SPECIAL_CURRENCY_INFO
} from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useAsyncNavigation } from '../../hooks/useAsyncNavigation'
import { useAsyncValue } from '../../hooks/useAsyncValue'
import { useHandler } from '../../hooks/useHandler'
import { useWalletName } from '../../hooks/useWalletName'
import { useWatch } from '../../hooks/useWatch'
import { formatNumber, toPercentString } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { getStakePlugins } from '../../plugins/stake-plugins/stakePlugins'
import type { StakePlugin } from '../../plugins/stake-plugins/types'
import { EMPTY_STAKE_POSITION_MAP } from '../../reducers/StakingReducer'
import {
  getExchangeDenom,
  selectDisplayDenom
} from '../../selectors/DenominationSelectors'
import { getExchangeRate } from '../../selectors/WalletSelectors'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type {
  NavigationBase,
  WalletsTabSceneProps
} from '../../types/routerTypes'
import { isKeysOnlyPlugin } from '../../util/CurrencyInfoHelpers'
import { triggerHaptic } from '../../util/haptic'
import {
  getBestApyText,
  getFioStakingBalances,
  getPluginFromPolicyId,
  getPoliciesFromPlugins,
  getPositionAllocations,
  isStakingSupported
} from '../../util/stakeUtils'
import { getUkCompliantString } from '../../util/ukComplianceUtils'
import { convertNativeToDenomination, removeIsoPrefix } from '../../util/utils'
import { IconButton } from '../buttons/IconButton'
import { AlertCardUi4 } from '../cards/AlertCard'
import { EdgeCard } from '../cards/EdgeCard'
import { VisaCardCard } from '../cards/VisaCardCard'
import { EdgeAnim } from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { WalletIcon } from '../icons/WalletIcon'
import { EdgeModal } from '../modals/EdgeModal'
import { WalletListMenuModal } from '../modals/WalletListMenuModal'
import {
  WalletListModal,
  type WalletListResult
} from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'
import { SelectableRow } from './SelectableRow'

interface Props {
  navigation: WalletsTabSceneProps<'walletDetails'>['navigation']

  // Wallet identity:
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet

  // Scene state:
  isEmpty: boolean
  searching: boolean
}

export const TransactionListTop: React.FC<Props> = props => {
  const { isEmpty, searching, tokenId, wallet } = props
  const navigation = useAsyncNavigation(props.navigation)

  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)
  const countryCode = useSelector(state => state.ui.countryCode)
  const stakePositionMap =
    useSelector(
      state => state.staking.walletStakingMap[wallet.id]?.stakePositionMap
    ) ?? EMPTY_STAKE_POSITION_MAP

  const defaultFiat = removeIsoPrefix(defaultIsoFiat)
  const theme = useTheme()

  const [stakePlugins = []] = useAsyncValue<StakePlugin[]>(
    async () => await getStakePlugins(wallet.currencyInfo.pluginId)
  )
  const stakePolicies = React.useMemo(
    () =>
      getPoliciesFromPlugins(stakePlugins, stakePositionMap, wallet, tokenId),
    [stakePlugins, stakePositionMap, tokenId, wallet]
  )

  const displayDenomination = useSelector(state =>
    selectDisplayDenom(state, wallet.currencyConfig, tokenId)
  )
  const exchangeDenomination = getExchangeDenom(wallet.currencyConfig, tokenId)
  const exchangeRate = useSelector(state =>
    isKeysOnlyPlugin(wallet.currencyInfo.pluginId)
      ? 0
      : getExchangeRate(
          state.exchangeRates,
          wallet.currencyInfo.pluginId,
          tokenId,
          defaultIsoFiat
        )
  )
  const isAccountBalanceVisible = useSelector(
    state => state.ui.settings.isAccountBalanceVisible
  )

  const isStakingAvailable =
    isStakingSupported(wallet.currencyInfo.pluginId) &&
    (stakePolicies.length > 0 ||
      // FIO was the first staking-enabled currency and doesn't use staking policies yet
      wallet.currencyInfo.pluginId === 'fio')

  const walletName = useWalletName(wallet)
  const balanceMap = useWatch(wallet, 'balanceMap')
  const syncStatus = useWatch(wallet, 'syncStatus')

  // Track sync card visibility with 1-second delay after sync completes:
  const isSyncing = syncStatus.totalRatio < DONE_THRESHOLD
  const [showSyncCard, setShowSyncCard] = React.useState(isSyncing)
  React.useEffect(() => {
    if (isSyncing) {
      setShowSyncCard(true)
    } else {
      const timeout = setTimeout(() => {
        setShowSyncCard(false)
      }, 1000)
      return () => {
        clearTimeout(timeout)
      }
    }
  }, [isSyncing])

  useAsyncEffect(
    async () => {
      await dispatch(updateStakingState(tokenId, wallet))
    },
    [dispatch, tokenId, wallet],
    'TransactionListTop'
  )

  const { pluginId } = wallet.currencyInfo
  const lockedNativeAmount = React.useMemo(() => {
    let lockedNativeAmount = '0'

    for (const policy of stakePolicies) {
      if (policy.isLiquidStaking === true) continue
      const position = stakePositionMap[policy.stakePolicyId]
      if (position == null) continue

      const { staked, earned } = getPositionAllocations(position)
      const total = [...staked, ...earned]
        .filter(p => p.tokenId === tokenId && p.pluginId === pluginId)
        .reduce((prev, curr) => add(prev, curr.nativeAmount), '0')
      lockedNativeAmount = add(lockedNativeAmount, total)
    }

    return lockedNativeAmount
  }, [pluginId, stakePolicies, stakePositionMap, tokenId])

  const handleBalanceVisibility = useHandler(async () => {
    await dispatch(toggleAccountBalanceVisibility())
  })

  const handleOpenWalletListModal = useHandler((): void => {
    triggerHaptic('impactLight')
    Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        parentWalletId={tokenId == null ? undefined : wallet.id}
        headerTitle={lstrings.select_wallet}
        navigation={navigation as NavigationBase}
      />
    ))
      .then(result => {
        if (result?.type === 'wallet') {
          const { tokenId, walletId } = result
          const wallet = account.currencyWallets[walletId]
          if (wallet == null) return
          navigation.setParams({ tokenId, walletId })
        }
      })
      .catch((err: unknown) => {
        showError(err)
      })
  })

  const handleMenu = useHandler((): void => {
    triggerHaptic('impactLight')
    Airship.show(bridge => (
      <WalletListMenuModal
        bridge={bridge}
        tokenId={tokenId}
        navigation={navigation}
        walletId={wallet.id}
      />
    )).catch((err: unknown) => {
      showError(err)
    })
  })

  const handleTrade = useHandler(async (): Promise<void> => {
    const styles = getStyles(theme)
    const { disableSwaps = false } = config

    const buySellIconProps = {
      size: theme.rem(1.25),
      color: theme.iconTappable
    }
    const sceneCurrencyCode =
      tokenId == null
        ? wallet.currencyInfo.currencyCode
        : wallet.currencyConfig.allTokens[tokenId].currencyCode

    await Airship.show(bridge => (
      <EdgeModal
        bridge={bridge}
        title={sprintf(lstrings.trade_s, sceneCurrencyCode)}
        onCancel={() => {
          bridge.resolve()
        }}
      >
        <SelectableRow
          marginRem={0.5}
          title={sprintf(lstrings.buy_1s, sceneCurrencyCode)}
          onPress={() => {
            handleTradeBuy(bridge)
          }}
          icon={
            <View style={styles.dualIconContainer}>
              <FontAwesomeIcon name="bank" {...buySellIconProps} />
              <AntDesignIcon name="arrowright" {...buySellIconProps} />
            </View>
          }
        />
        <SelectableRow
          marginRem={0.5}
          title={sprintf(lstrings.sell_1s, sceneCurrencyCode)}
          onPress={() => {
            handleTradeSell(bridge)
          }}
          icon={
            <View style={styles.dualIconContainer}>
              <AntDesignIcon name="arrowright" {...buySellIconProps} />
              <FontAwesomeIcon name="bank" {...buySellIconProps} />
            </View>
          }
        />
        {!disableSwaps ? (
          <SelectableRow
            marginRem={0.5}
            title={sprintf(lstrings.swap_s_to_from_crypto, sceneCurrencyCode)}
            onPress={() => {
              handleTradeSwap(bridge)
            }}
            icon={
              <View style={styles.singleIconContainer}>
                <Ionicons
                  name="swap-horizontal"
                  size={theme.rem(2.5)}
                  color={theme.iconTappable}
                />
              </View>
            }
          />
        ) : null}
      </EdgeModal>
    ))
  })

  const handleTradeBuy = useHandler((bridge: AirshipBridge<void>): void => {
    const forcedWalletResult: WalletListResult = {
      type: 'wallet',
      walletId: wallet.id,
      tokenId
    }

    navigation.navigate('buyTab', {
      screen: 'pluginListBuy',
      params: { forcedWalletResult }
    })
    bridge.resolve()
  })

  const handleTradeSell = useHandler((bridge: AirshipBridge<void>): void => {
    const forcedWalletResult: WalletListResult = {
      type: 'wallet',
      walletId: wallet.id,
      tokenId
    }

    navigation.navigate('sellTab', {
      screen: 'pluginListSell',
      params: { forcedWalletResult }
    })
    bridge.resolve()
  })

  const handleTradeSwap = useHandler((bridge?: AirshipBridge<void>): void => {
    // Houdini incognito-swap prototype: route the wallet Trade -> Swap action to
    // the reorganized swap scene instead of the production swapCreate scene.
    navigation.push('houdiniSwap', {
      walletId: wallet.id,
      tokenId
    })
    if (bridge != null) bridge.resolve()
  })

  const renderBalanceBox = (): React.ReactElement => {
    // TODO: Use CryptoText/FiatText and/or CryptoAmount after they are extended
    // to gracefully handle edge cases such as explicit no rounding and scaling.
    const styles = getStyles(theme)

    const fiatSymbol = getFiatSymbol(defaultFiat)

    const nativeBalance = balanceMap.get(tokenId) ?? '0'
    const cryptoAmount = convertNativeToDenomination(
      displayDenomination.multiplier
    )(nativeBalance) // convert to correct denomination
    const cryptoAmountFormat = formatNumber(add(cryptoAmount, '0'))

    // Fiat Balance Formatting
    const exchangeAmount = convertNativeToDenomination(
      exchangeDenomination.multiplier
    )(nativeBalance)
    const fiatBalance = parseFloat(exchangeAmount) * exchangeRate
    const fiatBalanceFormat = formatNumber(
      fiatBalance > 0.000001 ? fiatBalance : 0,
      { toFixed: 2 }
    )

    return (
      <>
        <View style={styles.balanceBoxWalletNameCurrencyContainer}>
          <EdgeTouchableOpacity
            accessible={false}
            style={styles.balanceBoxWalletNameContainer}
            onPress={handleOpenWalletListModal}
          >
            <WalletIcon
              marginRem={[0, 0.25, 0, 0]}
              sizeRem={1}
              tokenId={tokenId}
              wallet={wallet}
            />
            <EdgeText accessible style={styles.balanceBoxWalletName}>
              {walletName}
            </EdgeText>
          </EdgeTouchableOpacity>
          <EdgeTouchableOpacity
            testID="gearIcon"
            onPress={handleMenu}
            style={styles.settingsTouchContainer}
          >
            <Entypo
              accessibilityHint={lstrings.wallet_settings_label}
              color={theme.icon}
              name="dots-three-vertical"
              size={theme.rem(1)}
            />
          </EdgeTouchableOpacity>
        </View>
        <EdgeTouchableOpacity
          accessible={false}
          onPress={handleBalanceVisibility}
        >
          <View style={styles.balanceBoxCryptoBalanceContainer}>
            <EdgeText
              accessible
              style={styles.balanceBoxCurrency}
              minimumFontScale={0.25}
              numberOfLines={1}
            >
              {(isAccountBalanceVisible
                ? cryptoAmountFormat
                : lstrings.redacted_placeholder) +
                ' ' +
                displayDenomination.name}
            </EdgeText>
            <Ionicons
              name={isAccountBalanceVisible ? 'eye-off-outline' : 'eye-outline'}
              style={styles.eyeIcon}
              color={theme.iconTappable}
              size={theme.rem(1.15)}
            />
          </View>
          <EdgeText accessible style={styles.balanceFiatBalance}>
            {fiatSymbol +
              (isAccountBalanceVisible
                ? fiatBalanceFormat
                : ' ' + lstrings.redacted_placeholder) +
              ' ' +
              defaultFiat}
          </EdgeText>
        </EdgeTouchableOpacity>
      </>
    )
  }

  /**
   * If the parent chain supports staking, query the info server if staking is
   * supported for this specific asset. While waiting for the query, show a
   * spinner.
   */
  function renderStakedBalance(): React.ReactElement | null {
    const styles = getStyles(theme)

    if (
      SPECIAL_CURRENCY_INFO[wallet.currencyInfo.pluginId]
        ?.isStakingSupported !== true
    )
      return null

    const fiatSymbol = getFiatSymbol(defaultFiat)

    const fioStatus = getFioStakingBalances(wallet.stakingStatus)
    const nativeLocked = add(fioStatus.locked, lockedNativeAmount)
    if (nativeLocked === '0') return null

    const stakingCryptoAmount = convertNativeToDenomination(
      displayDenomination.multiplier
    )(nativeLocked)
    const stakingCryptoAmountFormat = formatNumber(
      add(stakingCryptoAmount, '0')
    )

    const stakingExchangeAmount = convertNativeToDenomination(
      exchangeDenomination.multiplier
    )(nativeLocked)
    const stakingFiatBalance = mul(stakingExchangeAmount, exchangeRate)
    const stakingFiatBalanceFormat = formatNumber(
      gt(stakingFiatBalance, '0.000001') ? stakingFiatBalance : 0,
      { toFixed: 2 }
    )

    return (
      <View style={styles.stakingBoxContainer}>
        <EdgeText style={styles.stakingStatusText}>
          {sprintf(
            lstrings.staking_status,
            stakingCryptoAmountFormat + ' ' + displayDenomination.name,
            fiatSymbol + stakingFiatBalanceFormat + ' ' + defaultFiat
          )}
        </EdgeText>
      </View>
    )
  }

  /**
   * Render sync status card when wallet is syncing and has meaningful details.
   * Uses warning card with animated height shrink when sync completes.
   */
  function renderSyncStatus(): React.ReactElement | null {
    const { totalRatio, blockRatio, otherParams } = syncStatus
    const points: string[] = []

    if (wallet.currencyInfo.syncDisplayPrecision != null) {
      points.push(
        sprintf(
          lstrings.percent_complete_1s,
          toPercentString(totalRatio, {
            maxPrecision: wallet.currencyInfo.syncDisplayPrecision
          })
        )
      )
    }

    if (blockRatio != null) {
      points.push(
        sprintf(
          lstrings.sync_status_blocks,
          formatNumber(blockRatio[0]),
          formatNumber(blockRatio[1])
        )
      )
    }

    if (otherParams != null) {
      for (const label of Object.keys(otherParams)) {
        // TODO: Localze known labels -or-
        // move them to the typed area, not in `otherParams`:
        points.push(`${label}: ${otherParams[label]}`)
      }
    }

    return points.length <= 0 ? null : (
      <EdgeAnim visible={showSyncCard} exit={syncCardExitAnim}>
        <AlertCardUi4
          body={points}
          marginRem={[0.5, 0.5, 0, 0.5]}
          title={lstrings.sync_status_title}
          type="warning"
        />
      </EdgeAnim>
    )
  }

  function renderButtons(): React.ReactElement {
    const styles = getStyles(theme)
    const hideStaking = !isStakingAvailable
    const bestApyText = getBestApyText(stakePolicies)

    // For UK compliance, we only allow swap without buy/sell, so we don't need
    // to show the trade modal in all cases, and if swap is disabled, we don't
    // show this button at all.
    const { disableSwaps = false } = config
    const hideSwap = disableSwaps && countryCode === 'GB'

    return (
      <View style={styles.buttonsContainer}>
        <IconButton
          label={lstrings.fragment_request_subtitle}
          onPress={handleRequest}
        >
          <Ionicons
            name="arrow-down"
            size={theme.rem(2)}
            color={theme.primaryText}
          />
        </IconButton>
        <IconButton
          label={lstrings.fragment_send_subtitle}
          onPress={handleSend}
        >
          <Ionicons
            name="arrow-up"
            size={theme.rem(2)}
            color={theme.primaryText}
          />
        </IconButton>
        {hideStaking ? null : (
          <IconButton
            disabled={
              stakePlugins.length === 0 &&
              wallet.currencyInfo.pluginId !== 'fio'
            }
            label={getUkCompliantString(countryCode, 'stake_earn_button_label')}
            onPress={handleStakePress}
            superscriptLabel={bestApyText}
          >
            <Feather
              name="percent"
              size={theme.rem(1.75)}
              color={theme.primaryText}
            />
          </IconButton>
        )}
        {hideSwap ? null : (
          <IconButton
            label={lstrings.trade_currency}
            onPress={
              countryCode === 'GB'
                ? () => {
                    handleTradeSwap()
                  }
                : handleTrade
            }
          >
            <Ionicons
              name="swap-horizontal"
              size={theme.rem(2)}
              color={theme.primaryText}
            />
          </IconButton>
        )}
      </View>
    )
  }

  const handleRequest = useHandler((): void => {
    triggerHaptic('impactLight')
    if (!checkAndShowLightBackupModal(account, navigation as NavigationBase)) {
      navigation.push('request', { tokenId, walletId: wallet.id })
    }
  })

  const handleSend = useHandler((): void => {
    triggerHaptic('impactLight')
    // Houdini incognito-send prototype (Proposal A): route the wallet Send button
    // to the reorganized scene instead of the production send scene.
    navigation.push('houdiniSend', {
      walletId: wallet.id,
      tokenId,
      layout: 'a',
      variant: 'a1'
    })
  })

  const handleStakePress = useHandler((): void => {
    triggerHaptic('impactLight')

    // Handle FIO staking
    if (wallet.currencyInfo.pluginId === 'fio' && tokenId == null) {
      navigation.push('fioStakingOverview', {
        tokenId,
        walletId: wallet.id
      })
      return
    }

    // Handle StakePlugin staking
    if (stakePolicies.length === 1) {
      const stakePolicyId = stakePolicies[0].stakePolicyId
      const stakePlugin = getPluginFromPolicyId(stakePlugins, stakePolicyId, {
        pluginId: wallet.currencyInfo.pluginId
      })
      if (stakePlugin != null)
        navigation.push('stakeOverview', {
          stakePlugin,
          walletId: wallet.id,
          stakePolicyId
        })
    } else {
      // More than one option or stakePolicies are not yet loaded/populated
      navigation.push('stakeOptions', {
        walletId: wallet.id,
        tokenId
      })
    }
  })

  return (
    <>
      {searching ? null : (
        <>
          <EdgeCard paddingRem={1}>
            {renderBalanceBox()}
            {!isStakingAvailable ? null : renderStakedBalance()}
          </EdgeCard>
          {renderSyncStatus()}
          {renderButtons()}
        </>
      )}
      {isEmpty || searching ? null : (
        <VisaCardCard
          wallet={wallet}
          tokenId={tokenId}
          navigation={navigation}
        />
      )}
    </>
  )
}

const syncCardExitAnim = {
  type: 'stretchOutY',
  duration: 300
} as const

const getStyles = cacheStyles((theme: Theme) => ({
  // Balance Box
  balanceBoxContainer: {
    marginTop: theme.rem(1.5)
  },
  balanceBoxWalletNameCurrencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.rem(0.5)
  },
  balanceBoxWalletNameContainer: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBaseColor,
    borderRadius: 100,
    paddingHorizontal: theme.rem(0.75),
    paddingVertical: theme.rem(0.25),
    marginRight: theme.rem(0.5)
  },
  balanceBoxCryptoBalanceContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1
  },
  balanceBoxWalletName: {
    flexShrink: 1,
    fontSize: theme.rem(0.75),
    lineHeight: theme.rem(1.5)
  },
  balanceBoxCurrency: {
    fontSize: theme.rem(1.75),
    fontFamily: theme.fontFaceMedium,
    flexShrink: 1
  },
  balanceFiatBalance: {
    fontSize: theme.rem(1.25)
  },
  eyeIcon: {
    marginLeft: theme.rem(0.5),
    marginRight: theme.rem(0),
    flexGrow: 1,
    alignSelf: 'center',
    ...theme.cardTextShadow
  },
  settingsTouchContainer: {
    alignSelf: 'center',

    // Extra tappability:
    margin: -theme.rem(0.75),
    padding: theme.rem(0.75),

    // Asymmetric adjustments to above margin/paddings:
    paddingRight: theme.rem(0.5),

    // Whitespace adjustments:
    marginRight: -theme.rem(0.75)
  },
  // Send/Receive/Earn/Trade Buttons
  buttonsContainer: {
    flexShrink: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly'
  },
  buttons: {
    flexShrink: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonsText: {
    fontSize: theme.rem(1),
    color: theme.textLink,
    fontFamily: theme.fontFaceMedium
  },

  // Trade modal
  dualIconContainer: {
    flexDirection: 'row',
    paddingVertical: theme.rem(0.5),
    width: theme.rem(2.5)
  },
  singleIconContainer: {
    flexDirection: 'row',
    width: theme.rem(2.5)
  },

  // Transactions Divider
  transactionsDividerText: {
    fontFamily: theme.fontFaceMedium
  },

  // Staking Box
  stakingBoxContainer: {
    height: theme.rem(1.25),
    minWidth: theme.rem(18),
    maxWidth: '70%',
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
