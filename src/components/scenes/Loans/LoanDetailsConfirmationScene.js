// @flow

import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { useAllTokens } from '../../../hooks/useAllTokens'
import { useWalletBalance } from '../../../hooks/useWalletBalance'
import { useWalletName } from '../../../hooks/useWalletName'
import { useWatchAccount } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { config } from '../../../theme/appConfig'
import { useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes.js'
import { getCurrencyIconUris } from '../../../util/CdnUris'
import { guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { zeroString } from '../../../util/utils'
import { TappableCard } from '../../cards/TappableCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { CryptoText } from '../../text/CryptoText'
import { FiatText } from '../../text/FiatText'
import { Alert } from '../../themed/Alert'
import { CurrencyIcon } from '../../themed/CurrencyIcon'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'
import { Tile } from '../../tiles/Tile'

type SrcDest = 'source' | 'destination'

type Props = {
  navigation: NavigationProp<'loanDetailsConfirmation'>,
  route: RouteProp<'loanDetailsConfirmation'>
}

export const LoanDetailsConfirmationScene = (props: Props) => {
  const navigation = props.navigation
  const theme = useTheme()
  const styles = getStyles(theme)

  const { borrowAmount, destTokenId, destWalletId, srcTokenId, srcWalletId } = props.route.params
  const account = useSelector(state => state.core.account)
  const wallets = useWatchAccount(account, 'currencyWallets')
  const srcWallet = wallets[srcWalletId]
  const destWallet = wallets[destWalletId]
  const allTokens = useAllTokens(account)
  const srcToken = allTokens[srcWallet.currencyInfo.pluginId][srcTokenId]
  const destToken = allTokens[destWallet.currencyInfo.pluginId][destTokenId]
  const srcBalance = useWalletBalance(wallets[srcWalletId], srcTokenId ?? undefined)
  const srcWalletName = useWalletName(wallets[srcWalletId])
  const srcAssetName = srcToken != null ? srcToken.displayName : ''

  const destBalance = useWalletBalance(wallets[destWalletId], destTokenId ?? undefined)
  const destWalletName = useWalletName(wallets[destWalletId])

  /**
   * Render the 'Source of Collateral' or 'Fund Destination' rows
   * */
  type WalletCardComponentProps = { walletId: string, tokenId: string }
  const WalletCardComponent = (props: WalletCardComponentProps) => {
    // eslint-disable-next-line react/prop-types
    const { wallet, tokenId } = props
    const currencyCode = isSrc ? srcToken.currencyCode ?? '' : destCurrencyCode ?? ''
    const balance = isSrc ? srcBalance : destBalance

    const leftChildren = (
      <>
        <CurrencyIcon sizeRem={2.5} marginRem={[0, 1, 0, 0]} tokenId={tokenId} walletId={walletId} />
        <View style={styles.columnLeft}>
          <EdgeText style={styles.textCardHeader}>{currencyCode}</EdgeText>
          <EdgeText style={styles.textSecondary}>{isSrc ? srcWalletName : destWalletName}</EdgeText>
        </View>
      </>
    )

    const rightChildren = (
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
    )

    return (
      <View>
        {leftChildren}
        {rightChildren}
      </View>
    )
  }

  return (
    <SceneWrapper>
      <SceneHeader underline textTitle={s.strings.loan_details_title} />
      <ScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <View style={styles.sceneContainer}>
          {/* Amount to borrow */}
          <Tile title={s.strings.loan_borrow_amount_title}>
            <EdgeText>
              <CryptoText nativeAmount={borrowAmount} tokenId={tokenId} wallet={wallets[walletId]} />
            </EdgeText>
          </Tile>
          <Tile title="interest">
            <EdgeText>{hardApr}</EdgeText>
          </Tile>

          {/* Collateral Amount Required / Collateral Amount */}
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
          <Slider />
        </View>
      </ScrollView>
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
