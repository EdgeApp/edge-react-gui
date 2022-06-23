// @flow

import { mul } from 'biggystring'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { sprintf } from 'sprintf-js'

import { useAllTokens } from '../../../hooks/useAllTokens'
import { formatFiatString } from '../../../hooks/useFiatText'
import { useHandler } from '../../../hooks/useHandler'
import { useWalletBalance } from '../../../hooks/useWalletBalance'
import { useWalletName } from '../../../hooks/useWalletName'
import { useWatchAccount } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { type RootState } from '../../../reducers/RootReducer'
import { convertCurrency } from '../../../selectors/WalletSelectors'
import { config } from '../../../theme/appConfig'
import { useCallback, useEffect, useMemo, useState } from '../../../types/reactHooks'
import { useSelector } from '../../../types/reactRedux'
import { type RouteProp } from '../../../types/routerTypes'
import { getCurrencyIconUris } from '../../../util/CdnUris'
import { guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { truncateDecimals, zeroString } from '../../../util/utils'
import { Card } from '../../cards/Card'
import { TappableCard } from '../../cards/TappableCard'
import { ValueBarCard } from '../../cards/ValueBarCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { TextInputModal } from '../../modals/TextInputModal'
import { WalletListModal } from '../../modals/WalletListModal'
import { Airship, showError } from '../../services/AirshipInstance'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { CryptoText } from '../../text/CryptoText'
import { FiatText } from '../../text/FiatText'
import { Alert } from '../../themed/Alert'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { SceneHeader } from '../../themed/SceneHeader'

type Props = {
  route: RouteProp<'loanDetails'>
}

export const LoanDetailsScene = (props: Props) => {
  const { route } = props
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
  const srcToken = useMemo(() => (srcTokenId != null ? allTokens[srcPluginId][srcTokenId] : null), [allTokens, srcPluginId, srcTokenId])
  const srcAssetName = useMemo(() => (srcToken != null ? srcToken.displayName : ''), [srcToken])

  // TODO: Post-ActionQueue, the destination wallet can differ from source wallet.
  const destWalletId = srcWallet.id
  const destWallet = wallets[destWalletId]
  const destPluginId = srcPluginId
  const [destTokenId, setDestTokenId] = useState()
  const [destCurrencyCode, setDestCurrencyCode] = useState(null)
  const destBalance = useWalletBalance(destWallet, destTokenId ?? undefined)
  const destWalletName = useWalletName(destWallet)

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
    // TODO: Plugin change: return all the supported debt/col assets from some hard-coded data per dApp
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
            setDestCurrencyCode(currencyCode)
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
    const currencyCode = isSrc ? srcCurrencyCode ?? '' : destCurrencyCode ?? ''
    const balance = isSrc ? srcBalance : destBalance
    const handleShowWalletPickerModal = useCallback(() => showWalletPickerModal(isSrc), [isSrc])

    const leftChildren = useMemo(() => {
      if (tokenId == null) {
        // Instructions to tap tile and select a wallet
        return <EdgeText style={disabled ? styles.textInitialDisabled : styles.textInitial}>{emptyLabel}</EdgeText>
      } else {
        // Left column with currency code and wallet name
        return (
          <View style={styles.halfContainer}>
            <CryptoIcon sizeRem={2.5} marginRem={[0, 1, 0, 0]} tokenId={tokenId} walletId={walletId} />
            <View style={styles.columnLeft}>
              <EdgeText style={styles.textCardHeader}>{currencyCode}</EdgeText>
              <EdgeText style={styles.textSecondary}>{isSrc ? srcWalletName : destWalletName}</EdgeText>
            </View>
          </View>
        )
      }
    }, [currencyCode, disabled, emptyLabel, isSrc, tokenId, walletId])

    const rightChildren = useMemo(() => {
      if (tokenId == null || walletId == null) {
        // Blank if no wallet has yet been selected
        return null
      } else {
        // Right column of CryptoText and FiatText
        return (
          <View style={styles.columnRight}>
            <EdgeText style={styles.textCardHeader}>
              {/* TODO: Consider folding currency code/symbol into CryptoText, similar to FiatText */}
              <CryptoText nativeAmount={balance} tokenId={tokenId} wallet={wallets[walletId]} />
              {' ' + currencyCode}
            </EdgeText>
            <EdgeText style={styles.textSecondary}>
              <FiatText nativeCryptoAmount={balance} tokenId={tokenId} wallet={wallets[walletId]} />
            </EdgeText>
          </View>
        )
      }
    }, [balance, currencyCode, tokenId, walletId])

    return (
      <TappableCard disabled={disabled} onPress={handleShowWalletPickerModal}>
        {leftChildren}
        {rightChildren}
      </TappableCard>
    )
  }

  /**
   * Main Scene Final Props & Calculations
   */
  // Borrow Amount Card
  const state = useSelector((state: RootState) => state)
  const borrowAmountCrypto = convertCurrency(state, hardSrcCc, isoFiatCurrencyCode, borrowAmountFiat)
  const handleEditBorrowAmount = useCallback(() => {
    Airship.show(bridge => <TextInputModal bridge={bridge} title={sprintf(s.strings.loan_details_enter_loan_amount_s, fiatCurrencyCode)} />).then(amount => {
      if (amount != null) {
        setBorrowAmount(amount)
      }
    })
  }, [fiatCurrencyCode])

  // APR
  const aprValue = apr == null || apr === 0 ? '-- ' : truncateDecimals((100 * apr).toString(), 1)
  const displayApr = useMemo(() => sprintf(s.strings.loan_s_apr, aprValue), [aprValue])

  // Warning
  const collateralWarningMsg = useMemo(
    () =>
      sprintf(
        s.strings.loan_details_insufficient_funds_warning,
        isCollateralWalletEnabled ? srcAssetName : hardSrcAssetName,
        srcWalletName,
        isCollateralWalletEnabled ? srcCurrencyCode : hardSrcCc,
        config.appName
      ),
    [isCollateralWalletEnabled, srcAssetName, srcCurrencyCode, srcWalletName]
  )
  const renderWarning = useHandler(() => {
    if ((srcToken != null && zeroString(srcBalance)) || !isCollateralWalletEnabled)
      return <Alert numberOfLines={0} marginTop={0.5} title={s.strings.wc_smartcontract_warning_title} message={collateralWarningMsg} type="warning" />
    else return null
  })

  // Required Collateral
  const displayReqFiat = useMemo(
    () => `${formatFiatString({ fiatAmount: mul(borrowAmountFiat, ltvRatio) })} ${fiatCurrencyCode}`,
    [borrowAmountFiat, fiatCurrencyCode, ltvRatio]
  )
  const displayReqCrypto = useMemo(() => mul(borrowAmountCrypto, ltvRatio), [borrowAmountCrypto, ltvRatio])

  // Next Button
  const isNextDisabled = srcTokenId == null || destTokenId == null || borrowAmountFiat == null

  // #endregion

  /**
   * Main Scene Render
   */
  return (
    <SceneWrapper>
      <SceneHeader underline textTitle={s.strings.loan_details_title} />
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <View style={styles.sceneContainer}>
          {/* Amount  to borrow */}
          <ValueBarCard
            currencyCode="USD"
            formattedAmount={borrowAmountFiat}
            iconUri={hardBarCardIconUri}
            title={s.strings.loan_details_title}
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
          <EdgeText style={styles.textTitle}>{s.strings.loan_details_collateral_source}</EdgeText>

          <WalletCard
            disabled={!isCollateralWalletEnabled}
            emptyLabel={sprintf(s.strings.loan_details_select_s_wallet, hardSrcCc)}
            isSrc
            walletId={srcWalletId}
            tokenId={srcTokenId}
          />

          {/* Insufficient Collateral Warning Card */}
          {renderWarning()}

          {/* Fund Destination */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_details_destination}</EdgeText>

          <WalletCard emptyLabel={s.strings.loan_details_select_receiving_wallet} isSrc={false} walletId={destWalletId} tokenId={destTokenId} />

          {/* Collateral Amount Required / Collateral Amount */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_details_collateral_required}</EdgeText>
          <TappableCard nonTappable>
            {srcTokenId == null || srcWalletId == null ? (
              <EdgeText style={styles.textInitial}>{s.strings.loan_details_select_source_collateral}</EdgeText>
            ) : (
              <>
                <View style={styles.halfContainer}>
                  <CryptoIcon sizeRem={2} marginRem={[0, 0.5, 0, 0]} tokenId={srcTokenId} walletId={srcWalletId} />
                  {/* Extra view to make text respect bounds of outer halfContainer */}
                  <View style={styles.halfContainer}>
                    <EdgeText style={styles.textCardHeader}>
                      <CryptoText wallet={srcWallet} tokenId={srcTokenId} nativeAmount={displayReqCrypto} />
                      {' ' + srcCurrencyCode}
                    </EdgeText>
                  </View>
                </View>

                <View style={styles.halfContainer}>
                  <CryptoIcon sizeRem={2} marginRem={[0, 0.5, 0, 0.5]} pluginId="fiat" walletId={srcWalletId} />
                  {/* Make text respect bounds of outer half container */}
                  <View style={styles.halfContainer}>
                    <EdgeText style={styles.textCardHeader}>{displayReqFiat}</EdgeText>
                  </View>
                </View>
              </>
            )}
          </TappableCard>

          <MainButton
            label={s.strings.string_next_capitalized}
            disabled={isNextDisabled}
            type="secondary"
            onPress={() => {
              // TODO: after implementation of LoanDetailsConfirmationScene
            }}
            marginRem={[1.5, 6, 6, 6]}
          />
        </View>
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles(theme => {
  const commonColumn = {
    flexDirection: 'column',
    alignContent: 'center'
  }

  return {
    cardContainer: {
      alignItems: 'center',
      alignSelf: 'center',
      flexDirection: 'column',
      margin: theme.rem(0.5)
    },
    columnLeft: {
      ...commonColumn,
      alignItems: 'flex-start'
    },
    columnRight: {
      ...commonColumn,
      alignItems: 'flex-end'
    },
    icon: {
      size: theme.rem(2.5)
    },
    textCardHeader: {
      fontFamily: theme.fontFaceMedium
    },
    textInitial: {
      alignSelf: 'center',
      fontSize: theme.rem(0.75),
      fontFamily: theme.fontFaceMedium
    },
    textInitialDisabled: {
      alignSelf: 'center',
      color: theme.deactivatedText,
      fontSize: theme.rem(0.75),
      fontFamily: theme.fontFaceMedium
    },
    textSecondary: {
      color: theme.secondaryText,
      fontSize: theme.rem(0.75)
    },
    textTitle: {
      alignSelf: 'flex-start',
      color: theme.secondaryText,
      fontFamily: theme.fontFaceBold,
      fontSize: theme.rem(0.75),
      margin: theme.rem(0.5),
      textAlign: 'left'
    },
    rowRight: {
      alignSelf: 'center',
      alignItems: 'flex-end'
    },
    halfContainer: {
      flex: 1,
      alignItems: 'center',
      flexDirection: 'row'
    },
    sceneContainer: {
      flex: 1,
      flexDirection: 'column',
      margin: theme.rem(0.5),
      marginTop: theme.rem(0)
    },
    spacedContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flex: 1
    }
  }
})
