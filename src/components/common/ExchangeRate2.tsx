// import { log10 } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { memo } from 'react'
import { TextStyle } from 'react-native'

import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { FiatText } from '../text/FiatText'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  wallet: EdgeCurrencyWallet
  tokenId?: string
  style?: TextStyle
}

export const ExchangeRate2 = memo<Props>((props: Props) => {
  const { wallet, tokenId, style } = props
  const { currencyInfo } = wallet
  const { pluginId } = currencyInfo
  const currencyCode = getCurrencyCode(wallet, tokenId)
  const primaryDisplayDenom = useDisplayDenom(pluginId, currencyCode)

  const primaryText = `1 ${primaryDisplayDenom.name} = `

  return (
    <EdgeText style={style}>
      {primaryText}
      <FiatText nativeCryptoAmount={primaryDisplayDenom.multiplier} tokenId={tokenId} wallet={wallet} />
    </EdgeText>
  )
})
