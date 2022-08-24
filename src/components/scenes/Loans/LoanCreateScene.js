// @flow

import { div, lt, mul } from 'biggystring'
import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { sprintf } from 'sprintf-js'

import { useRunningActionQueueId } from '../../../controllers/action-queue/ActionQueueStore'
import { useAllTokens } from '../../../hooks/useAllTokens'
import { formatFiatString } from '../../../hooks/useFiatText'
import { useHandler } from '../../../hooks/useHandler'
import { useTokenDisplayData } from '../../../hooks/useTokenDisplayData'
import { useWalletBalance } from '../../../hooks/useWalletBalance'
import { useWalletName } from '../../../hooks/useWalletName'
import { useWatch } from '../../../hooks/useWatch'
import { toPercentString } from '../../../locales/intl'
import s from '../../../locales/strings'
import { config } from '../../../theme/appConfig'
import { useCallback, useEffect, useMemo, useState } from '../../../types/reactHooks'
import { useSelector } from '../../../types/reactRedux'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes'
import { getCurrencyIconUris } from '../../../util/CdnUris'
import { guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { DECIMAL_PRECISION, truncateDecimals, zeroString } from '../../../util/utils'
import { Card } from '../../cards/Card'
import { TappableCard } from '../../cards/TappableCard'
import { ValueBarCard } from '../../cards/ValueBarCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { CryptoFiatAmountRow } from '../../data/row/CryptoFiatAmountRow'
import { CurrencyRow } from '../../data/row/CurrencyRow'
import { TextInputModal } from '../../modals/TextInputModal'
import { WalletListModal } from '../../modals/WalletListModal'
import { Airship, showError } from '../../services/AirshipInstance'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { Alert } from '../../themed/Alert'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { SceneHeader } from '../../themed/SceneHeader'
import { AprCard } from '../../tiles/AprCard'

type Props = {
  route: RouteProp<'loanCreate'>,
  navigation: NavigationProp<'loanCreate'>
}

export const LoanCreateScene = (props: Props) => {
  const { navigation, route } = props
  const { borrowEngine, borrowPlugin } = route.params
  const { currencyWallet: beWallet, debts } = borrowEngine

  const theme = useTheme()
  const styles = getStyles(theme)

  // Skip directly to LoanStatusScene if an action for the same actionOpType is already being processed
  const existingProgramId = useRunningActionQueueId('loan-create', beWallet.id)
  if (existingProgramId != null) navigation.navigate('loanStatus', { actionQueueId: existingProgramId })

  if (debts.length > 0) {
    // TODO: transition to "advanced" loan details scene
  }

  // Wallet/Token Data
  const account = useSelector(state => state.core.account)
  const wallets = useWatch(account, 'currencyWallets')
  const allTokens = useAllTokens(account)

  const { fiatCurrencyCode: isoFiatCurrencyCode, currencyInfo: beCurrencyInfo } = beWallet
  const fiatCurrencyCode = isoFiatCurrencyCode.replace('iso:', '')
  const bePluginId = beCurrencyInfo.pluginId

  // Source Wallet Data
  const [srcWalletId, setSrcWalletId] = useState()
  const [srcTokenId, setSrcTokenId] = useState()
  const [srcCurrencyCode, setSrcCurrencyCode] = useState()

  const srcWallet = srcWalletId == null ? null : wallets[srcWalletId]
  const srcPluginId = srcWallet == null ? null : srcWallet.currencyInfo.pluginId
  const srcToken = useMemo(() => (srcTokenId != null && srcPluginId != null ? allTokens[srcPluginId][srcTokenId] : null), [allTokens, srcPluginId, srcTokenId])
  const srcBalance = useWalletBalance(srcWallet ?? beWallet, srcTokenId) // HACK: Balance isn't being used anyway if the src wallet hasn't been chosen yet. Default to the borrow engine wallet in this case so this hook can be used
  const srcWalletName = useWalletName(srcWallet ?? beWallet) // HACK: srcWalletName is used for the warning card display, which would never show unless the srcWallet has been set.
  const srcAssetName = srcToken != null ? srcToken.displayName : srcWallet != null ? srcWallet.currencyInfo.displayName : ''

  // Destination Wallet Data
  const [destWallet, setDestWallet] = useState<EdgeCurrencyWallet | void>()
  const [destTokenId, setDestTokenId] = useState<string | void>()
  const [isDestBank, setIsDestBank] = useState<boolean>(false)

  // BorrowPlugin
  const [borrowAmountFiat, setBorrowAmount] = useState('0')
  const ltvRatio = borrowPlugin.borrowInfo.maxLtvRatio.toString()

  const hardBarCardIconUri = useMemo(
    () => getCurrencyIconUris('ethereum', guessFromCurrencyCode(account, { currencyCode: 'AAVE', pluginId: 'ethereum' }).tokenId).symbolImage,
    [account]
  )

  // BorrowPlugin APR
  const [isLoading, setIsLoading] = useState(false)
  const [apr, setApr] = useState()
  useEffect(() => {
    if (destTokenId != null) {
      const destDebt = borrowEngine.debts.find(debt => debt.tokenId === destTokenId)
      if (destDebt != null) setApr(destDebt.apr)
    }
  }, [borrowEngine.debts, destTokenId])

  // Hard-coded src/dest, if src/dest don't involve the wallet from the BorrowEngine
  const { tokenId: hardSrcTokenAddr } = useMemo(() => guessFromCurrencyCode(account, { currencyCode: 'WBTC', pluginId: bePluginId }), [account, bePluginId])
  const { tokenId: hardDestTokenAddr } = useMemo(() => guessFromCurrencyCode(account, { currencyCode: 'USDC', pluginId: bePluginId }), [account, bePluginId])

  /**
   * Show a wallet picker modal filtered by the allowed assets defined by the
   * "Source of Collateral" or "Fund Destination" inputs
   */
  const showWalletPickerModal = (isSrc: boolean) => {
    const excludeWalletIds = Object.keys(wallets).filter(walletId => walletId !== beWallet.id)
    const hardAllowedSrcAsset = [{ pluginId: bePluginId, tokenId: hardSrcTokenAddr }, { pluginId: 'bitcoin' }]
    const hardAllowedDestAsset = [{ pluginId: bePluginId, tokenId: hardDestTokenAddr }]

    Airship.show(bridge => (
      <WalletListModal
        bridge={bridge}
        headerTitle={s.strings.select_wallet}
        showCreateWallet={!isSrc}
        showWithdrawToBank={!isSrc}
        excludeWalletIds={!isSrc ? excludeWalletIds : undefined}
        allowedAssets={!isSrc ? hardAllowedDestAsset : hardAllowedSrcAsset}
        filterActivation
      />
    ))
      .then(async ({ walletId, currencyCode, isWithdrawToBank }) => {
        if (isWithdrawToBank) {
          setIsDestBank(true)
          setDestWallet(beWallet)
          setDestTokenId(hardDestTokenAddr)
        } else if (walletId != null && currencyCode != null) {
          const selectedWallet = wallets[walletId]
          const { tokenId } = guessFromCurrencyCode(account, { currencyCode, pluginId: selectedWallet.currencyInfo.pluginId })
          if (isSrc) {
            setSrcWalletId(walletId)
            setSrcTokenId(tokenId)
            setSrcCurrencyCode(currencyCode)
          } else {
            setIsDestBank(false)
            setDestWallet(selectedWallet)
            setDestTokenId(tokenId)

            // TODO: Handle exchange sell case
            // Fetch APR based on borrow destination
            try {
              setIsLoading(true)
              setApr(await borrowEngine.getAprQuote(hardDestTokenAddr))
            } catch (err) {
              showError(err)
            } finally {
              setIsLoading(false)
            }
          }
        }
      })
      .catch(e => showError(e.message))
  }

  /**
   * 'Source of Collateral' or 'Fund Destination' wallet cards
   */
  type WalletCardProps = {|
    disabled?: boolean,
    emptyLabel: string,
    isSrc: boolean,
    tokenId?: string,
    wallet?: EdgeCurrencyWallet,
    withdrawToBankLabel?: string
  |}
  const WalletCard = (props: WalletCardProps) => {
    const { disabled, emptyLabel, isSrc, tokenId, wallet, withdrawToBankLabel } = props
    const handleShowWalletPickerModal = useCallback(() => showWalletPickerModal(isSrc), [isSrc])

    return (
      <TappableCard disabled={disabled} onPress={handleShowWalletPickerModal} marginRem={0.5} paddingRem={0.5}>
        {withdrawToBankLabel != null ? (
          <EdgeText style={styles.textInitial}>{withdrawToBankLabel}</EdgeText>
        ) : wallet == null ? (
          <EdgeText style={disabled ? styles.textInitialDisabled : styles.textInitial}>{emptyLabel}</EdgeText>
        ) : (
          <View style={styles.currencyRow}>
            <CurrencyRow tokenId={tokenId} wallet={wallet} />
          </View>
        )}
      </TappableCard>
    )
  }

  /**
   * Main Scene Final Props & Calculations
   */

  // User has made input to all required fields
  const isUserInputComplete = (srcTokenId != null || srcWallet != null) && (destTokenId != null || isDestBank) && !zeroString(borrowAmountFiat)

  // Required Collateral
  // TODO: LTV is calculated in equivalent ETH value, NOT USD! These calcs/limits/texts might need to be updated...
  const requiredFiat = useMemo(() => div(borrowAmountFiat, ltvRatio, DECIMAL_PRECISION), [borrowAmountFiat, ltvRatio])

  // Deposit + Borrow Request Data
  // Convert collateral in fiat -> collateral crypto
  const { assetToFiatRate: srcToFiatRate } = useTokenDisplayData({
    tokenId: srcTokenId,
    wallet: srcWallet ?? beWallet
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

  // Convert borrow amount fiat -> borrow amount crypto
  const { assetToFiatRate: destToFiatRate } = useTokenDisplayData({
    tokenId: destTokenId,
    wallet: destWallet == null ? beWallet : destWallet // beWallet will always exist.
    // If the user has not yet selected a destWallet, we wouldn't be showing
    // any exchange rate, anyway, so just pass beWallet to allow this hook not to puke.
  })
  const { denominations: destDenoms } = destTokenId != null ? allTokens[bePluginId][destTokenId] : destWallet != null ? destWallet.currencyInfo : {}
  const destExchangeMultiplier = destDenoms == null ? '0' : destDenoms[0].multiplier
  const nativeBorrowAmountCrypto = !isUserInputComplete
    ? '0'
    : truncateDecimals(mul(destExchangeMultiplier, div(borrowAmountFiat, destToFiatRate, DECIMAL_PRECISION)), 0)

  const isLtvExceeded = zeroString(nativeRequiredCrypto) ? false : lt(srcBalance, nativeRequiredCrypto)

  // Borrow Amount Card
  const displayLtvLimit = useMemo(() => toPercentString(ltvRatio), [ltvRatio])

  const handleEditBorrowAmount = useCallback(() => {
    Airship.show(bridge => (
      <TextInputModal
        title={sprintf(s.strings.loan_enter_loan_amount_s, fiatCurrencyCode)}
        message={sprintf(s.strings.loan_must_be_s_or_less)}
        bridge={bridge}
        keyboardType="decimal-pad"
      />
    )).then(amount => {
      if (amount != null) {
        setBorrowAmount(amount)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fiatCurrencyCode])

  // Warning
  const collateralWarningMsg = useMemo(
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
          message={sprintf(s.strings.loan_amount_exceeds_s_collateral, displayLtvLimit, srcCurrencyCode)}
          type="error"
        />
      )
    else return null
  })

  /**
   * Main Scene Render
   */

  const displayBorrowAmount = useMemo(
    () =>
      formatFiatString({
        fiatAmount: borrowAmountFiat,
        autoPrecision: true
      }),
    [borrowAmountFiat]
  )

  return (
    <SceneWrapper>
      <SceneHeader underline title={s.strings.loan_create_title} />
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <View style={styles.sceneContainer}>
          {/* Amount  to borrow */}
          <ValueBarCard
            currencyCode="USD"
            formattedAmount={displayBorrowAmount}
            iconUri={hardBarCardIconUri}
            title={s.strings.loan_amount_borrow}
            onPress={handleEditBorrowAmount}
          />

          {/* APR */}
          {isLoading ? (
            <ActivityIndicator color={theme.textLink} style={styles.cardContainer} />
          ) : (
            <View style={styles.cardContainer}>
              <AprCard paddingRem={[0.5, 1]} apr={apr} />
            </View>
          )}

          {/* Source of Collateral / Source Wallet */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_collateral_source}</EdgeText>

          <WalletCard emptyLabel={s.strings.loan_select_source_collateral} isSrc wallet={srcWallet ?? undefined} tokenId={srcTokenId} />

          {/* Fund Destination */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_destination}</EdgeText>

          <WalletCard
            emptyLabel={s.strings.loan_select_receiving_wallet}
            withdrawToBankLabel={isDestBank ? s.strings.deposit_to_bank : undefined}
            isSrc={false}
            wallet={destWallet ?? undefined}
            tokenId={destTokenId}
          />

          {/* Collateral Amount Required / Collateral Amount */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_collateral_required}</EdgeText>
          <Card marginRem={[0.5, 0.5, 0.5, 0.5]} paddingRem={1}>
            {srcWallet == null || destWallet == null ? (
              <EdgeText style={styles.textInitial}>
                {srcWallet == null ? s.strings.loan_select_source_collateral : s.strings.loan_select_receiving_wallet}
              </EdgeText>
            ) : (
              <CryptoFiatAmountRow nativeAmount={nativeRequiredCrypto} tokenId={srcTokenId} wallet={srcWallet} />
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
                  isDestBank,
                  nativeDestAmount: nativeBorrowAmountCrypto,
                  nativeSrcAmount: nativeRequiredCrypto,
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

const getStyles = cacheStyles(theme => {
  return {
    cardContainer: {
      alignItems: 'center',
      alignSelf: 'center',
      flexDirection: 'column',
      margin: theme.rem(0.5)
    },
    currencyRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: theme.rem(0.5),
      marginBottom: theme.rem(0.5)
    },
    icon: {
      size: theme.rem(2.5)
    },
    textCardHeader: {
      fontFamily: theme.fontFaceMedium
    },
    textInitial: {
      alignSelf: 'flex-start',
      fontSize: theme.rem(0.75),
      fontFamily: theme.fontFaceMedium,
      margin: theme.rem(0.5)
    },
    textInitialDisabled: {
      alignSelf: 'center',
      color: theme.deactivatedText,
      fontSize: theme.rem(0.75),
      fontFamily: theme.fontFaceMedium,
      marginLeft: theme.rem(0.5)
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
  }
})
