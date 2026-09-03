import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Image, ScrollView, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import WalletConnectLogo from '../../assets/images/walletconnect-logo.png'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { useWalletConnect } from '../../hooks/useWalletConnect'
import { lstrings } from '../../locales/strings'
import { getCurrencyIconUris } from '../../util/CdnUris'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { ModalButtons } from '../buttons/ModalButtons'
import { EdgeCard } from '../cards/EdgeCard'
import { FlashNotification } from '../navigation/FlashNotification'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { Alert } from '../themed/Alert'
import { ModalFooter, ModalTitle } from '../themed/ModalParts'
import { EdgeModal } from './EdgeModal'

interface Props {
  bridge: AirshipBridge<void>
  dAppIcon: string
  dAppName: string
  message: string
  /** The address the session advertised, which is the one the dapp verifies
   * the signature against. */
  publicAddress: string
  requestId: number
  topic: string
  wallet: EdgeCurrencyWallet
}

/**
 * Approval prompt for a WalletConnect `signMessage` request, used by chains
 * whose signing proves address ownership rather than moving funds (bip122
 * proof of ownership for on-ramp partners). Signing is free and spends
 * nothing, so it confirms with buttons rather than the slider the
 * smart-contract modal uses for value transfers.
 */
export const WcSignMessageModal: React.FC<Props> = props => {
  const {
    bridge,
    dAppIcon,
    dAppName,
    message,
    publicAddress,
    requestId,
    topic,
    wallet
  } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const walletConnect = useWalletConnect()

  const [isSigning, setIsSigning] = React.useState(false)

  const walletName = getWalletName(wallet)
  const walletImageUri = getCurrencyIconUris(
    wallet.currencyInfo.pluginId,
    null
  ).symbolImage

  const handleApprove = useHandler(async (): Promise<void> => {
    setIsSigning(true)
    try {
      // `signMessage` signs the literal UTF-8 message, which is what the dapp
      // verifies. `signBytes` would base64-re-encode first and sign the wrong
      // data. BIP137 encodes the signing address' script type in the header
      // byte, which SegWit verifiers require and which collapses to the legacy
      // encoding for non-SegWit addresses.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const signature = await wallet.signMessage(message, {
        otherParams: { publicAddress, signatureFormat: 'bip137' }
      })
      await walletConnect.approveRequest(topic, requestId, {
        address: publicAddress,
        signature
      })
      Airship.show(bridge => (
        <FlashNotification
          bridge={bridge}
          message={lstrings.wc_sign_message_confirmed}
          onPress={() => {}}
        />
      )).catch((err: unknown) => {
        showError(err)
      })
      bridge.resolve()
    } catch (error: unknown) {
      await walletConnect.rejectRequest(topic, requestId)
      showError(error)
      bridge.resolve()
    }
  })

  const handleReject = useHandler((): void => {
    walletConnect.rejectRequest(topic, requestId).catch((err: unknown) => {
      showError(err)
    })
    bridge.resolve()
  })

  return (
    <EdgeModal
      bridge={bridge}
      // Dismissing while the signature is in flight would reject a request the
      // approve path is about to answer, so the modal only closes when idle.
      onCancel={isSigning ? undefined : handleReject}
      title={
        <View style={styles.title}>
          <Image style={styles.logo} source={WalletConnectLogo} />
          <ModalTitle>{lstrings.wc_sign_message_title}</ModalTitle>
        </View>
      }
    >
      <ScrollView
        contentContainerStyle={styles.scrollPadding}
        scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
      >
        <Alert
          numberOfLines={0}
          title={lstrings.wc_smartcontract_warning_title}
          message={lstrings.wc_sign_message_warning_text}
          type="warning"
        />
        <EdgeCard icon={dAppIcon}>
          <EdgeRow title={lstrings.wc_sign_message_dapp} body={dAppName} />
        </EdgeCard>
        <EdgeCard icon={walletImageUri}>
          <EdgeRow title={lstrings.wc_sign_message_wallet} body={walletName} />
        </EdgeCard>
        <EdgeCard>
          <EdgeRow
            maximumHeight="large"
            title={lstrings.wc_sign_message_address}
            body={publicAddress}
          />
        </EdgeCard>
        {/* The message is what the user is authorizing, so it is never
        truncated: an ellipsized tail would be signed unseen. */}
        <EdgeCard>
          <EdgeRow
            maximumHeight="large"
            title={lstrings.wc_sign_message_message}
            body={message}
          />
        </EdgeCard>
        <ModalButtons
          primary={{
            label: lstrings.wc_sign_message_approve_button,
            onPress: handleApprove,
            spinner: isSigning
          }}
          secondary={{
            label: lstrings.wc_sign_message_reject_button,
            onPress: handleReject,
            disabled: isSigning
          }}
        />
      </ScrollView>
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.rem(1),
    paddingTop: theme.rem(1)
  },
  logo: {
    height: theme.rem(2),
    width: theme.rem(2),
    resizeMode: 'contain',
    padding: theme.rem(0.5)
  },
  scrollPadding: {
    paddingBottom: theme.rem(ModalFooter.bottomRem)
  }
}))
