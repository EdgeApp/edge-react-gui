import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import { AirshipBridge, AirshipModal } from 'react-native-airship'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { BlurView } from 'rn-id-blurview'

import { useTheme } from '../services/ThemeContext'
import { QrCode } from '../themed/QrCode'

interface Props {
  bridge: AirshipBridge<void>
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet
  data?: string
}

export function QrModal(props: Props) {
  const { bridge, data, tokenId, wallet } = props
  const theme = useTheme()
  const windowSize = useSafeAreaFrame()
  const maxSize = Math.min(windowSize.width, windowSize.height)

  const handleCancel = () => bridge.resolve(undefined)

  return (
    <AirshipModal
      bridge={bridge}
      backgroundColor="transparent"
      center
      maxWidth={maxSize}
      maxHeight={maxSize}
      onCancel={handleCancel}
      underlay={
        <BlurView
          blurType={theme.isDark ? 'light' : 'dark'}
          style={StyleSheet.absoluteFill}
        />
      }
    >
      <QrCode
        data={data}
        tokenId={tokenId}
        pluginId={wallet.currencyInfo.pluginId}
        onPress={handleCancel}
      />
    </AirshipModal>
  )
}
