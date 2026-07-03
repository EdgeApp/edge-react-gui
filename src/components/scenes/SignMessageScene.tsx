import { useQuery } from '@tanstack/react-query'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { SceneButtons } from '../buttons/SceneButtons'
import { EdgeCard } from '../cards/EdgeCard'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { EdgeRow } from '../rows/EdgeRow'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText, Paragraph, SmallText } from '../themed/EdgeText'
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
 *
 * The signing address defaults to the wallet's current receive address, but is
 * editable: an exchange usually asks the user to prove control of the specific
 * address they already provided (often a previously-used one), so the user can
 * replace the default with that address. The wallet must control whichever
 * address is entered; the plugin signs with the key derived from that address's
 * stored derivation path, and rejects any address it does not own.
 */
const SignMessageSceneComponent: React.FC<Props> = props => {
  const { wallet } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const [address, setAddress] = React.useState('')
  const [addressTouched, setAddressTouched] = React.useState(false)
  const [message, setMessage] = React.useState('')
  const [signature, setSignature] = React.useState('')
  const [isSigning, setIsSigning] = React.useState(false)

  // Default to the wallet's own receive address. Prefer the native segwit
  // address (the canonical receive address the user hands the exchange),
  // matching `segwitAddress ?? publicAddress` used elsewhere; the
  // `publicAddress` type is the wrapped/legacy variant.
  const { data: defaultAddress, error: addressError } = useQuery({
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

  // Seed the editable address with the default once it loads, unless the user
  // has already typed their own address.
  React.useEffect(() => {
    if (!addressTouched && defaultAddress != null) setAddress(defaultAddress)
  }, [addressTouched, defaultAddress])

  // A signature is bound to both the message and the address, so clear it
  // whenever either changes to prevent copying a stale signature.
  const handleChangeAddress = useHandler((text: string) => {
    setAddressTouched(true)
    setAddress(text.trim())
    setSignature('')
  })

  const handleUseDefaultAddress = useHandler(() => {
    setAddressTouched(false)
    if (defaultAddress != null) setAddress(defaultAddress)
    setSignature('')
  })

  const handleChangeMessage = useHandler((text: string) => {
    setMessage(text)
    setSignature('')
  })

  const handleSign = useHandler(async () => {
    if (address === '') {
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
        otherParams: { publicAddress: address }
      })
      setSignature(signedMessage)
    } catch (error: unknown) {
      // The plugin throws when the wallet does not own the address (or it is
      // malformed). Surface a clear, actionable message for that common case.
      if (
        error instanceof Error &&
        /data-layer address|scriptPubkey|invalid/i.test(error.message)
      ) {
        showError(lstrings.sign_message_address_not_owned_error)
      } else {
        showError(error)
      }
    } finally {
      setIsSigning(false)
    }
  })

  const showUseDefault =
    defaultAddress != null && address !== defaultAddress && !isSigning

  return (
    <SceneWrapper scroll>
      <View style={styles.container}>
        <Paragraph>{lstrings.sign_message_instructions}</Paragraph>

        <FilledTextInput
          aroundRem={0.5}
          autoCapitalize="none"
          autoCorrect={false}
          // Lock the field while signing so the address cannot change mid-flight
          // and leave the produced signature bound to a different address.
          disabled={isSigning}
          placeholder={lstrings.sign_message_address_input_placeholder}
          testID="signMessageAddressInput"
          value={address}
          onChangeText={handleChangeAddress}
        />
        <Paragraph>
          <SmallText>{lstrings.sign_message_address_helper}</SmallText>
        </Paragraph>
        {showUseDefault ? (
          <EdgeTouchableOpacity
            style={styles.useDefault}
            onPress={handleUseDefaultAddress}
          >
            <EdgeText style={styles.useDefaultText}>
              {lstrings.sign_message_use_default_address}
            </EdgeText>
          </EdgeTouchableOpacity>
        ) : null}

        <FilledTextInput
          aroundRem={0.5}
          autoCorrect={false}
          // Lock the field while signing so the message cannot change mid-flight
          // and leave the produced signature bound to a different message.
          disabled={isSigning}
          multiline
          numberOfLines={4}
          placeholder={lstrings.sign_message_input_placeholder}
          testID="signMessageInput"
          value={message}
          onChangeText={handleChangeMessage}
        />

        {signature !== '' && (
          <EdgeCard>
            <EdgeRow
              rightButtonType="copy"
              testID="signMessageSignatureCopy"
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
            disabled: message === '' || address === '',
            spinner: isSigning,
            testID: 'signMessageButton'
          }}
        />
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    padding: theme.rem(0.5)
  },
  useDefault: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.rem(0.5),
    paddingBottom: theme.rem(0.5)
  },
  useDefaultText: {
    color: theme.iconTappable,
    fontSize: theme.rem(0.75)
  }
}))

export const SignMessageScene = withWallet(SignMessageSceneComponent)
