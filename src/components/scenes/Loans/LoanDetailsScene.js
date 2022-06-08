// @flow

import { mul } from 'biggystring'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { sprintf } from 'sprintf-js'

import { useAllTokens } from '../../../hooks/useAllTokens'
import { formatFiatString } from '../../../hooks/useFiatText'
import { useWalletBalance } from '../../../hooks/useWalletBalance'
import { useWalletName } from '../../../hooks/useWalletName'
import { useWatchAccount } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { makeAaveBorrowPlugin } from '../../../plugins/borrow-plugins/plugins/aave/index'
import { getAaveBorrowEngine } from '../../../plugins/helpers/getAaveBorrowPlugins'
import { type RootState } from '../../../reducers/RootReducer'
import { convertCurrency } from '../../../selectors/WalletSelectors'
import { config } from '../../../theme/appConfig'
import { useCallback, useMemo, useState } from '../../../types/reactHooks'
import { useSelector } from '../../../types/reactRedux'
import { getCurrencyIconUris } from '../../../util/CdnUris'
import { guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { zeroString } from '../../../util/utils'
import { Card } from '../../cards/Card'
import { TappableCard } from '../../cards/TappableCard'
import { ValueBarCard } from '../../cards/ValueBarCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { TextInputModal } from '../../modals/TextInputModal'
import { WalletListModal } from '../../modals/WalletListModal'
import { Airship, showError } from '../../services/AirshipInstance'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { CryptoText } from '../../text/CryptoText'
import { FiatText } from '../../text/FiatText'
import { Alert } from '../../themed/Alert'
import { CurrencyIcon } from '../../themed/CurrencyIcon'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { SceneHeader } from '../../themed/SceneHeader'

type SrcDest = 'source' | 'destination'

// type Props = {
//   navigation: NavigationProp<'loanDetails'>
// }

// export const LoanDetailsScene = (props: Props) => {
export const LoanDetailsScene = () => {
  // const navigation = props.navigation
  const theme = useTheme()
  const styles = getStyles(theme)
  const state = useSelector((state: RootState) => {
    return state
  })

  // HACK: literal placeholders used pending required plugin changes.
  // TODO: Need changes to borrow plugin to get this info before wallet is chosen?
  // getAaveBorrowEngines doesn't work if the user doesn't already own an ETH wallet...
  const hardWalletPluginId = 'ethereum'
  const hardSrcCc = 'WBTC'
  const hardReqCrypto = '0.00 WBTC'
  const hardDestCc = 'DAI'
  const hardLtvRatio = '0.5'
  const hardFiatCurrencyCode = 'USD' // TODO: Where to grab? First compatible wallet or last selected wallet?

  const account = useSelector(state => state.core.account)
  const wallets = useWatchAccount(account, 'currencyWallets')

  // TODO: setNativeBorrowAmount
  const [borrowAmount, setBorrowAmount] = useState('0.00')
  const [apr, setApr] = useState()

  // To satisfy hook rules and the 'useXXX' api, a dummy wallet is always passed
  // while a null token ID is being used to represent an initial scene state where
  // no wallets were chosen yet.
  const dummyWalletId = Object.keys(wallets)[0]
  const [srcWalletId, setSrcWalletId] = useState(dummyWalletId)
  const [srcTokenId, setSrcTokenId] = useState()
  const [srcCurrencyCode, setSrcCurrencyCode] = useState(null)
  const srcBalance = useWalletBalance(wallets[srcWalletId], srcTokenId ?? undefined)
  const srcWalletName = useWalletName(wallets[srcWalletId])
  const allTokens = useAllTokens(account)
  const srcToken = srcTokenId != null ? allTokens[hardWalletPluginId][srcTokenId] : null
  const srcAssetName = srcToken != null ? srcToken.displayName : ''

  const [destWalletId, setDestWalletId] = useState(dummyWalletId)
  const [destTokenId, setDestTokenId] = useState()
  const [destCurrencyCode, setDestCurrencyCode] = useState(null)
  const destBalance = useWalletBalance(wallets[destWalletId], destTokenId ?? undefined)
  const destWalletName = useWalletName(wallets[destWalletId])

  // Plugin-Specific
  const [borrowEngine, setBorrowEngine] = useState()
  const [isLoading, setIsLoading] = useState(false)

  // TODO: Integrate plugin-provided data
  const harBarCardIconUri = getCurrencyIconUris(
    hardWalletPluginId,
    guessFromCurrencyCode(account, { currencyCode: 'AAVE', pluginId: hardWalletPluginId }).tokenId
  ).symbolImage

  /**
   * Show a wallet picker modal filtered by the allowed assets defined by the
   * "Source of Collateral" or "Fund Destination" inputs
   */
  const showWalletPickerModal = (srcDest: SrcDest) => {
    const isSrc = srcDest === 'source'

    // TODO: Integrate provided plugin token data
    const currencyCode = `ETH-${isSrc ? hardSrcCc : hardDestCc}`
    const token = guessFromCurrencyCode(account, { currencyCode, pluginId: hardWalletPluginId })

    // TODO: HACK: Disable wallet filter for Kovan testing
    // Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedAssets={token.tokenId} showCreateWallet />)
    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} />)
      .then(async ({ walletId, currencyCode }) => {
        if (walletId != null && currencyCode != null) {
          // TODO: We can't actually set different wallets without Action Queue?
          if (isSrc) {
            setSrcCurrencyCode(currencyCode)
            setSrcWalletId(walletId)
            setSrcTokenId(token.tokenId ?? '')
          } else {
            setDestCurrencyCode(currencyCode)
            setDestWalletId(walletId)
            setDestTokenId(token.tokenId ?? '')
          }
          try {
            setIsLoading(true)
            setBorrowEngine(await getAaveBorrowEngine(makeAaveBorrowPlugin(), wallets[walletId]))
          } catch (err) {
            showError(err)
          } finally {
            setIsLoading(false)
            if (borrowEngine != null) setApr(await borrowEngine.getAprQuote())
          }
        }
      })
      .catch(e => showError(e.message))
  }

  // TODO: Move below scene, pass + memoize all required props
  /**
   * Render the 'Source of Collateral' or 'Fund Destination' cards
   * */
  type WalletCardComponentProps = { emptyLabel: string, srcDest: SrcDest, tokenId?: string, walletId?: string }
  const WalletCardComponent = (props: WalletCardComponentProps) => {
    // eslint-disable-next-line react/prop-types
    const { emptyLabel, srcDest, tokenId, walletId } = props
    const isSrc = srcDest === 'source'
    const currencyCode = isSrc ? srcCurrencyCode ?? '' : destCurrencyCode ?? ''
    const balance = isSrc ? srcBalance : destBalance
    const cbShowWalletPickerModal = useCallback(() => showWalletPickerModal(srcDest), [srcDest])

    const mLeftChildren = useMemo(() => {
      if (tokenId == null) {
        // Show instructions to tap tile and select a wallet
        return <EdgeText style={styles.textInitial}>{emptyLabel}</EdgeText>
      } else {
        // Show a left column with currency code and wallet name
        return (
          <View style={styles.halfContainer}>
            <CurrencyIcon sizeRem={2.5} marginRem={[0, 1, 0, 0]} tokenId={tokenId} walletId={walletId} />
            <View style={styles.columnLeft}>
              <EdgeText style={styles.textCardHeader}>{currencyCode}</EdgeText>
              <EdgeText style={styles.textSecondary}>{isSrc ? srcWalletName : destWalletName}</EdgeText>
            </View>
          </View>
        )
      }
    }, [currencyCode, emptyLabel, isSrc, tokenId, walletId])

    const mRightChildren = useMemo(() => {
      if (tokenId == null || walletId == null) {
        // Blank if no wallet has yet been selected
        return null
      } else {
        // Show a right column of CryptoText and FiatText
        return (
          <View style={styles.columnRight}>
            <EdgeText style={styles.textCardHeader}>
              {/* TODO: Fold appendCurrencyCode into CryptoText? */}
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
      <TappableCard onPress={cbShowWalletPickerModal}>
        {mLeftChildren}
        {mRightChildren}
      </TappableCard>
    )
  }

  const reqDisplayFiatAmount = `${formatFiatString({ fiatAmount: borrowAmount })} ${hardFiatCurrencyCode}`
  const isNextDisabled = srcTokenId == null || destTokenId == null || borrowAmount == null
  return (
    <SceneWrapper>
      <SceneHeader underline textTitle={s.strings.loan_details_title} />
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <View style={styles.sceneContainer}>
          {/* Amount to borrow */}
          <ValueBarCard
            currencyCode="USD"
            formattedAmount={borrowAmount ?? '0.00'}
            iconUri={harBarCardIconUri}
            maxAmount="200"
            title={s.strings.loan_details_title}
            onPress={useCallback(() => {
              Airship.show(bridge => <TextInputModal bridge={bridge} title="Enter Loan Amount (USD)" />).then(amount => {
                if (amount != null) setBorrowAmount(amount)
              })
            }, [])}
          />
          {/* APR */}
          {isLoading ? (
            <ActivityIndicator color={theme.textLink} style={styles.cardContainer} />
          ) : (
            <View style={styles.cardContainer}>
              <Card paddingRem={[0.5, 1]}>
                <EdgeText>{zeroString(apr) || apr == null ? s.strings.loan_details_select_receiving_wallet : apr}</EdgeText>
              </Card>
            </View>
          )}

          {/* Collateral Amount Required / Collateral Amount */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_details_collateral_required}</EdgeText>
          <TappableCard nonTappable>
            <View style={styles.halfContainer}>
              <CurrencyIcon sizeRem={2} marginRem={[0, 1, 0, 0]} pluginId="bitcoin" />
              {srcTokenId == null || srcWalletId == null ? (
                <EdgeText style={styles.textCardHeader}>{hardReqCrypto}</EdgeText>
              ) : (
                <CryptoText
                  wallet={wallets[srcWalletId]}
                  tokenId={srcTokenId}
                  nativeAmount={mul(convertCurrency(state, hardDestCc, hardSrcCc, borrowAmount), hardLtvRatio)}
                />
              )}
            </View>

            <View style={styles.halfContainer}>
              {/* TODO: add icon component */}
              <CurrencyIcon sizeRem={2} marginRem={[0, 1, 0, 0]} pluginId="bitcoin" />
              <EdgeText style={styles.textCardHeader}>{reqDisplayFiatAmount}</EdgeText>
            </View>
          </TappableCard>

          {/* Source of Collateral / Source Wallet */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_details_collateral_source}</EdgeText>
          <WalletCardComponent
            emptyLabel={sprintf(s.strings.loan_details_select_s_wallet, hardSrcCc)}
            srcDest="source"
            walletId={srcWalletId}
            tokenId={srcTokenId}
          />

          {/* Insufficient Collateral Warning Card */}
          {zeroString(srcBalance) ? (
            <Alert
              numberOfLines={0}
              marginTop={0.5}
              title={s.strings.wc_smartcontract_warning_title}
              message={sprintf(s.strings.loan_details_insufficient_funds_warning, srcAssetName, srcWalletName, srcCurrencyCode, config.appName)}
              type="warning"
            />
          ) : null}

          {/* Fund Destination */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_details_destination}</EdgeText>

          <WalletCardComponent
            emptyLabel={s.strings.loan_details_select_receiving_wallet}
            srcDest="destination"
            walletId={destWalletId}
            tokenId={destTokenId}
          />
          <MainButton
            label={s.strings.string_next_capitalized}
            disabled={isNextDisabled}
            type="secondary"
            onPress={() => {
              // TODO: after implementation of LoanDetailsConfirmationScene
              // navigation.navigate('loanDetailsConfirmation', {
              //   borrowAmount,
              //   destTokenId: destTokenId ?? '', // tokenIds will always be set by the time the button is available
              //   destWalletId,
              //   srcTokenId: srcTokenId ?? '',
              //   srcWalletId
              // })
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
    textInitial: { fontSize: theme.rem(0.75), alignSelf: 'center' },
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
