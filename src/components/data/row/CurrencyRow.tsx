import { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'
import * as React from 'react'

import { SPECIAL_CURRENCY_INFO } from '../../../constants/WalletAndCurrencyConstants'
import { useWalletBalance } from '../../../hooks/useWalletBalance'
import { useWalletName } from '../../../hooks/useWalletName'
import { useSelector } from '../../../types/reactRedux'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { CryptoText } from '../../text/CryptoText'
import { FiatText } from '../../text/FiatText'
import { TickerText } from '../../text/TickerText'
import { IconDataRow } from './IconDataRow'

// For display of custom assets such as AAVE collateral tokens
export interface CustomAsset {
  displayName: string
  currencyCode: string
  // TODO: Update after hidden assets are supported in accountbased
  nativeBalance: string
  // Token referenced for its exchange rate and icon
  referenceTokenId: string
  wallet: EdgeCurrencyWallet
}

interface Props {
  customAsset?: CustomAsset
  marginRem?: number[] | number
  showRate?: boolean
  token?: EdgeToken
  tokenId?: string
  wallet: EdgeCurrencyWallet
}

// -----------------------------------------------------------------------------
// A view representing the data from a wallet, used for rows, cards, etc.
// -----------------------------------------------------------------------------
const CurrencyRowComponent = (props: Props) => {
  const { customAsset, marginRem, showRate = false, token, tokenId } = props
  const wallet = customAsset?.wallet ?? props.wallet
  const { pluginId } = wallet.currencyInfo
  const showTokenNames = SPECIAL_CURRENCY_INFO[pluginId]?.showTokenNames

  // Currency code and wallet name for display:
  const allTokens = wallet.currencyConfig.allTokens
  const tokenFromId = allTokens == null ? null : token != null ? token : tokenId == null ? null : allTokens[tokenId]
  const currencyCode = customAsset?.currencyCode ?? tokenFromId?.currencyCode ?? wallet.currencyInfo.currencyCode
  const walletName = useWalletName(wallet)
  const name = customAsset?.displayName ?? walletName

  // Balance stuff:
  const showBalance = useSelector(state => state.ui.settings.isAccountBalanceVisible)
  const walletBalance = useWalletBalance(wallet, tokenId)
  const balance = customAsset?.nativeBalance ?? walletBalance

  // Optional tokenId override
  const displayTokenId = customAsset?.referenceTokenId ?? tokenId
  const tickerText = showRate && wallet != null ? <TickerText wallet={wallet} tokenId={displayTokenId} /> : null
  const cryptoText = showBalance ? <CryptoText wallet={wallet} tokenId={displayTokenId} nativeAmount={balance} withSymbol /> : null
  const fiatText = showBalance ? <FiatText nativeCryptoAmount={balance} tokenId={displayTokenId} wallet={wallet} /> : null
  const icon = <CryptoIcon sizeRem={2} tokenId={displayTokenId} walletId={wallet.id} />

  let displayCurrencyCode = currencyCode
  if (showTokenNames === true && tokenFromId != null) {
    displayCurrencyCode = `${tokenFromId.displayName}`
  }

  return (
    <IconDataRow
      icon={icon}
      leftText={displayCurrencyCode}
      leftTextExtended={tickerText}
      leftSubtext={name}
      rightText={cryptoText}
      rightSubText={fiatText}
      marginRem={marginRem}
    />
  )
}

export const CurrencyRow = React.memo(CurrencyRowComponent)
