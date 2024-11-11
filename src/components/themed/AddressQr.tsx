import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { useAsyncValue } from '../../hooks/useAsyncValue'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { QrCode } from '../themed/QrCode'

interface Props {
  address: string
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet

  nativeAmount?: string
  onPress?: (encodedUri?: string) => void
}

export const AddressQr = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { address, tokenId, wallet, nativeAmount, onPress = () => {} } = props

  const [encodedUri] = useAsyncValue(
    async () => await wallet.encodeUri({ publicAddress: address, currencyCode: getCurrencyCode(wallet, tokenId), nativeAmount }),
    [address, tokenId, nativeAmount, wallet]
  )

  return (
    <View style={styles.container}>
      <QrCode data={encodedUri} tokenId={tokenId} wallet={wallet} onPress={() => onPress(encodedUri)} marginRem={0} />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    aspectRatio: 1,
    height: '100%',
    width: '100%',
    alignSelf: 'center'
  }
}))
