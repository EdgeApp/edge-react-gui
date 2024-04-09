import { EdgeTokenId } from 'edge-core-js'
import * as React from 'react'

import { EdgeText } from '../themed/EdgeText'
import { CryptoIconUi4 } from '../ui4/CryptoIconUi4'

interface Props {
  title?: string
}

export const HeaderTitle = (props: Props) => {
  const { title } = props

  return <EdgeText>{title}</EdgeText>
}

interface CryptoHeaderTitleProps {
  walletId: string
  tokenId: EdgeTokenId
}

export const CryptoHeaderTitle = (props: CryptoHeaderTitleProps) => {
  const { walletId, tokenId } = props

  return <CryptoIconUi4 sizeRem={1.5} tokenId={tokenId} walletId={walletId} />
}
