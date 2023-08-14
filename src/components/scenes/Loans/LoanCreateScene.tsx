import { div, lt, max, mul } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, TouchableOpacity } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { AAVE_SUPPORT_ARTICLE_URL_1S } from '../../../constants/aaveConstants'
import { guiPlugins } from '../../../constants/plugins/GuiPlugins'
import { PaymentMethod } from '../../../controllers/action-queue/WyreClient'
import { useAllTokens } from '../../../hooks/useAllTokens'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import { useCurrencyFiatRate } from '../../../hooks/useTokenDisplayData'
import { useUrlHandler } from '../../../hooks/useUrlHandler'
import { useWalletBalance } from '../../../hooks/useWalletBalance'
import { useWalletName } from '../../../hooks/useWalletName'
import { useWatch } from '../../../hooks/useWatch'
import { toPercentString } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import { convertCurrency } from '../../../selectors/WalletSelectors'
import { config } from '../../../theme/appConfig'
import { useSelector } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getWalletPickerExcludeWalletIds } from '../../../util/borrowUtils'
import { getBorrowPluginIconUri } from '../../../util/CdnUris'
import { getTokenId } from '../../../util/CurrencyInfoHelpers'
import { enableToken } from '../../../util/CurrencyWalletHelpers'
import { DECIMAL_PRECISION, truncateDecimals, zeroString } from '../../../util/utils'
import { Card } from '../../cards/Card'
import { FiatAmountInputCard } from '../../cards/FiatAmountInputCard'
import { TappableAccountCard } from '../../cards/TappableAccountCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { CryptoFiatAmountRow } from '../../data/row/CryptoFiatAmountRow'
import { Space } from '../../layout/Space'
import { WalletListModal, WalletListResult } from '../../modals/WalletListModal'
import { Airship, showError } from '../../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { Alert } from '../../themed/Alert'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { SceneHeader } from '../../themed/SceneHeader'
import { AprCard } from '../../tiles/AprCard'

interface Props extends EdgeSceneProps<'loanCreate'> {}

export const LoanCreateScene = (props: Props) => {
  const { navigation, route } = props
  const { borrowEngine, borrowPlugin } = route.params

  // -----------------------------------------------------------------------------
  // #region Initialization
  // -----------------------------------------------------------------------------

  const { currencyWallet: borrowEngineWallet } = borrowEngine

  // Force enable tokens required for loan
  useAsyncEffect(async () => {
    await enableToken('WBTC', borrowEngineWallet)
    await enableToken('USDC', borrowEngineWallet)
  }, [])

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

  // Hard-coded src/dest assets, used as intermediate src/dest steps for cases if the
  // user selected src/dest that don't involve the borrowEngineWallet.
  // Currently, the only use case is selecting fiat (bank) as a src/dest.
  const hardCollateralCurrencyCode = 'WBTC'
  const hardSrcTokenAddr = React.useMemo(() => getTokenId(account, borrowEnginePluginId, hardCollateralCurrencyCode), [account, borrowEnginePluginId])
  const hardDestTokenAddr = React.useMemo(() => getTokenId(account, borrowEnginePluginId, 'USDC'), [account, borrowEnginePluginId])
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
    // TODO: Re-enable when new fiat ramp partner is avialable:
    setBankAccountsMap(undefined)
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
      ? truncateDecimals(mul('30', convertCurrency(state, 'iso:USD', srcCurrencyCode, srcExchangeMultiplier)), 0)
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
        navigation={navigation}
        headerTitle={lstrings.select_wallet}
        showCreateWallet
        createWalletId={!isSrc ? borrowEngineWallet.id : undefined}
        showBankOptions={!isSrc}
        excludeWalletIds={getWalletPickerExcludeWalletIds(wallets, isSrc ? 'loan-manage-deposit' : 'loan-manage-borrow', borrowEngineWallet)}
        allowedAssets={!isSrc ? hardAllowedDestAsset : hardAllowedSrcAsset}
        filterActivation
      />
    ))
      .then(async ({ walletId, currencyCode, isBankSignupRequest, fiatAccountId }) => {
        if (isBankSignupRequest) {
          // Open bank plugin for new user signup
          navigation.navigate('pluginView', {
            plugin: guiPlugins.wyre,
            deepPath: '',
            deepQuery: {}
          })
        } else if (fiatAccountId != null) {
          // Set a hard-coded intermediate AAVE loan destination asset (USDC) to
          // use for the bank sell step that comes after the initial loan
          setDestBankId(fiatAccountId)
          setDestWallet(borrowEngineWallet)
          setDestTokenId(hardDestTokenAddr)
        } else if (walletId != null && currencyCode != null) {
          const selectedWallet = wallets[walletId]
          const tokenId = getTokenId(account, selectedWallet.currencyInfo.pluginId, currencyCode)
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

  const handleBorrowAmountChanged = React.useCallback((fiatAmount: string, nativeCryptoAmount: string) => {
    setBorrowAmountFiat(fiatAmount)
    setNativeCryptoBorrowAmount(nativeCryptoAmount)
  }, [])

  // #endregion Handlers

  // -----------------------------------------------------------------------------
  // #region Renderers
  // -----------------------------------------------------------------------------

  const collateralWarningMsg = React.useMemo(
    () => sprintf(lstrings.loan_insufficient_funds_warning, srcAssetName, srcWalletName, srcCurrencyCode, config.appName),
    [srcAssetName, srcCurrencyCode, srcWalletName]
  )
  const renderWarning = useHandler(() => {
    // User doesn't have required collateral wallet enabled or 0 balance
    if (isUserInputComplete && isInsufficientCollateral)
      return (
        <Alert
          numberOfLines={0}
          marginRem={[0.5, 0.5, 0.5, 0.5]}
          title={lstrings.exchange_insufficient_funds_title}
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
        tertiary={
          <TouchableOpacity onPress={handleInfoIconPress}>
            <Ionicon name="information-circle-outline" size={theme.rem(1.25)} color={theme.iconTappable} />
          </TouchableOpacity>
        }
        title={lstrings.loan_create_title}
        underline
        withTopMargin
      />
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <Space horizontal={0.5} bottom={1} top={0.5}>
          {/* Amount  to borrow */}
          <FiatAmountInputCard
            wallet={destWallet == null ? borrowEngineWallet : destWallet}
            iconUri={iconUri}
            inputModalMessage={sprintf(lstrings.loan_loan_amount_input_message_s, displayLtvLimit)}
            title={sprintf(lstrings.loan_enter_s_amount_s, lstrings.loan_fragment_loan, fiatCurrencyCode)}
            tokenId={destTokenId}
            onAmountChanged={handleBorrowAmountChanged}
          />

          {/* APR */}
          {isLoading ? (
            <ActivityIndicator color={theme.textLink} style={styles.cardContainer} />
          ) : (
            <Space around>
              <AprCard apr={apr} />
            </Space>
          )}

          {/* Source of Collateral / Source Wallet */}
          <EdgeText style={styles.textTitle}>{lstrings.loan_collateral_source}</EdgeText>

          <TappableAccountCard
            emptyLabel={lstrings.loan_select_source_collateral}
            selectedAsset={{ wallet: srcWallet, tokenId: srcTokenId }}
            onPress={handleShowWalletPickerModal('source')}
            marginRem={[0, 0.5, 0.5, 0.5]}
          />

          {/* Fund Destination */}
          <EdgeText style={styles.textTitle}>{lstrings.loan_debt_destination}</EdgeText>

          <TappableAccountCard
            emptyLabel={lstrings.loan_select_receiving_wallet}
            onPress={handleShowWalletPickerModal('destination')}
            selectedAsset={{ wallet: destWallet, tokenId: destTokenId, paymentMethod }}
            marginRem={[0, 0.5, 0.5, 0.5]}
          />

          {/* Collateral Amount Required / Collateral Amount */}
          <EdgeText style={styles.textTitle}>{lstrings.loan_collateral_required}</EdgeText>
          <Card marginRem={[0, 0.5, 0.5, 0.5]}>
            {srcWallet == null || destWallet == null ? (
              <EdgeText style={[styles.textInitial, { margin: theme.rem(0.5) }]}>
                {srcWallet == null ? lstrings.loan_select_source_collateral : lstrings.loan_select_receiving_wallet}
              </EdgeText>
            ) : (
              <CryptoFiatAmountRow nativeAmount={totalRequiredCollateralNativeAmount} tokenId={srcTokenId} wallet={srcWallet} marginRem={0.25} />
            )}
          </Card>

          {/* Insufficient Collateral Warning Card */}
          {renderWarning()}

          {destWallet == null ? null : (
            <Space around={1}>
              <MainButton
                label={lstrings.string_next_capitalized}
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
                alignSelf="center"
              />
            </Space>
          )}
        </Space>
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
  }
}))
