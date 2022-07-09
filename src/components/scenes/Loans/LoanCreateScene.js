// @flow

import { div, lt, mul } from 'biggystring'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { sprintf } from 'sprintf-js'

import { useAllTokens } from '../../../hooks/useAllTokens'
import { formatFiatString } from '../../../hooks/useFiatText'
import { useHandler } from '../../../hooks/useHandler'
import { useTokenDisplayData } from '../../../hooks/useTokenDisplayData'
import { useWalletBalance } from '../../../hooks/useWalletBalance'
import { useWalletName } from '../../../hooks/useWalletName'
import { useWatchAccount } from '../../../hooks/useWatch'
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

type Props = {
  route: RouteProp<'loanCreate'>,
  navigation: NavigationProp<'loanCreate'>
}

export const LoanCreateScene = (props: Props) => {
  const { navigation, route } = props
  const { borrowEngine, borrowPlugin } = route.params
  const { currencyWallet: srcWallet, debts } = borrowEngine

  const theme = useTheme()
  const styles = getStyles(theme)

  if (debts.length > 0) {
    // TODO: transition to "advanced" loan details scene
  }

  // Wallet/Token Data
  const account = useSelector(state => state.core.account)
  const wallets = useWatchAccount(account, 'currencyWallets')
  const { fiatCurrencyCode: isoFiatCurrencyCode, id: srcWalletId } = srcWallet
  const [srcTokenId, setSrcTokenId] = useState()
  const [srcCurrencyCode, setSrcCurrencyCode] = useState('')
  const fiatCurrencyCode = isoFiatCurrencyCode.replace('iso:', '')
  const allTokens = useAllTokens(account)

  const srcPluginId = srcWallet.currencyInfo.pluginId
  const srcWalletName = useWalletName(srcWallet)
  const srcBalance = useWalletBalance(srcWallet, srcTokenId ?? undefined)
  const srcToken = useMemo(() => (srcTokenId != null ? allTokens[srcPluginId][srcTokenId] : {}), [allTokens, srcPluginId, srcTokenId])
  const srcAssetName = useMemo(() => (srcToken != null ? srcToken.displayName : ''), [srcToken])

  // TODO: Post-ActionQueue, the destination wallet can differ from source wallet.
  const destWalletId = srcWallet.id
  const destWallet = wallets[destWalletId]
  const destPluginId = srcPluginId
  const [destTokenId, setDestTokenId] = useState()

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

  // BorrowPlugin src/dest
  const hardSrcCc = 'WBTC'
  const hardSrcAssetName = 'Wrapped Bitcoin'
  const hardDestCc = 'DAI'
  const { tokenId: srcTokenAddr } = useMemo(() => guessFromCurrencyCode(account, { currencyCode: hardSrcCc, pluginId: srcPluginId }), [account, srcPluginId])
  const { tokenId: destTokenAddr } = useMemo(
    () => guessFromCurrencyCode(account, { currencyCode: hardDestCc, pluginId: destPluginId }),
    [account, destPluginId]
  )

  // Check if source wallet has supported collateral token enabled
  const isCollateralWalletEnabled = srcWallet.enabledTokenIds.some(enabledTokenAddr => enabledTokenAddr === srcTokenAddr)

  /**
   * Show a wallet picker modal filtered by the allowed assets defined by the
   * "Source of Collateral" or "Fund Destination" inputs
   */
  const showWalletPickerModal = (isSrc: boolean) => {
    const walletPluginId = isSrc ? srcPluginId : destPluginId

    // Filter for only tokens on the active wallet
    // TODO: V2: Plugin change: return all the supported debt/col assets from some hard-coded data per dApp
    const excludeWalletIds = Object.keys(wallets).filter(walletId => walletId !== (isSrc ? srcWalletId : destWalletId))
    const hardAllowedAsset = isSrc ? { pluginId: srcPluginId, tokenId: srcTokenAddr } : { pluginId: destPluginId, tokenId: destTokenAddr }

    Airship.show(bridge => (
      <WalletListModal
        bridge={bridge}
        headerTitle={s.strings.select_wallet}
        showCreateWallet={!isSrc}
        excludeWalletIds={excludeWalletIds}
        allowedAssets={[hardAllowedAsset]}
        filterActivation
      />
    ))
      .then(async ({ walletId, currencyCode }) => {
        if (walletId != null && currencyCode != null) {
          const { tokenId } = guessFromCurrencyCode(account, { currencyCode, pluginId: walletPluginId })
          if (isSrc) {
            setSrcCurrencyCode(currencyCode)
            setSrcTokenId(tokenId ?? '')
          } else {
            setDestTokenId(tokenId ?? '')

            // Fetch APR based on borrow destination
            try {
              setIsLoading(true)
              setApr(await borrowEngine.getAprQuote(destTokenAddr))
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
  type WalletCardProps = { disabled?: boolean, emptyLabel: string, isSrc: boolean, tokenId?: string, walletId?: string }
  const WalletCard = (props: WalletCardProps) => {
    const { disabled, emptyLabel, isSrc, tokenId, walletId } = props
    const handleShowWalletPickerModal = useCallback(() => showWalletPickerModal(isSrc), [isSrc])

    return (
      <TappableCard disabled={disabled} onPress={handleShowWalletPickerModal} marginRem={0.5} paddingRem={0.5}>
        {tokenId == null || walletId == null ? (
          <EdgeText style={disabled ? styles.textInitialDisabled : styles.textInitial}>{emptyLabel}</EdgeText>
        ) : (
          <View style={styles.currencyRow}>
            <CurrencyRow tokenId={tokenId} wallet={wallets[walletId]} />
          </View>
        )}
      </TappableCard>
    )
  }

  /**
   * Main Scene Final Props & Calculations
   */

  // User has made input to all required fields
  const isUserInputComplete = srcTokenId != null && destTokenId != null && !zeroString(borrowAmountFiat)

  // Required Collateral
  // TODO: LTV is calculated in equivalent ETH value, NOT USD! These calcs/limits/texts might need to be updated...
  const requiredFiat = useMemo(() => div(borrowAmountFiat, ltvRatio), [borrowAmountFiat, ltvRatio])

  // Deposit + Borrow Request Data
  // Convert collateral in fiat -> collateral crypto
  const { assetToFiatRate: srcToFiatRate } = useTokenDisplayData({
    tokenId: srcTokenId,
    wallet: srcWallet
  })
  const { denominations: srcDenoms } = srcToken
  const srcExchangeMultiplier = !isUserInputComplete ? '0' : srcDenoms[0].multiplier
  const nativeRequiredCrypto = !isUserInputComplete ? '0' : truncateDecimals(mul(srcExchangeMultiplier, div(requiredFiat, srcToFiatRate, DECIMAL_PRECISION)), 0)

  // Convert borrow amount fiat -> borrow amount crypto
  const { assetToFiatRate: destToFiatRate } = useTokenDisplayData({
    tokenId: destTokenId,
    wallet: destTokenId == null ? srcWallet : destWallet // srcWallet will always exist.
    // If the user has not yet selected a destWallet, we wouldn't be showing
    // any exchange rate, anyway, so just pass srcWallet to allow this hook not to puke.
  })
  const destToken = destTokenId == null ? null : destWallet.currencyConfig.allTokens[destTokenId]
  const { denominations: destDenoms } = destToken ?? {}
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

  // APR
  const aprValue = apr == null || apr === 0 ? '-- ' : toPercentString(apr)
  const displayApr = useMemo(() => sprintf(s.strings.loan_s_apr, aprValue), [aprValue])

  // Warning
  const collateralWarningMsg = useMemo(
    () =>
      sprintf(
        s.strings.loan_insufficient_funds_warning,
        isCollateralWalletEnabled ? srcAssetName : hardSrcAssetName,
        srcWalletName,
        isCollateralWalletEnabled ? srcCurrencyCode : hardSrcCc,
        config.appName
      ),
    [isCollateralWalletEnabled, srcAssetName, srcCurrencyCode, srcWalletName]
  )
  const renderWarning = useHandler(() => {
    // User doesn't have required collateral wallet enabled or 0 balance
    if ((srcToken != null && zeroString(srcBalance)) || !isCollateralWalletEnabled)
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
              <Card paddingRem={[0.5, 1]}>
                <EdgeText>{displayApr}</EdgeText>
              </Card>
            </View>
          )}

          {/* Source of Collateral / Source Wallet */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_collateral_source}</EdgeText>

          <WalletCard
            disabled={!isCollateralWalletEnabled}
            emptyLabel={sprintf(s.strings.loan_select_s_wallet, hardSrcCc)}
            isSrc
            walletId={srcWalletId}
            tokenId={srcTokenId}
          />

          {/* Fund Destination */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_destination}</EdgeText>

          <WalletCard emptyLabel={s.strings.loan_select_receiving_wallet} isSrc={false} walletId={destWalletId} tokenId={destTokenId} />

          {/* Collateral Amount Required / Collateral Amount */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_collateral_required}</EdgeText>
          <Card marginRem={[0.5, 0.5, 0.5, 0.5]} paddingRem={1}>
            {srcTokenId == null || srcWalletId == null ? (
              <EdgeText style={styles.textInitial}>{s.strings.loan_select_source_collateral}</EdgeText>
            ) : (
              <CryptoFiatAmountRow nativeAmount={nativeRequiredCrypto} tokenId={srcTokenId} wallet={srcWallet} />
            )}
          </Card>

          {/* Insufficient Collateral Warning Card */}
          {renderWarning()}

          <MainButton
            label={s.strings.string_next_capitalized}
            disabled={isLtvExceeded || !isUserInputComplete}
            type="secondary"
            onPress={() => {
              if (destTokenId == null || srcTokenId == null) return

              navigation.navigate('loanCreateConfirmation', {
                borrowEngine,
                borrowPlugin,
                destWallet: wallets[destWalletId],
                destTokenId,
                nativeDestAmount: nativeBorrowAmountCrypto,
                nativeSrcAmount: nativeRequiredCrypto,
                srcTokenId
              })
            }}
            marginRem={[1.5, 6, 6, 6]}
          />
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
