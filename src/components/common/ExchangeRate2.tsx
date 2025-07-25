import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { memo } from 'react'

import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { cacheStyles, getTheme, Theme } from '../services/ThemeContext'
import { FiatText } from '../text/FiatText'
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

  const primaryText = `1 ${primaryDisplayDenom.name} = `

  return (
    <EdgeText style={style.rateBalanceText}>
      {primaryText}
      <FiatText
        nativeCryptoAmount={primaryDisplayDenom.multiplier}
        tokenId={tokenId}
        currencyConfig={wallet.currencyConfig}
      />
    </EdgeText>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  rateBalanceText: {
    fontSize: theme.rem(0.75)
  }
}))
