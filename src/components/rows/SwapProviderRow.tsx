import { EdgeSwapQuote } from 'edge-core-js'
import React from 'react'
import FastImage from 'react-native-fast-image'

import { useCryptoText } from '../../hooks/useCryptoText'
import { lstrings } from '../../locales/strings'
import { getSwapPluginIconUri } from '../../util/CdnUris'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
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

  return (
    <IconDataRow
      icon={<FastImage style={styles.providerIcon} source={{ uri: getSwapPluginIconUri(quote.pluginId, theme) }} resizeMode="contain" />}
      leftText={quote.swapInfo.displayName}
      leftSubtext={quote.swapInfo.isDex ? lstrings.quote_dex_provider : lstrings.quote_centralized_provider}
      rightText={costOrReceiveAmount}
      rightSubText={quote.canBePartial ? <EdgeText style={styles.partialSettlementText}>{lstrings.quote_partial_settlement}</EdgeText> : ''}
    />
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  providerIcon: {
    aspectRatio: 1,
    width: theme.rem(2),
    height: theme.rem(2)
  },
  partialSettlementText: {
    fontSize: theme.rem(0.75),
    color: theme.warningText
  }
}))
