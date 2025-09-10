import Clipboard from '@react-native-clipboard/clipboard'
import { asMaybe, asObject, asString } from 'cleaners'
import type { EdgeCurrencyWallet, EdgeParsedUri } from 'edge-core-js'
import { ethers } from 'ethers'
import * as React from 'react'
import AntDesign from 'react-native-vector-icons/AntDesign'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import { sprintf } from 'sprintf-js'

import { launchPaymentProto } from '../../actions/PaymentProtoActions'
import { addressWarnings } from '../../actions/ScanActions'
import { useHandler } from '../../hooks/useHandler'
import { useMount } from '../../hooks/useMount'
import { lstrings } from '../../locales/strings'
import { PaymentProtoError } from '../../types/PaymentProtoError'
import { useSelector } from '../../types/reactRedux'
import type { NavigationBase } from '../../types/routerTypes'
import { getTokenId, getTokenIdForced } from '../../util/CurrencyInfoHelpers'
import { parseDeepLink } from '../../util/DeepLinkParser'
import { checkPubAddress } from '../../util/FioAddressUtils'
import { resolveName } from '../../util/resolveName'
import { isEmail } from '../../util/utils'
import { EdgeAnim } from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { AddressModal } from '../modals/AddressModal'
import { ConfirmContinueModal } from '../modals/ConfirmContinueModal'
import { ScanModal } from '../modals/ScanModal'
import {
  WalletListModal,
  type WalletListResult
} from '../modals/WalletListModal'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export type AddressEntryMethod = 'scan' | 'other'

export interface ChangeAddressResult {
  fioAddress?: string
  parsedUri?: EdgeParsedUri
  addressEntryMethod: AddressEntryMethod
  alias?: string
}

export interface AddressTileRef {
  onChangeAddress: (address: string) => Promise<void>
}

interface Props {
  coreWallet: EdgeCurrencyWallet
  currencyCode: string
  title: string
  recipientAddress: string
  onChangeAddress: (changeAddressResult: ChangeAddressResult) => Promise<void>
  resetSendTransaction: () => void
  lockInputs?: boolean
  isCameraOpen: boolean
  fioToAddress?: string
  navigation: NavigationBase
}

export const AddressTile2 = React.forwardRef(
  (props: Props, ref: React.ForwardedRef<AddressTileRef>) => {
    const {
      coreWallet,
      currencyCode, // Token currency code
      fioToAddress,
      isCameraOpen,
      lockInputs,
      navigation,
      onChangeAddress,
      recipientAddress,
      resetSendTransaction,
      title
    } = props

    const theme = useTheme()
    const styles = getStyles(theme)

    // State:
    const [loading, setLoading] = React.useState(false)

    // Selectors:
    const account = useSelector(state => state.core.account)
    const fioPlugin = account.currencyConfig.fio

    const tokenId = getTokenId(coreWallet.currencyConfig, currencyCode)

    const { currencyWallets } = account
    const canSelfTransfer: boolean = Object.keys(currencyWallets).some(
      walletId => {
        if (walletId === coreWallet.id) return false
        if (currencyWallets[walletId].type !== coreWallet.type) return false
        if (tokenId == null) return true
        return currencyWallets[walletId].enabledTokenIds.includes(tokenId)
      }
    )

    // ---------------------------------------------------------------------------
    // Handlers
    // ---------------------------------------------------------------------------

    const changeAddress = useHandler(
      async (address: string, addressEntryMethod: AddressEntryMethod) => {
        if (address == null || address.trim() === '') return

        setLoading(true)
        const enteredInput = address.trim()
        address = enteredInput
        let zanoAlias: string | undefined
        let fioAddress
        if (fioPlugin != null) {
          try {
            const publicAddress = await checkPubAddress(
              fioPlugin,
              address.toLowerCase(),
              coreWallet.currencyInfo.currencyCode,
              currencyCode
            )
            fioAddress = address.toLowerCase()
            address = publicAddress
          } catch (e: unknown) {
            const invalidCode =
              fioPlugin.currencyInfo.defaultSettings?.errorCodes
                .INVALID_FIO_ADDRESS
            const asCodeError = asObject({ code: asString })
            const codeError = asMaybe(asCodeError)(e)
            if (codeError == null || codeError.code !== invalidCode) {
              setLoading(false)
              showError(e)
              return
            }
          }
        }

        // Check if this is an email for Tron USDT and show warning for potential
        // PIX send
        if (
          isEmail(address) &&
          coreWallet.currencyInfo.pluginId === 'tron' &&
          tokenId === 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
        ) {
          const approved = await Airship.show<boolean>(bridge => (
            <ConfirmContinueModal
              bridge={bridge}
              title={lstrings.warning_sending_pix_to_email_title}
              body={lstrings.warning_sending_pix_to_email_body}
              warning
              isSkippable
            />
          ))
          if (!approved) {
            setLoading(false)
            return
          }
        }

        // Try resolving address by ENS domain for ethereum wallets only
        if (
          coreWallet.currencyInfo.pluginId === 'ethereum' &&
          /^.*\.eth$/.test(address)
        ) {
          const chainId = 1 // Hard-coded to Ethereum mainnet
          const network = ethers.providers.getNetwork(chainId)
          if (network.name !== 'unknown') {
            try {
              const ethersProvider = ethers.getDefaultProvider(network)
              const resolvedAddress = await ethersProvider.resolveName(address)
              if (resolvedAddress != null) address = resolvedAddress
            } catch (_) {}
          }
        }

        // Preserve and resolve Zano aliases like "@alias"
        if (
          coreWallet.currencyInfo.pluginId === 'zano' &&
          typeof enteredInput === 'string' &&
          enteredInput.startsWith('@')
        ) {
          zanoAlias = enteredInput
          try {
            const resolved = await resolveName(coreWallet, enteredInput)
            if (resolved != null) address = resolved
          } catch (_) {}
        }

        try {
          const parsedUri = await coreWallet.parseUri(address, currencyCode)
          setLoading(false)

          // Check if the URI requires a warning to the user
          const approved = await addressWarnings(parsedUri, currencyCode)
          if (!approved) return

          // Missing isPrivateKeyUri Modal
          // Check is PaymentProtocolUri
          if (
            parsedUri.paymentProtocolUrl != null &&
            parsedUri.publicAddress == null
          ) {
            await launchPaymentProto(
              navigation,
              account,
              parsedUri.paymentProtocolUrl,
              {
                tokenId,
                navigateReplace: true,
                wallet: coreWallet
              }
            ).catch((error: unknown) => {
              showError(error)
            })

            return
          }

          if (
            parsedUri.publicAddress == null ||
            parsedUri.publicAddress === ''
          ) {
            showError(lstrings.scan_invalid_address_error_title)
            return
          }

          // set address
          await onChangeAddress({
            fioAddress,
            parsedUri,
            addressEntryMethod,
            alias: zanoAlias
          })
        } catch (e: unknown) {
          const currencyInfo = coreWallet.currencyInfo
          const ercTokenStandard =
            currencyInfo.defaultSettings?.otherSettings?.ercTokenStandard ?? ''
          const parsedLink = { ...parseDeepLink(address) }
          if (parsedLink.type === 'paymentProto') {
            if (ercTokenStandard === 'ERC20') {
              showError(
                new PaymentProtoError('CurrencyNotSupported', {
                  text: currencyInfo.currencyCode
                })
              )
            } else {
              await launchPaymentProto(navigation, account, parsedLink.uri, {
                tokenId,
                navigateReplace: true,
                wallet: coreWallet
              }).catch((error: unknown) => {
                showError(error)
              })
            }
          } else {
            showToast(
              `${lstrings.scan_invalid_address_error_title} ${lstrings.scan_invalid_address_error_description}`
            )
          }

          setLoading(false)
        }
      }
    )

    const handlePasteFromClipboard = useHandler(async () => {
      const clipboard = await Clipboard.getString()
      try {
        await changeAddress(clipboard, 'other')
      } catch (error: unknown) {
        showError(error, { trackError: false })
      }
    })

    const handleScan = useHandler(() => {
      const title = sprintf(
        lstrings.send_scan_modal_text_modal_title_s,
        currencyCode
      )
      const message = sprintf(
        lstrings.send_scan_modal_text_modal_message_s,
        currencyCode
      )
      Airship.show<string | undefined>(bridge => (
        <ScanModal
          bridge={bridge}
          scanModalTitle={lstrings.scan_qr_label}
          textModalHint={lstrings.send_scan_modal_text_modal_hint}
          textModalBody={message}
          textModalTitle={title}
        />
      ))
        .then(async (result: string | undefined) => {
          if (result == null) return
          await changeAddress(result, 'scan')
        })
        .catch((error: unknown) => {
          showError(error)
        })
    })

    const handleChangeAddress = useHandler(async () => {
      Airship.show<string | undefined>(bridge => (
        <AddressModal
          bridge={bridge}
          walletId={coreWallet.id}
          currencyCode={currencyCode}
          title={lstrings.scan_address_modal_title}
        />
      ))
        .then(async result => {
          if (result != null) {
            await changeAddress(result, 'other')
          }
        })
        .catch((error: unknown) => {
          showError(error)
        })
    })

    const handleSelfTransfer = useHandler(() => {
      const { currencyWallets } = account
      const { pluginId } = coreWallet.currencyInfo
      Airship.show<WalletListResult>(bridge => (
        <WalletListModal
          bridge={bridge}
          headerTitle={lstrings.your_wallets}
          navigation={navigation}
          allowedAssets={[
            {
              pluginId,
              tokenId: getTokenIdForced(account, pluginId, currencyCode)
            }
          ]}
          excludeWalletIds={[coreWallet.id]}
        />
      ))
        .then(async result => {
          if (result?.type !== 'wallet') return
          const { walletId } = result
          const wallet = currencyWallets[walletId]

          // Prefer segwit address if the selected wallet has one
          const { segwitAddress, publicAddress } =
            await wallet.getReceiveAddress({ tokenId: null })
          const address = segwitAddress ?? publicAddress
          await changeAddress(address, 'other')
        })
        .catch((err: unknown) => {
          showError(err)
        })
    })

    const handleTilePress = useHandler(async () => {
      resetSendTransaction()
    })

    // ---------------------------------------------------------------------------
    // Side-Effects
    // ---------------------------------------------------------------------------

    useMount(() => {
      if (isCameraOpen) handleScan()
    })

    React.useImperativeHandle(ref, () => ({
      async onChangeAddress(address: string) {
        await changeAddress(address, 'other')
      }
    }))

    // ---------------------------------------------------------------------------
    // Rendering
    // ---------------------------------------------------------------------------

    const hasRecipient = recipientAddress != null && recipientAddress !== ''
    const tileType = hasRecipient && lockInputs !== true ? 'delete' : 'none'

    return (
      <EdgeRow
        rightButtonType={tileType}
        loading={loading}
        title={title}
        onPress={
          lockInputs !== true && hasRecipient ? handleTilePress : undefined
        }
      >
        {hasRecipient ? null : (
          <EdgeAnim
            style={styles.buttonsContainer}
            enter={{ type: 'stretchInY' }}
            exit={{ type: 'stretchOutY' }}
          >
            <EdgeTouchableOpacity
              style={styles.buttonContainer}
              onPress={handleChangeAddress}
            >
              <FontAwesome
                name="edit"
                size={theme.rem(2)}
                color={theme.iconTappable}
              />
              <EdgeText style={styles.buttonText}>
                {lstrings.enter_as_in_enter_address_with_keyboard}
              </EdgeText>
            </EdgeTouchableOpacity>
            {canSelfTransfer ? (
              <EdgeTouchableOpacity
                style={styles.buttonContainer}
                onPress={handleSelfTransfer}
              >
                <AntDesign
                  name="wallet"
                  size={theme.rem(2)}
                  color={theme.iconTappable}
                />
                <EdgeText style={styles.buttonText}>
                  {lstrings.fragment_send_myself}
                </EdgeText>
              </EdgeTouchableOpacity>
            ) : null}
            <EdgeTouchableOpacity
              style={styles.buttonContainer}
              onPress={handleScan}
            >
              <FontAwesome5
                name="expand"
                size={theme.rem(2)}
                color={theme.iconTappable}
              />
              <EdgeText style={styles.buttonText}>
                {lstrings.scan_as_in_scan_barcode}
              </EdgeText>
            </EdgeTouchableOpacity>
            <EdgeTouchableOpacity
              style={styles.buttonContainer}
              onPress={handlePasteFromClipboard}
            >
              <FontAwesome5
                name="clipboard"
                size={theme.rem(2)}
                color={theme.iconTappable}
              />
              <EdgeText style={styles.buttonText}>
                {lstrings.string_paste}
              </EdgeText>
            </EdgeTouchableOpacity>
          </EdgeAnim>
        )}
        {!hasRecipient ? null : (
          <EdgeAnim
            enter={{ type: 'stretchInY' }}
            exit={{ type: 'stretchOutY' }}
          >
            {fioToAddress == null ? null : (
              <EdgeText>{fioToAddress + '\n'}</EdgeText>
            )}
            <EdgeText numberOfLines={3}>{recipientAddress}</EdgeText>
          </EdgeAnim>
        )}
      </EdgeRow>
    )
  }
)

const getStyles = cacheStyles((theme: Theme) => ({
  buttonsContainer: {
    paddingTop: theme.rem(0.75),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align items to the top
    alignSelf: 'stretch'
  },
  buttonContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    height: theme.rem(3), // Unify height of all buttons regardless of icon dimensions
    flex: 1
  },
  buttonText: {
    alignSelf: 'center',
    fontSize: theme.rem(0.75),
    marginTop: theme.rem(0.25),
    color: theme.textLink
  }
}))
