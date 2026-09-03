import type { EdgePendingWalletShare } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { showError, showToast } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { Paragraph } from '../themed/EdgeText'
import { QrCode } from '../themed/QrCode'
import { EdgeModal } from './EdgeModal'

interface Props {
  /** Resolves to the received wallet ids, or undefined if nothing arrived. */
  bridge: AirshipBridge<string[] | undefined>
  pending: EdgePendingWalletShare
  /**
   * Show the lobby link as a QR while waiting. False for the accept-offer
   * flow, where the other side already has the link and we only wait.
   */
  showQr?: boolean
}

/**
 * Waits on a pending share from the receiving side. Shows the QR until the
 * sharer picks it up, then a spinner until the keys land.
 */
export const WalletShareReceiveModal: React.FC<Props> = props => {
  const { bridge, pending, showQr = true } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const state = useWatch(pending, 'state')
  const receivedWalletIds = useWatch(pending, 'receivedWalletIds')

  React.useEffect(() => {
    switch (state) {
      case 'done':
        bridge.resolve(receivedWalletIds ?? [])
        break
      case 'error':
        showError(pending.error)
        bridge.resolve(undefined)
        break
      case 'closed':
        showToast(lstrings.wallet_share_expired)
        bridge.resolve(undefined)
        break
      case 'pending':
      case 'started':
        break
    }
  }, [bridge, pending, receivedWalletIds, state])

  const handleCancel = useHandler(() => {
    pending.cancelRequest().catch((error: unknown) => {
      showError(error)
    })
    bridge.resolve(undefined)
  })

  const waiting = state !== 'pending' || !showQr

  return (
    <EdgeModal
      bridge={bridge}
      title={lstrings.wallet_share_receive_title}
      onCancel={handleCancel}
    >
      {waiting ? (
        <View style={styles.spinnerContainer}>
          <ActivityIndicator color={theme.iconTappable} size="large" />
          <Paragraph center>{lstrings.wallet_share_receive_waiting}</Paragraph>
        </View>
      ) : (
        <>
          <View style={styles.qrContainer}>
            <QrCode data={pending.uri} marginRem={0.5} />
          </View>
          <Paragraph center>
            {lstrings.wallet_share_receive_instructions}
          </Paragraph>
        </>
      )}
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  qrContainer: {
    // QrCode sizes itself from its container's height:
    height: theme.rem(16),
    alignItems: 'center',
    justifyContent: 'center'
  },
  spinnerContainer: {
    height: theme.rem(16),
    alignItems: 'center',
    justifyContent: 'center'
  }
}))
