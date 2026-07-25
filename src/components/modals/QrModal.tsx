import type { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { type AirshipBridge, AirshipModal } from 'react-native-airship'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { BlurView } from 'rn-id-blurview'

import { isBlurDisabled } from '../common/BlurBackground'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { QrCode } from '../themed/QrCode'

interface Props {
  bridge: AirshipBridge<void>
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet
  data?: string
}

export const QrModal: React.FC<Props> = props => {
  const { bridge, data, tokenId, wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const windowSize = useSafeAreaFrame()
  const maxSize = Math.min(windowSize.width, windowSize.height)

  const handleCancel = (): void => {
    bridge.resolve(undefined)
  }

  return (
    <AirshipModal
      bridge={bridge}
      backgroundColor="transparent"
      center
      maxWidth={maxSize}
      maxHeight={maxSize}
      onCancel={handleCancel}
      underlay={
        // Where the blur cannot render, dim the scene with a plain scrim:
        isBlurDisabled ? (
          <View style={[StyleSheet.absoluteFill, styles.scrim]} />
        ) : (
          <BlurView
            blurType={theme.isDark ? 'light' : 'dark'}
            style={StyleSheet.absoluteFill}
          />
        )
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

const getStyles = cacheStyles((theme: Theme) => ({
  scrim: {
    backgroundColor: theme.modalSceneOverlayColor,
    opacity: 0.7
  }
}))
