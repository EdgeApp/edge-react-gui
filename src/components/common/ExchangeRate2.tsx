import type { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { memo } from 'react'

import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useFiatText } from '../../hooks/useFiatText'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'
import { cacheStyles, getTheme, type Theme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  wallet: EdgeCurrencyWallet
  tokenId: EdgeTokenId
}

export const ExchangeRate2 = memo<Props>((props: Props) => {
  const { wallet, tokenId } = props
  const primaryDisplayDenom = useDisplayDenom(wallet.currencyConfig, tokenId)
  const theme = getTheme()
  const style = getStyles(theme)

  const { denomination, isoFiatCurrencyCode } = useTokenDisplayData({
    tokenId,
    currencyConfig: wallet.currencyConfig
  })

  const fiatText = useFiatText({
    nativeCryptoAmount: primaryDisplayDenom.multiplier,
    tokenId,
    pluginId: wallet.currencyConfig.currencyInfo.pluginId,
    cryptoExchangeMultiplier: denomination.multiplier,
    isoFiatCurrencyCode
  })

  return (
    <EdgeText style={style.rateBalanceText}>
      {`1 ${primaryDisplayDenom.name} = `}
      {fiatText}
    </EdgeText>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  rateBalanceText: {
    fontSize: theme.rem(0.75)
  }
}))
