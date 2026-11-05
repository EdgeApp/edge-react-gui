import { max } from 'biggystring'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { useTotalFiatAmount } from '../../util/borrowUtils'
import { FiatAmountTile } from './FiatAmountTile'

export const TotalDebtCollateralTile: React.FC<{
  title: string
  wallet: EdgeCurrencyWallet
  debtsOrCollaterals: any[]
}> = props => {
  const { title, wallet, debtsOrCollaterals } = props

  // Floor totalFiatAmount value at '0'
  const totalFiatAmount = max(
    '0',
    useTotalFiatAmount(wallet, debtsOrCollaterals)
  )

  return (
    <FiatAmountTile
      title={title}
      fiatAmount={totalFiatAmount}
      wallet={wallet}
      tokenId={null}
    />
  )
}
