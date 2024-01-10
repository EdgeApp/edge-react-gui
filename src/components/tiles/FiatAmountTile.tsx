import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'

import { formatFiatString } from '../../hooks/useFiatText'
import { getDenomFromIsoCode } from '../../util/utils'
import { FiatText } from '../text/FiatText'
import { EdgeText } from '../themed/EdgeText'
import { RowUi4 } from '../ui4/RowUi4'

// Either Fiat OR Crypto amount props must be provided.
interface Props {
  title: string

  // Fiat amount props
  fiatAmount?: string

  // Crypto amount props
  nativeCryptoAmount?: string
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet
}

export const FiatAmountTile = (props: Props) => {
  const { fiatAmount, nativeCryptoAmount, title, tokenId, wallet } = props
  if (fiatAmount == null && nativeCryptoAmount == null) throw new Error('Either fiat or crypto amount must be given to FiatAmountTile')

  const amountValue =
    fiatAmount != null ? (
      `${getDenomFromIsoCode(wallet.fiatCurrencyCode).symbol ?? ''}${formatFiatString({ fiatAmount })}`
    ) : nativeCryptoAmount != null ? (
      <FiatText tokenId={tokenId} nativeCryptoAmount={nativeCryptoAmount} wallet={wallet} />
    ) : null

  return (
    <RowUi4 title={title}>
      <EdgeText>{amountValue}</EdgeText>
    </RowUi4>
  )
}
