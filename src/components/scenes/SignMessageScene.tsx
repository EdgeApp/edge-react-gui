import { useQuery } from '@tanstack/react-query'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { SceneButtons } from '../buttons/SceneButtons'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { EdgeRow } from '../rows/EdgeRow'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { Paragraph, SmallText } from '../themed/EdgeText'
import { FilledTextInput } from '../themed/FilledTextInput'

export interface SignMessageParams {
  walletId: string
}

interface Props extends EdgeAppSceneProps<'signMessage'> {
  wallet: EdgeCurrencyWallet
}

/**
 * Lets a user sign an arbitrary message with an address they control, to prove
 * self-hosted wallet ownership when withdrawing from a CEX/CASP (EU Travel
 * Rule). BTC-first: the menu entry only appears for UTXO wallets whose plugin
 * implements message signing.
 */
const SignMessageSceneComponent: React.FC<Props> = props => {
  const { wallet } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const [message, setMessage] = React.useState('')
  const [signature, setSignature] = React.useState('')
  const [isSigning, setIsSigning] = React.useState(false)

  // The signing address must be one the wallet owns, so we default to the
  // wallet's own receive address rather than accepting an arbitrary one.
  // Prefer the native segwit address (the canonical receive address the user
  // hands the exchange), matching `segwitAddress ?? publicAddress` used
  // elsewhere; the `publicAddress` type is the wrapped/legacy variant.
  const { data: publicAddress, error: addressError } = useQuery({
    queryKey: ['signMessageAddress', wallet.id],
    queryFn: async () => {
      const addresses = await wallet.getAddresses({ tokenId: null })
      const receiveAddress =
        addresses.find(address => address.addressType === 'segwitAddress') ??
        addresses.find(address => address.addressType === 'publicAddress') ??
        addresses[0]
      if (receiveAddress == null) {
        throw new Error(lstrings.sign_message_no_address_error)
      }
      return receiveAddress.publicAddress
    }
  })

  React.useEffect(() => {
    if (addressError != null) showError(addressError)
  }, [addressError])

  // Clear any prior signature when the message changes, so a stale signature
  // that no longer matches the message can never be copied.
  const handleChangeMessage = useHandler((text: string) => {
    setMessage(text)
    setSignature('')
  })

  const handleSign = useHandler(async () => {
    if (publicAddress == null) {
      showError(lstrings.sign_message_no_address_error)
      return
    }
    setIsSigning(true)
    try {
      // `signMessage` signs the literal UTF-8 message, which is what exchanges
      // verify. `signBytes` would base64-re-encode the bytes before signing and
      // produce a signature over the wrong data, so it is not usable here.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const signedMessage = await wallet.signMessage(message, {
        otherParams: { publicAddress }
      })
      setSignature(signedMessage)
    } catch (error: unknown) {
      showError(error)
    } finally {
      setIsSigning(false)
    }
  })

  return (
    <SceneWrapper scroll>
      <View style={styles.container}>
        <Paragraph>{lstrings.sign_message_instructions}</Paragraph>

        <EdgeCard>
          <EdgeRow
            rightButtonType="copy"
            title={lstrings.sign_message_address_label}
            body={publicAddress ?? ''}
          />
        </EdgeCard>

        <FilledTextInput
          aroundRem={0.5}
          autoCorrect={false}
          // Lock the field while signing so the message cannot change mid-flight
          // and leave the produced signature bound to a different message.
          disabled={isSigning}
          multiline
          numberOfLines={4}
          placeholder={lstrings.sign_message_input_placeholder}
          value={message}
          onChangeText={handleChangeMessage}
        />

        {signature !== '' && (
          <EdgeCard>
            <EdgeRow
              rightButtonType="copy"
              title={lstrings.sign_message_signature_label}
              body={signature}
            />
          </EdgeCard>
        )}

        <Paragraph>
          <SmallText>{lstrings.sign_message_safety_note}</SmallText>
        </Paragraph>

        <SceneButtons
          primary={{
            label: lstrings.sign_message_sign_button,
            onPress: handleSign,
            disabled: message === '' || publicAddress == null,
            spinner: isSigning
          }}
        />
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    padding: theme.rem(0.5)
  }
}))

export const SignMessageScene = withWallet(SignMessageSceneComponent)
