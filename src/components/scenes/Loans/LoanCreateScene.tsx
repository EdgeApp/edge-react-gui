import { div, lt, mul } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { sprintf } from 'sprintf-js'

import { guiPlugins } from '../../../constants/plugins/GuiPlugins'
import { useRunningActionQueueId } from '../../../controllers/action-queue/ActionQueueStore'
import { makeWyreClient, PaymentMethod } from '../../../controllers/action-queue/WyreClient'
import { useAllTokens } from '../../../hooks/useAllTokens'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import { useTokenDisplayData } from '../../../hooks/useTokenDisplayData'
import { useWalletBalance } from '../../../hooks/useWalletBalance'
import { useWalletName } from '../../../hooks/useWalletName'
import { useWatch } from '../../../hooks/useWatch'
import { toPercentString } from '../../../locales/intl'
import s from '../../../locales/strings'
import { config } from '../../../theme/appConfig'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { getBorrowPluginIconUri } from '../../../util/CdnUris'
import { guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
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

type Props = {
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
  const { tokenId: hardSrcTokenAddr } = React.useMemo(
    () => guessFromCurrencyCode(account, { currencyCode: 'WBTC', pluginId: borrowEnginePluginId }),
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

  // #region Source Wallet Data
  const [srcWalletId, setSrcWalletId] = React.useState<string | undefined>(undefined)
  const [srcTokenId, setSrcTokenId] = React.useState<string | undefined>(undefined)
  const [srcCurrencyCode, setSrcCurrencyCode] = React.useState<string | undefined>(undefined)

  const srcWallet = srcWalletId == null ? undefined : wallets[srcWalletId]
  const srcPluginId = srcWallet == null ? null : srcWallet.currencyInfo.pluginId
  const srcToken = React.useMemo(
    () => (srcTokenId != null && srcPluginId != null ? allTokens[srcPluginId][srcTokenId] : null),
    [allTokens, srcPluginId, srcTokenId]
  )
  const srcBalance = useWalletBalance(srcWallet ?? borrowEngineWallet, srcTokenId) // HACK: Balance isn't being used anyway if the src wallet hasn't been chosen yet. Default to the borrow engine wallet in this case so this hook can be used
  const srcWalletName = useWalletName(srcWallet ?? borrowEngineWallet) // HACK: srcWalletName is used for the warning card display, which would never show unless the srcWallet has been set.
  const srcAssetName = srcToken != null ? srcToken.displayName : srcWallet != null ? srcWallet.currencyInfo.displayName : ''
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
  const isUserInputComplete = (srcTokenId != null || srcWallet != null) && (destTokenId != null || destBankId != null) && !zeroString(borrowAmountFiat)
  // TODO: LTV is calculated in equivalent ETH value, NOT USD! These calcs/limits/texts might need to be updated...
  const requiredFiat = React.useMemo(() => div(borrowAmountFiat, ltvRatio, DECIMAL_PRECISION), [borrowAmountFiat, ltvRatio])

  // Convert collateral in fiat -> collateral crypto
  const { assetToFiatRate: srcToFiatRate } = useTokenDisplayData({
    tokenId: srcTokenId,
    wallet: srcWallet ?? borrowEngineWallet
  })

  const srcDenoms = !isUserInputComplete
    ? null
    : srcToken != null
    ? srcToken.denominations
    : srcWallet != null && srcWallet.currencyInfo != null
    ? srcWallet.currencyInfo.denominations
    : []

  const srcExchangeMultiplier = srcDenoms == null ? '0' : srcDenoms[0].multiplier
  const nativeRequiredCrypto = !isUserInputComplete ? '0' : truncateDecimals(mul(srcExchangeMultiplier, div(requiredFiat, srcToFiatRate, DECIMAL_PRECISION)), 0)

  const isLtvExceeded = zeroString(nativeRequiredCrypto) ? false : lt(srcBalance, nativeRequiredCrypto)
  const displayLtvLimit = React.useMemo(() => toPercentString(ltvRatio), [ltvRatio])
  // #endregion Required Collateral, LTV

  // #endregion State

  // -----------------------------------------------------------------------------
  // #region Handlers
  // -----------------------------------------------------------------------------

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
    if (srcWallet != null && zeroString(srcBalance))
      return (
        <Alert
          numberOfLines={0}
          marginRem={[0.5, 0.5, 0.5, 0.5]}
          title={s.strings.exchange_insufficient_funds_title}
          message={collateralWarningMsg}
          type="warning"
        />
      )
    // User completed Borrow Amount entry before finishing the src/dest wallet
    // destinations, and the combination of all inputs exceed LTV ratio.
    else if (isUserInputComplete && isLtvExceeded)
      return (
        <Alert
          numberOfLines={0}
          marginRem={[0.5, 0.5, 0.5, 0.5]}
          title={s.strings.exchange_insufficient_funds_title}
          message={sprintf(s.strings.loan_amount_exceeds_s_collateral, displayLtvLimit)}
          type="error"
        />
      )
    else return null
  })

  // #endregion Renderers

  return (
    <SceneWrapper>
      <SceneHeader underline title={s.strings.loan_create_title} />
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <View style={styles.sceneContainer}>
          {/* Amount  to borrow */}
          <FiatAmountInputCard
            wallet={destWallet == null ? borrowEngineWallet : destWallet}
            iconUri={iconUri}
            inputModalMessage={sprintf(s.strings.loan_must_be_s_or_less, displayLtvLimit)}
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
              <CryptoFiatAmountRow nativeAmount={nativeRequiredCrypto} tokenId={srcTokenId} wallet={srcWallet} marginRem={0.25} />
            )}
          </Card>

          {/* Insufficient Collateral Warning Card */}
          {renderWarning()}

          {destWallet == null ? null : (
            <MainButton
              label={s.strings.string_next_capitalized}
              disabled={isLtvExceeded || !isUserInputComplete}
              type="secondary"
              onPress={() => {
                if (destTokenId == null || srcWallet == null) return

                navigation.navigate('loanCreateConfirmation', {
                  borrowEngine,
                  borrowPlugin,
                  destWallet,
                  destTokenId,
                  nativeDestAmount: nativeCryptoBorrowAmount,
                  nativeSrcAmount: nativeRequiredCrypto,
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
