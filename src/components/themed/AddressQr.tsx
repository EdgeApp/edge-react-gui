import type { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { useAsyncValue } from '../../hooks/useAsyncValue'
import { useHandler } from '../../hooks/useHandler'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { QrModal } from '../modals/QrModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { QrCode } from '../themed/QrCode'

interface Props {
  address: string
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet

  nativeAmount?: string
}

/**
 * An address QR code in the receive scene.
 */
export const AddressQr: React.FC<Props> = props => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { address, tokenId, wallet, nativeAmount } = props

  const [encodedUri] = useAsyncValue(
    async () =>
      await wallet.encodeUri({
        publicAddress: address,
        currencyCode: getCurrencyCode(wallet, tokenId),
        nativeAmount
      }),
    [address, tokenId, nativeAmount, wallet]
  )

  const handlePress = useHandler(() => {
    Airship.show(bridge => (
      <QrModal
        bridge={bridge}
        tokenId={tokenId}
        wallet={wallet}
        data={encodedUri ?? address}
      />
    )).catch((err: unknown) => {
      showError(err)
    })
  })

  return (
    <View style={styles.container}>
      <QrCode
        data={encodedUri}
        tokenId={tokenId}
        pluginId={wallet.currencyInfo.pluginId}
        onPress={handlePress}
        marginRem={0}
      />
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
