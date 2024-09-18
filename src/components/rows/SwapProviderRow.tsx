import { EdgeSwapQuote } from 'edge-core-js'
import React from 'react'
import FastImage from 'react-native-fast-image'
import { sprintf } from 'sprintf-js'

import { useCryptoText } from '../../hooks/useCryptoText'
import { lstrings } from '../../locales/strings'
import { getSwapPluginIconUri } from '../../util/CdnUris'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SmallText, WarningText } from '../themed/EdgeText'
import { IconDataRow } from './IconDataRow'

export interface Props {
  quote: EdgeSwapQuote
}

export const SwapProviderRow = (props: Props) => {
  const { quote } = props
  const { request, toNativeAmount, fromNativeAmount } = quote
  const { quoteFor } = request
  const { fromWallet, fromTokenId, toWallet, toTokenId } = request
  const theme = useTheme()
  const styles = getStyles(theme)

  const isToQuote = quoteFor === 'to'
  const wallet = isToQuote ? fromWallet : toWallet
  const tokenId = isToQuote ? fromTokenId : toTokenId
  const nativeAmount = isToQuote ? fromNativeAmount : toNativeAmount

  const costOrReceiveAmount = useCryptoText({ wallet, tokenId, nativeAmount })

  const minCryptoAmountText = useCryptoText({ wallet: toWallet, tokenId: toTokenId, nativeAmount: quote.minReceiveAmount ?? '0', withSymbol: false })
  const minReceiveAmountOrPartial =
    quote.minReceiveAmount != null ? (
      sprintf(lstrings.swap_minimum_amount_1s, minCryptoAmountText)
    ) : quote.canBePartial ? (
      <WarningText>
        <SmallText>{lstrings.quote_partial_settlement}</SmallText>
      </WarningText>
    ) : undefined
  const maybeVariableSymbol = quote.minReceiveAmount || quote.canBePartial ? '~ ' : ''

  return (
    <IconDataRow
      icon={<FastImage style={styles.providerIcon} source={{ uri: getSwapPluginIconUri(quote.pluginId, theme) }} resizeMode="contain" />}
      leftText={quote.swapInfo.displayName}
      leftSubtext={quote.swapInfo.isDex ? lstrings.quote_dex_provider : lstrings.quote_centralized_provider}
      rightText={`${maybeVariableSymbol}${costOrReceiveAmount}`}
      rightSubText={minReceiveAmountOrPartial}
    />
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  providerIcon: {
    aspectRatio: 1,
    width: theme.rem(2),
    height: theme.rem(2)
  }
}))
