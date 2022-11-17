import { div, lt, max, mul } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { AAVE_SUPPORT_ARTICLE_URL_1S } from '../../../constants/aaveConstants'
import { guiPlugins } from '../../../constants/plugins/GuiPlugins'
import { useRunningActionQueueId } from '../../../controllers/action-queue/ActionQueueStore'
import { makeWyreClient, PaymentMethod } from '../../../controllers/action-queue/WyreClient'
import { useAllTokens } from '../../../hooks/useAllTokens'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import { useCurrencyFiatRate } from '../../../hooks/useTokenDisplayData'
import { useUrlHandler } from '../../../hooks/useUrlHandler'
import { useWalletBalance } from '../../../hooks/useWalletBalance'
import { useWalletName } from '../../../hooks/useWalletName'
import { useWatch } from '../../../hooks/useWatch'
import { toPercentString } from '../../../locales/intl'
import s from '../../../locales/strings'
import { convertCurrency } from '../../../selectors/WalletSelectors'
import { config } from '../../../theme/appConfig'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { getBorrowPluginIconUri } from '../../../util/CdnUris'
import { getTokenId, guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { DECIMAL_PRECISION, truncateDecimals, zeroString } from '../../../util/utils'
import { Card } from '../../cards/Card'
import { FiatAmountInputCard } from '../../cards/FiatAmountInputCard'
import { TappableAccountCard } from '../../cards/TappableAccountCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { CryptoFiatAmountRow } from '../../data/row/CryptoFiatAmountRow'
import { WalletListModal, WalletListResult } from '../../modals/WalletListModal'
import { Airship, showError } from '../../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { Alert } from '../../themed/Alert'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { SceneHeader } from '../../themed/SceneHeader'
import { AprCard } from '../../tiles/AprCard'

interface Props {
  route: RouteProp<'loanCreate'>
  navigation: NavigationProp<'loanCreate'>
}

export const LoanCreateScene = (props: Props) => {
  const { navigation, route } = props
  const { borrowEngine, borrowPlugin } = route.params

  // -----------------------------------------------------------------------------
  // #region Initialization
  // -----------------------------------------------------------------------------

  const { currencyWallet: borrowEngineWallet } = borrowEngine

  // Skip directly to LoanStatusScene if an action for the same actionOpType is already being processed
  const existingProgramId = useRunningActionQueueId('loan-create', borrowEngineWallet.id)
  const existingLoanAccount = useSelector(state => state.loanManager.loanAccounts[borrowEngineWallet.id])
  if (existingProgramId != null) navigation.navigate('loanStatus', { actionQueueId: existingProgramId, loanAccountId: existingLoanAccount.id })

  // #endregion Initialization

  // -----------------------------------------------------------------------------
  // #region Constants
  // -----------------------------------------------------------------------------

  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const wallets = useWatch(account, 'currencyWallets')
  const allTokens = useAllTokens(account)

  const { fiatCurrencyCode: isoFiatCurrencyCode, currencyInfo: borrowEngineCurrencyInfo } = borrowEngineWallet
  const fiatCurrencyCode = isoFiatCurrencyCode.replace('iso:', '')
  const borrowEnginePluginId = borrowEngineCurrencyInfo.pluginId
  const excludeWalletIds = Object.keys(wallets).filter(walletId => walletId !== borrowEngineWallet.id)

  // Hard-coded src/dest assets, used as intermediate src/dest steps for cases if the
  // user selected src/dest that don't involve the borrowEngineWallet.
  // Currently, the only use case is selecting fiat (bank) as a src/dest.
  const hardCollateralCurrencyCode = 'WBTC'
  const { tokenId: hardSrcTokenAddr } = React.useMemo(
    () => guessFromCurrencyCode(account, { currencyCode: hardCollateralCurrencyCode, pluginId: borrowEnginePluginId }),
    [account, borrowEnginePluginId]
  )
  const { tokenId: hardDestTokenAddr } = React.useMemo(
    () => guessFromCurrencyCode(account, { currencyCode: 'USDC', pluginId: borrowEnginePluginId }),
    [account, borrowEnginePluginId]
  )
  const hardAllowedSrcAsset = [{ pluginId: borrowEnginePluginId, tokenId: hardSrcTokenAddr }, { pluginId: 'bitcoin' }]
  const hardAllowedDestAsset = [{ pluginId: borrowEnginePluginId, tokenId: hardDestTokenAddr }]

  const ltvRatio = borrowPlugin.borrowInfo.maxLtvRatio.toString()

  const iconUri = React.useMemo(() => getBorrowPluginIconUri(borrowPlugin.borrowInfo), [borrowPlugin.borrowInfo])

  // #endregion Constants

  // -----------------------------------------------------------------------------
  // #region State
  // -----------------------------------------------------------------------------

  // #region Borrow Engine Wallet Data

  const borrowEngineWalletPluginId = borrowEngineWallet.currencyInfo.pluginId

  const collateralTokenId = getTokenId(account, borrowEngineWalletPluginId, hardCollateralCurrencyCode)
  const collateralToken = collateralTokenId != null ? allTokens[borrowEngineWalletPluginId][collateralTokenId] : null
  const collateralDenoms = collateralToken != null ? collateralToken.denominations : borrowEngineWallet.currencyInfo.denominations
  const collateralExchangeMultiplier = collateralDenoms[0].multiplier

  // #endregion Borrow Engine Wallet Data

  // #region Source Wallet Data

  const [srcWalletId, setSrcWalletId] = React.useState<string | undefined>(undefined)
  const [srcTokenId, setSrcTokenId] = React.useState<string | undefined>(undefined)
  const [srcCurrencyCode, setSrcCurrencyCode] = React.useState<string | undefined>(undefined)

  const srcWallet = srcWalletId == null ? undefined : wallets[srcWalletId]
  const srcPluginId = srcWallet == null ? null : srcWallet.currencyInfo.pluginId
  const srcToken = srcTokenId != null && srcPluginId != null ? allTokens[srcPluginId][srcTokenId] : null
  const srcBalance = useWalletBalance(srcWallet ?? borrowEngineWallet, srcTokenId) // HACK: Balance isn't being used anyway if the src wallet hasn't been chosen yet. Default to the borrow engine wallet in this case so this hook can be used
  const srcWalletName = useWalletName(srcWallet ?? borrowEngineWallet) // HACK: srcWalletName is used for the warning card display, which would never show unless the srcWallet has been set.
  const srcAssetName = srcToken != null ? srcToken.displayName : srcWallet != null ? srcWallet.currencyInfo.displayName : ''

  const srcDenoms =
    srcToken != null ? srcToken.denominations : srcWallet != null && srcWallet.currencyInfo != null ? srcWallet.currencyInfo.denominations : null
  const srcExchangeMultiplier = srcDenoms == null ? '0' : srcDenoms[0].multiplier

  // #endregion Source Wallet Data

  // #region Destination Wallet/Bank Data

  const [destWallet, setDestWallet] = React.useState<EdgeCurrencyWallet | undefined>(undefined)
  const [destTokenId, setDestTokenId] = React.useState<string | undefined>(undefined)
  const [destBankId, setDestBankId] = React.useState<string | undefined>(undefined)

  const [bankAccountsMap, setBankAccountsMap] = React.useState<{ [paymentMethodId: string]: PaymentMethod } | undefined>(undefined)

  useAsyncEffect(async () => {
    const wyreClient = await makeWyreClient({ account })
    if (wyreClient.isAccountSetup) {
      setBankAccountsMap(await wyreClient.getPaymentMethods())
    }
  }, [account])
  const paymentMethod = destBankId == null || bankAccountsMap == null || Object.keys(bankAccountsMap).length === 0 ? undefined : bankAccountsMap[destBankId]

  // #endregion Destination Wallet/Bank Data

  // #region Borrow Amounts

  const [borrowAmountFiat, setBorrowAmountFiat] = React.useState('0')
  const [nativeCryptoBorrowAmount, setNativeCryptoBorrowAmount] = React.useState('0')

  // #endregion Borrow Amounts

  // #region APR
  const [isLoading, setIsLoading] = React.useState(false)
  const debts = useWatch(borrowEngine, 'debts')
  const [apr, setApr] = React.useState(0)
  useAsyncEffect(async () => {
    if (destTokenId != null) {
      const destDebt = debts.find(debt => debt.tokenId === destTokenId)
      if (destDebt != null) {
        const apr = await borrowEngine.getAprQuote(destTokenId)
        setApr(apr)
      }
    }
  }, [debts, destTokenId])
  // #endregion APR

  // #region Required Collateral, LTV
  // TODO: LTV is calculated in equivalent ETH value, NOT USD! These calcs/limits/texts might need to be updated...

  // Total amount of collateral required
  const totalRequiredCollateralFiat = div(borrowAmountFiat, ltvRatio, DECIMAL_PRECISION)

  // Convert required collateral in fiat -> required collateral in crypto
  // We want to use the same isoFiatCurrencyCode throughout the scene,
  // regardless of what srcWallet's isoFiatCurrencyCode is, so all these
  // conversions have the same quote asset.
  const collateralToFiatRate = useCurrencyFiatRate({ currencyCode: srcCurrencyCode, isoFiatCurrencyCode })

  const isUserInputComplete =
    srcWallet != null && (destWallet != null || destBankId != null) && !zeroString(borrowAmountFiat) && !zeroString(collateralToFiatRate)
  let totalRequiredCollateralNativeAmount = !isUserInputComplete
    ? '0'
    : truncateDecimals(mul(collateralExchangeMultiplier, div(totalRequiredCollateralFiat, collateralToFiatRate, DECIMAL_PRECISION)), 0)

  // #region Calculate Swaps

  const isRequiresSwap =
    !zeroString(totalRequiredCollateralNativeAmount) && srcWallet != null && srcCurrencyCode != null && srcWallet.id !== borrowEngineWallet.id

  // Calculate how much collateral asset we can obtain after swapping from src asset
  const srcToCollateralExchangeRate = useSelector(state => {
    const exchangeRate = isRequiresSwap ? convertCurrency(state, srcCurrencyCode, hardCollateralCurrencyCode) : '1'
    // HACK: We don't have BTC->WBTC exchange rates for now, but this selector
    // will be needed in the future for supporting non-like-kind swaps for collateral
    return zeroString(exchangeRate) ? '1' : exchangeRate
  })

  const minSwapInputNativeAmount = useSelector(state =>
    isRequiresSwap && borrowPlugin.borrowInfo.currencyPluginId === 'polygon' && srcCurrencyCode != null && srcExchangeMultiplier != null
      ? truncateDecimals(mul('110', convertCurrency(state, 'iso:USD', srcCurrencyCode, srcExchangeMultiplier)), 0)
      : '0'
  )

  if (isRequiresSwap) {
    // Calculate how much src asset we need to swap
    const requiredSwapInputNativeAmount = truncateDecimals(div(totalRequiredCollateralNativeAmount, srcToCollateralExchangeRate, DECIMAL_PRECISION), 0)

    // Factor in swap minimums for totalRequiredCollateralNativeAmount
    totalRequiredCollateralNativeAmount = mul(max(requiredSwapInputNativeAmount, minSwapInputNativeAmount), srcToCollateralExchangeRate)
  }

  // #endregion Calculate Swaps

  const expectedCollateralBalance = truncateDecimals(mul(srcBalance, srcToCollateralExchangeRate), 0)

  const isInsufficientCollateral =
    zeroString(totalRequiredCollateralNativeAmount) || zeroString(srcToCollateralExchangeRate)
      ? false
      : lt(expectedCollateralBalance, totalRequiredCollateralNativeAmount)
  const displayLtvLimit = React.useMemo(() => toPercentString(ltvRatio), [ltvRatio])

  // #endregion Required Collateral, LTV

  // #endregion State

  // -----------------------------------------------------------------------------
  // #region Handlers
  // -----------------------------------------------------------------------------

  const handleInfoIconPress = useUrlHandler(sprintf(AAVE_SUPPORT_ARTICLE_URL_1S, 'borrow-with-aave'))

  /**
   * Show a wallet picker modal filtered by the allowed assets defined by the
   * "Source of Collateral" or "Fund Destination" inputs
   */
  const handleShowWalletPickerModal = (srcDest: 'source' | 'destination') => () => {
    const isSrc = srcDest === 'source'
    Airship.show((bridge: AirshipBridge<WalletListResult>) => (
      <WalletListModal
        bridge={bridge}
        headerTitle={s.strings.select_wallet}
        showCreateWallet={!isSrc}
        createWalletId={!isSrc ? borrowEngineWallet.id : undefined}
        showBankOptions={!isSrc}
        excludeWalletIds={!isSrc ? excludeWalletIds : undefined}
        allowedAssets={!isSrc ? hardAllowedDestAsset : hardAllowedSrcAsset}
        filterActivation
      />
    ))
      .then(async ({ walletId, currencyCode, isBankSignupRequest, wyreAccountId }) => {
        if (isBankSignupRequest) {
          // Open bank plugin for new user signup
          navigation.navigate('pluginView', {
            plugin: guiPlugins.wyre,
            deepPath: '',
            deepQuery: {}
          })
        } else if (wyreAccountId != null) {
          // Set a hard-coded intermediate AAVE loan destination asset (USDC) to
          // use for the bank sell step that comes after the initial loan
          setDestBankId(wyreAccountId)
          setDestWallet(borrowEngineWallet)
          setDestTokenId(hardDestTokenAddr)
        } else if (walletId != null && currencyCode != null) {
          const selectedWallet = wallets[walletId]
          const { tokenId } = guessFromCurrencyCode(account, { currencyCode, pluginId: selectedWallet.currencyInfo.pluginId })
          if (isSrc) {
            setSrcWalletId(walletId)
            setSrcTokenId(tokenId)
            setSrcCurrencyCode(currencyCode)
          } else {
            setDestBankId(undefined)
            setDestWallet(selectedWallet)
            setDestTokenId(tokenId)

            try {
              setIsLoading(true)
              setApr(await borrowEngine.getAprQuote(hardDestTokenAddr))
            } catch (err: any) {
              showError(err)
            } finally {
              setIsLoading(false)
            }
          }
        }
      })
      .catch(e => showError(e.message))
  }

  const handleBorrowAmountChanged = React.useCallback((fiatAmount, nativeCryptoAmount) => {
    setBorrowAmountFiat(fiatAmount)
    setNativeCryptoBorrowAmount(nativeCryptoAmount)
  }, [])

  // #endregion Handlers

  // -----------------------------------------------------------------------------
  // #region Renderers
  // -----------------------------------------------------------------------------

  const collateralWarningMsg = React.useMemo(
    () => sprintf(s.strings.loan_insufficient_funds_warning, srcAssetName, srcWalletName, srcCurrencyCode, config.appName),
    [srcAssetName, srcCurrencyCode, srcWalletName]
  )
  const renderWarning = useHandler(() => {
    // User doesn't have required collateral wallet enabled or 0 balance
    if (isUserInputComplete && isInsufficientCollateral)
      return (
        <Alert
          numberOfLines={0}
          marginRem={[0.5, 0.5, 0.5, 0.5]}
          title={s.strings.exchange_insufficient_funds_title}
          message={collateralWarningMsg}
          type="warning"
        />
      )
    else return null
  })

  // #endregion Renderers

  return (
    <SceneWrapper>
      <SceneHeader
        underline
        title={s.strings.loan_create_title}
        withTopMargin
        tertiary={
          <TouchableOpacity onPress={handleInfoIconPress}>
            <Ionicon name="information-circle-outline" size={theme.rem(1.25)} color={theme.iconTappable} />
          </TouchableOpacity>
        }
      />
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <View style={styles.sceneContainer}>
          {/* Amount  to borrow */}
          <FiatAmountInputCard
            wallet={destWallet == null ? borrowEngineWallet : destWallet}
            iconUri={iconUri}
            inputModalMessage={sprintf(s.strings.loan_loan_amount_input_message_s, displayLtvLimit)}
            title={sprintf(s.strings.loan_enter_s_amount_s, s.strings.loan_fragment_loan, fiatCurrencyCode)}
            tokenId={destTokenId}
            onAmountChanged={handleBorrowAmountChanged}
          />

          {/* APR */}
          {isLoading ? (
            <ActivityIndicator color={theme.textLink} style={styles.cardContainer} />
          ) : (
            <View style={styles.cardContainer}>
              <AprCard apr={apr} />
            </View>
          )}

          {/* Source of Collateral / Source Wallet */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_collateral_source}</EdgeText>

          <TappableAccountCard
            emptyLabel={s.strings.loan_select_source_collateral}
            selectedAsset={{ wallet: srcWallet, tokenId: srcTokenId }}
            onPress={handleShowWalletPickerModal('source')}
          />

          {/* Fund Destination */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_debt_destination}</EdgeText>

          <TappableAccountCard
            emptyLabel={s.strings.loan_select_receiving_wallet}
            onPress={handleShowWalletPickerModal('destination')}
            selectedAsset={{ wallet: destWallet, tokenId: destTokenId, paymentMethod }}
          />

          {/* Collateral Amount Required / Collateral Amount */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_collateral_required}</EdgeText>
          <Card marginRem={[0.5, 0.5, 0.5, 0.5]}>
            {srcWallet == null || destWallet == null ? (
              <EdgeText style={[styles.textInitial, { margin: theme.rem(0.5) }]}>
                {srcWallet == null ? s.strings.loan_select_source_collateral : s.strings.loan_select_receiving_wallet}
              </EdgeText>
            ) : (
              <CryptoFiatAmountRow nativeAmount={totalRequiredCollateralNativeAmount} tokenId={srcTokenId} wallet={srcWallet} marginRem={0.25} />
            )}
          </Card>

          {/* Insufficient Collateral Warning Card */}
          {renderWarning()}

          {destWallet == null ? null : (
            <MainButton
              label={s.strings.string_next_capitalized}
              disabled={isInsufficientCollateral || !isUserInputComplete}
              type="secondary"
              onPress={() => {
                if (destTokenId == null || srcWallet == null) return

                navigation.navigate('loanCreateConfirmation', {
                  borrowEngine,
                  borrowPlugin,
                  destWallet,
                  destTokenId,
                  nativeDestAmount: nativeCryptoBorrowAmount,
                  nativeSrcAmount: totalRequiredCollateralNativeAmount,
                  paymentMethod,
                  srcWallet,
                  srcTokenId
                })
              }}
              marginRem={[1.5, 6, 6, 6]}
            />
          )}
        </View>
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'column',
    margin: theme.rem(0.5)
  },
  textInitial: {
    alignSelf: 'flex-start',
    fontSize: theme.rem(0.75),
    fontFamily: theme.fontFaceMedium,
    margin: theme.rem(1)
  },
  textTitle: {
    alignSelf: 'flex-start',
    color: theme.secondaryText,
    fontFamily: theme.fontFaceBold,
    fontSize: theme.rem(0.75),
    margin: theme.rem(0.5),
    textAlign: 'left'
  },
  sceneContainer: {
    flex: 1,
    flexDirection: 'column',
    margin: theme.rem(0.5),
    marginTop: theme.rem(0)
  }
}))
