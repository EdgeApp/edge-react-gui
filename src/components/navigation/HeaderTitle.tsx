import { EdgeTokenId } from 'edge-core-js'
import * as React from 'react'

import { CryptoIcon } from '../icons/CryptoIcon'
import { EdgeText } from '../themed/EdgeText'

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

  return <CryptoIcon sizeRem={1.5} tokenId={tokenId} walletId={walletId} />
}
