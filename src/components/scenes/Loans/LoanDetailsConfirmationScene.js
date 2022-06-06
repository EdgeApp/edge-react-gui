// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { useAllTokens } from '../../../hooks/useAllTokens'
import { useWalletBalance } from '../../../hooks/useWalletBalance'
import { useWalletName } from '../../../hooks/useWalletName'
import { useWatchAccount } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { getDisplayDenomination } from '../../../selectors/DenominationSelectors'
import { config } from '../../../theme/appConfig'
import { useState } from '../../../types/reactHooks.js'
import { useSelector } from '../../../types/reactRedux'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes.js'
import { getCurrencyIconUris } from '../../../util/CdnUris'
import { guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { makeCurrencyCodeTable, zeroString } from '../../../util/utils'
import { TappableCard } from '../../cards/TappableCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { upgradeCurrencyCodes } from '../../modals/WalletListModal'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { CryptoText } from '../../text/CryptoText'
import { FiatText } from '../../text/FiatText'
import { Alert } from '../../themed/Alert'
import { CurrencyIcon } from '../../themed/CurrencyIcon'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'
import { CryptoFiatAmountTile } from '../../tiles/CryptoFiatAmountTile'
import { Tile } from '../../tiles/Tile'

type SrcDest = 'source' | 'destination'

type Props = {
  navigation: NavigationProp<'loanDetailsConfirmation'>,
  route: RouteProp<'loanDetailsConfirmation'>
}

export const LoanDetailsConfirmationScene = (props: Props) => {
  const hardApr = '10.8% APR'
  const hardBtc = '0.00 BTC'
  const hardUsd = '0.00 USD'

  const navigation = props.navigation
  const theme = useTheme()
  const styles = getStyles(theme)

  const { borrowAmount, destTokenId, destWalletId, srcTokenId, srcWalletId } = props.route.params

  const state = useSelector(state => state)
  const account = useSelector(state => state.core.account)
  const wallets = useWatchAccount(account, 'currencyWallets')
  const srcWallet = wallets[srcWalletId]
  const destWallet = wallets[destWalletId]
  const allTokens = useAllTokens(account)
  const lookup = makeCurrencyCodeTable(account)
  const borrowTokens = upgradeCurrencyCodes(lookup, [`ETH-DAI`])

  const srcToken = allTokens[srcWallet.currencyInfo.pluginId][srcTokenId]
  const destToken = allTokens[destWallet.currencyInfo.pluginId][destTokenId]
  const srcBalance = useWalletBalance(wallets[srcWalletId], srcTokenId ?? undefined)
  const srcWalletName = useWalletName(wallets[srcWalletId])

  const destBalance = useWalletBalance(wallets[destWalletId], destTokenId ?? undefined)
  const destWalletName = useWalletName(wallets[destWalletId])

  /**
   * Render the 'Source of Collateral' or 'Fund Destination' rows
   * */
  type WalletCardComponentProps = { walletId: string, tokenId: string, isSrc: boolean }
  const WalletCardComponent = (props: WalletCardComponentProps) => {
    // eslint-disable-next-line react/prop-types
    const { walletId, tokenId, isSrc } = props
    const currencyCode = isSrc ? srcToken.currencyCode ?? '' : destToken.currencyCode ?? ''
    const balance = isSrc ? srcBalance : destBalance

    const leftChildren = (
      <View style={styles.halfContainer}>
        <CurrencyIcon sizeRem={2.5} marginRem={[0, 1, 0, 0]} tokenId={tokenId} walletId={walletId} />
        <View style={styles.columnLeft}>
          <EdgeText style={styles.textCardHeader}>{currencyCode}</EdgeText>
          <EdgeText style={styles.textSecondary}>{isSrc ? srcWalletName : destWalletName}</EdgeText>
        </View>
      </View>
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
      <Tile type="static" title={isSrc ? s.strings.loan_details_collateral_source : s.strings.loan_details_destination}>
        <View style={styles.spacedContainer}>
          {leftChildren}
          {rightChildren}
        </View>
      </Tile>
    )
  }

  return (
    <SceneWrapper>
      <SceneHeader underline textTitle={s.strings.loan_details_title} />
      <ScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <View style={styles.sceneContainer}>
          {/* Amount to borrow */}
          <Tile type="static" title={s.strings.loan_borrow_amount_title}>
            <EdgeText>
              <FiatText nativeCryptoAmount="1000000000000000000000" tokenId={destTokenId} wallet={destWallet} />
            </EdgeText>
          </Tile>
          <Tile type="static" title="Interest">
            <EdgeText>{hardApr}</EdgeText>
          </Tile>

          {/* Collateral Amount Required / Collateral Amount */}
          {/* TODO: Pending design update, USD icon(?) */}
          <Tile type="static" title={s.strings.loan_details_collateral_required}>
            <View style={styles.spacedContainer}>
              <View style={styles.halfContainer}>
                <CurrencyIcon sizeRem={2} marginRem={[0, 1, 0, 0]} pluginId="bitcoin" />
                <EdgeText style={styles.textCardHeader}>{hardBtc}</EdgeText>
              </View>
              <View style={styles.halfContainer}>
                <EdgeText style={styles.textCardHeader}>{hardUsd}</EdgeText>
              </View>
            </View>
          </Tile>

          {/* Source of Collateral / Source Wallet */}
          <WalletCardComponent isSrc walletId={srcWalletId} tokenId={srcTokenId} />

          {/* Fund Destination */}
          <WalletCardComponent isSrc={false} walletId={destWalletId} tokenId={destTokenId} />

          {/* Fee */}
          <CryptoFiatAmountTile
            title={s.strings.wc_smartcontract_network_fee}
            nativeCryptoAmount="10000000000000000"
            walletId={srcWalletId}
            currencyCode={srcWallet.currencyInfo.currencyCode}
            denomination={getDisplayDenomination(state, srcWallet.currencyInfo.pluginId, srcWallet.currencyInfo.currencyCode)}
          />
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
