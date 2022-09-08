// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { useTotalFiatAmount } from '../../util/borrowUtils'
import { FiatAmountTile } from './FiatAmountTile'

export const TotalDebtCollateralTile = (props: { title: string, wallet: EdgeCurrencyWallet, debtsOrCollaterals: any[] }) => {
  const { title, wallet, debtsOrCollaterals } = props
  const totalFiatAmount = useTotalFiatAmount(wallet, debtsOrCollaterals)

  return <FiatAmountTile title={title} fiatAmount={totalFiatAmount} wallet={wallet} />
}
