import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'

import { formatFiatString } from '../../hooks/useFiatText'
import { useSelector } from '../../types/reactRedux'
import { getDenomFromIsoCode } from '../../util/utils'
import { EdgeRow } from '../rows/EdgeRow'
import { FiatText } from '../text/FiatText'
import { EdgeText } from '../themed/EdgeText'

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
  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)

  const amountValue =
    fiatAmount != null ? (
      `${getDenomFromIsoCode(defaultIsoFiat).symbol ?? ''}${formatFiatString({ fiatAmount })}`
    ) : nativeCryptoAmount != null ? (
      <FiatText tokenId={tokenId} nativeCryptoAmount={nativeCryptoAmount} wallet={wallet} />
    ) : null

  return (
    <EdgeRow title={title}>
      <EdgeText>{amountValue}</EdgeText>
    </EdgeRow>
  )
}
