import type {
  BreezSdkInterface,
  PrepareSendPaymentResponse
} from '@breeztech/breez-sdk-spark-react-native'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import {
  confirmLightningSend,
  connectLightning,
  describeLightningError,
  prepareLightningSend
} from '../../util/breez/breezLightningSend'
import { EdgeButton } from '../buttons/EdgeButton'
import { EdgeRow } from '../rows/EdgeRow'
import { showToast } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { Paragraph } from '../themed/EdgeText'
import { ModalTitle } from '../themed/ModalParts'
import { EdgeModal } from './EdgeModal'

interface Props {
  bridge: AirshipBridge<boolean>
  account: EdgeAccount
  wallet: EdgeCurrencyWallet
  /** A normalized (no `lightning:` prefix) BOLT11 invoice. */
  invoice: string
}

type Status = 'preparing' | 'ready' | 'sending' | 'error'

const SATS_PER_BTC = 1e8

/**
 * Confirmation modal for a Bitcoin Lightning send. Connects the Breez SDK for
 * the wallet, prepares the payment to surface the amount, and sends on confirm.
 * Resolves `true` once a payment is sent, `false` if the user cancels.
 */
export const LightningSendModal: React.FC<Props> = props => {
  const { bridge, account, wallet, invoice } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const [status, setStatus] = React.useState<Status>('preparing')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [amountSats, setAmountSats] = React.useState<number | null>(null)

  const sdkRef = React.useRef<BreezSdkInterface | null>(null)
  const prepareRef = React.useRef<PrepareSendPaymentResponse | null>(null)

  React.useEffect(() => {
    let mounted = true
    const run = async (): Promise<void> => {
      const sdk = await connectLightning(account, wallet)
      const prepared = await prepareLightningSend(sdk, invoice)
      if (!mounted) return
      sdkRef.current = sdk
      prepareRef.current = prepared
      setAmountSats(Number(prepared.amount))
      setStatus('ready')
    }
    run().catch((error: unknown) => {
      if (!mounted) return
      setErrorMessage(describeLightningError(error))
      setStatus('error')
    })
    return () => {
      mounted = false
    }
  }, [account, wallet, invoice])

  const handleClose = useHandler(() => {
    bridge.resolve(false)
  })

  const handlePay = useHandler(async () => {
    const sdk = sdkRef.current
    const prepared = prepareRef.current
    if (sdk == null || prepared == null) return
    setStatus('sending')
    try {
      const payment = await confirmLightningSend(sdk, prepared)
      showToast(
        sprintf(
          lstrings.lightning_send_success_2s,
          String(Number(payment.amount)),
          String(Number(payment.fees))
        )
      )
      bridge.resolve(true)
    } catch (error: unknown) {
      setErrorMessage(describeLightningError(error))
      setStatus('error')
    }
  })

  return (
    <EdgeModal
      bridge={bridge}
      title={<ModalTitle>{lstrings.lightning_send_title}</ModalTitle>}
      onCancel={handleClose}
    >
      {status === 'preparing' ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primaryText} size="large" />
          <Paragraph>{lstrings.lightning_send_preparing}</Paragraph>
        </View>
      ) : null}

      {status === 'error' ? (
        <Paragraph>
          {errorMessage ?? lstrings.lightning_send_error_generic}
        </Paragraph>
      ) : null}

      {(status === 'ready' || status === 'sending') && amountSats != null ? (
        <>
          <EdgeRow
            title={lstrings.lightning_send_amount}
            body={formatSats(amountSats)}
          />
          {status === 'sending' ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.primaryText} size="large" />
            </View>
          ) : (
            <EdgeButton
              label={lstrings.lightning_send_pay}
              type="primary"
              onPress={handlePay}
            />
          )}
        </>
      ) : null}
    </EdgeModal>
  )
}

/** Renders a sat amount as "<n> sats (<btc> BTC)". */
function formatSats(sats: number): string {
  const btc = (sats / SATS_PER_BTC).toFixed(8)
  return sprintf(lstrings.lightning_send_sats_2s, String(sats), btc)
}

const getStyles = cacheStyles((theme: Theme) => ({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.rem(1)
  }
}))
