// @flow

import * as React from 'react'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { sprintf } from 'sprintf-js'

import { useAllTokens } from '../../../hooks/useAllTokens'
import { useWalletBalance } from '../../../hooks/useWalletBalance'
import { useWalletName } from '../../../hooks/useWalletName'
import { useWatchAccount } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { config } from '../../../theme/appConfig'
import { useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux'
import { getCurrencyIconUris } from '../../../util/CdnUris'
import { guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { makeCurrencyCodeTable, zeroString } from '../../../util/utils'
import { Card } from '../../cards/Card'
import { TappableCard } from '../../cards/TappableCard'
import { ValueBarCard } from '../../cards/ValueBarCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { upgradeCurrencyCodes, WalletListModal } from '../../modals/WalletListModal'
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

export const LoanDetailsScene = () => {
  const theme = useTheme()
  const styles = getStyles(theme)

  // HACK: literal placeholders used until plugin integration
  const hardWalletPluginId = 'ethereum'
  const hardApr = '10.8% APR'
  const hardBtc = '0.00 BTC'
  const hardUsd = '0.00 USD'
  const hardSrcCc = 'WBTC'
  const hardDestCc = 'DAI'

  const account = useSelector(state => state.core.account)
  const wallets = useWatchAccount(account, 'currencyWallets')

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
    const lookup = makeCurrencyCodeTable(account)
    const tokenId = upgradeCurrencyCodes(lookup, [`ETH-${isSrc ? hardSrcCc : hardDestCc}`])

    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedAssets={tokenId} showCreateWallet />)
      .then(async ({ walletId, currencyCode }) => {
        if (walletId != null && currencyCode != null) {
          const token = guessFromCurrencyCode(account, { currencyCode, pluginId: hardWalletPluginId })
          if (isSrc) {
            setSrcCurrencyCode(currencyCode)
            setSrcWalletId(walletId)
            setSrcTokenId(token.tokenId)
          } else {
            setDestCurrencyCode(currencyCode)
            setDestWalletId(walletId)
            setDestTokenId(token.tokenId)
          }
        }
      })
      .catch(e => showError(e.message))
  }

  /**
   * Render the 'Source of Collateral' or 'Fund Destination' cards
   * */
  const renderWalletCard = ({ emptyLabel, srcDest, tokenId, walletId }: { emptyLabel: string, srcDest: SrcDest, tokenId?: string, walletId?: string }) => {
    // Looking only at tokenId existence guarantees wallet has not yet been set
    if (tokenId != null) {
      const isSrc = srcDest === 'source'
      const currencyCode = isSrc ? srcCurrencyCode ?? '' : destCurrencyCode ?? ''
      const balance = isSrc ? srcBalance : destBalance

      return (
        <TappableCard
          leftChildren={
            <>
              <CurrencyIcon sizeRem={2.5} marginRem={[0, 1, 0, 0]} tokenId={tokenId} walletId={walletId} />
              <View style={styles.columnLeft}>
                <EdgeText style={styles.textCardHeader}>{currencyCode}</EdgeText>
                <EdgeText style={styles.textSecondary}>{isSrc ? srcWalletName : destWalletName}</EdgeText>
              </View>
            </>
          }
          rightChildren={
            walletId ? (
              <>
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
              </>
            ) : null
          }
          onPress={() => showWalletPickerModal(srcDest)}
        />
      )
    } else {
      return (
        <TappableCard
          leftChildren={
            <View style={styles.columnLeft}>
              <EdgeText style={styles.textInitial}>{emptyLabel}</EdgeText>
            </View>
          }
          rightChildren={null}
          onPress={() => showWalletPickerModal(srcDest)}
        />
      )
    }
  }

  const appName = config.appName
  console.log(
    '\x1b[34m\x1b[43m' +
      `{srcAssetName, srcWalletName, srcCurrencyCode, config.appName}: ${JSON.stringify({ srcAssetName, srcWalletName, srcCurrencyCode, appName }, null, 2)}` +
      '\x1b[0m'
  )

  return (
    <SceneWrapper>
      <SceneHeader underline textTitle={s.strings.loan_details_title} />
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <View style={styles.sceneContainer}>
          {/* Amount to borrow */}
          <ValueBarCard currencyCode="USD" formattedAmount="100.00" iconUri={harBarCardIconUri} maxAmount="200" title={s.strings.loan_details_title} />
          <View style={styles.cardContainer}>
            <Card paddingRem={[0.5, 1]}>
              <EdgeText>{hardApr}</EdgeText>
            </Card>
          </View>

          {/* Collateral required */}
          {/* TODO: Pending design update, USD icon(?) */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_details_collateral_required}</EdgeText>
          <TappableCard
            leftChildren={
              <>
                <CurrencyIcon sizeRem={2} marginRem={[0, 1, 0, 0]} pluginId="bitcoin" />
                <EdgeText style={styles.textCardHeader}>{hardBtc}</EdgeText>
              </>
            }
            rightChildren={
              <View style={styles.rowRight}>
                <EdgeText style={styles.textCardHeader}>{hardUsd}</EdgeText>
              </View>
            }
            nonTappable
          />

          {/* Source of Collateral */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_details_collateral_source}</EdgeText>
          {renderWalletCard({
            emptyLabel: sprintf(s.strings.loan_details_select_s_wallet, hardSrcCc),
            srcDest: 'source',
            walletId: srcWalletId,
            tokenId: srcTokenId
          })}

          {/* Insufficient Collateral Warning Card */}
          {zeroString(srcBalance) ? (
            <Alert
              numberOfLines={0}
              marginTop={0.5}
              title={s.strings.wc_smartcontract_warning_title}
              message={sprintf(s.strings.loan_details_insufficient_funds_warning, srcAssetName, srcWalletName, srcCurrencyCode, appName)}
              type="warning"
            />
          ) : null}

          {/* Fund Destination */}
          <EdgeText style={styles.textTitle}>{s.strings.loan_details_destination}</EdgeText>
          {renderWalletCard({
            emptyLabel: s.strings.loan_details_select_receiving_wallet,
            srcDest: 'destination',
            walletId: destWalletId,
            tokenId: destTokenId
          })}
          <MainButton label={s.strings.string_next_capitalized} type="secondary" onPress={() => {}} marginRem={[1.5, 6, 6, 6]} />
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
    textInitial: { fontSize: theme.rem(0.75) },
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
      alignItems: 'flex-end'
    },
    sceneContainer: {
      flex: 1,
      flexDirection: 'column',
      margin: theme.rem(0.5),
      marginTop: theme.rem(0)
    }
  }
})
