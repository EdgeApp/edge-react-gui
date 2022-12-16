import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { memo } from 'react'

import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { cacheStyles, getTheme, Theme } from '../services/ThemeContext'
import { FiatText } from '../text/FiatText'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  wallet: EdgeCurrencyWallet
  tokenId?: string
}

export const ExchangeRate2 = memo<Props>((props: Props) => {
  const { wallet, tokenId } = props
  const { currencyInfo } = wallet
  const { pluginId } = currencyInfo
  const currencyCode = getCurrencyCode(wallet, tokenId)
  const primaryDisplayDenom = useDisplayDenom(pluginId, currencyCode)
  const theme = getTheme()
  const style = getStyles(theme)

  const primaryText = `1 ${primaryDisplayDenom.name} = `

  return (
    <EdgeText style={style.rateBalanceText}>
      {primaryText}
      <FiatText nativeCryptoAmount={primaryDisplayDenom.multiplier} tokenId={tokenId} wallet={wallet} />
    </EdgeText>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  rateBalanceText: {
    fontSize: theme.rem(0.75)
  }
}))
