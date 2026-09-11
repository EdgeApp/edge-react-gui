import Clipboard from '@react-native-clipboard/clipboard'
import { asMaybe, asObject, asString } from 'cleaners'
import type {
  EdgeCurrencyWallet,
  EdgeParsedUri,
  EdgeTokenId
} from 'edge-core-js'
import { ethers } from 'ethers'
import * as React from 'react'
import { View } from 'react-native'
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
import type { EdgeAsset } from '../../types/types'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { parseDeepLink } from '../../util/DeepLinkParser'
import { checkPubAddress } from '../../util/FioAddressUtils'
import { type NameService, reverseLookupName } from '../../util/nameServices'
import { parsePaymentUri } from '../../util/paymentUri'
import { resolveName } from '../../util/resolveName'
import { isEmail } from '../../util/utils'
import { isZnsName, resolveZnsName } from '../../util/zns'
import { EdgeAnim } from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { AddressModal } from '../modals/AddressModal'
import { showFullScreenSpinner } from '../modals/AirshipFullScreenSpinner'
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
import { NameServicePrefix } from '../themed/NameServicePrefix'

export type AddressEntryMethod = 'scan' | 'other'

export interface ChangeAddressResult {
  fioAddress?: string
  parsedUri?: EdgeParsedUri
  addressEntryMethod: AddressEntryMethod
  alias?: string
  /**
   * Name resolved for the recipient via either forward resolution (user typed
   * a name like "alice.eth") or reverse lookup of the entered address. Carries
   * the source service so consumers can render a service-specific badge and
   * persist the name into transaction metadata.
   */
  resolvedName?: { name: string; service: NameService }
  /**
   * Display-units amount carried by a cross-chain payment URI, denominated in
   * the destination chain's primary asset. The tile has no destination
   * denomination to convert with, so the consumer converts to native units.
   */
  crossChainDisplayAmount?: string

  /**
   * Destination memo carried by a cross-chain payment URI (an XRP `dt`, or a
   * `memo`, `tag` or `message` parameter). Memo-required payout chains credit
   * the recipient by this value, so a scanned exchange deposit code that
   * carries one has to reach the consumer's destination-tag state.
   */
  crossChainMemo?: string

  /**
   * Destination chain inferred from the address itself, when the consumer
   * adopted an address belonging to a chain other than the sending wallet's.
   * Set only on that path, where the consumer's own destination state has not
   * re-rendered yet and so cannot be read back.
   */
  detectedDestPluginId?: string
}

export interface AddressTileRef {
  onChangeAddress: (address: string) => Promise<void>
}

interface Props {
  coreWallet: EdgeCurrencyWallet
  tokenId: EdgeTokenId
  title: string
  recipientAddress: string
  onChangeAddress: (changeAddressResult: ChangeAddressResult) => Promise<void>
  resetSendTransaction: () => void
  lockInputs?: boolean
  isCameraOpen: boolean
  /**
   * Friendly recipient name to render above the public address — e.g. a FIO
   * handle, Zano alias, or a name from a name-service reverse/forward lookup.
   * Display-only.
   */
  recipientName?: string
  /**
   * Source service for `recipientName`, when applicable. When set and the
   * service has a logo asset, an inline 1rem prefix renders before the name.
   * Pass `null` (or omit) to suppress the prefix — used for FIO/Zano handles
   * which carry no name-service identity.
   */
  recipientNameService?: NameService | null
  /**
   * Validates an entered address that belongs to a DIFFERENT chain than
   * `coreWallet`'s (a cross-asset send-to-address destination), bypassing the
   * wallet's own URI parsing and name-service resolution. Return false to
   * reject the address.
   *
   * `uri` carries what the scanned code said about its own chain: the scheme,
   * and the EIP-681 `@chainId`. Both are passed because the address alone
   * cannot settle which chain a code is for: chains that share an address
   * format validate each other's addresses, and every EVM network writes the
   * same `ethereum:` scheme, so only the chain id separates them.
   */
  crossChainAddressValidation?: (
    address: string,
    uri: { scheme?: string; evmChainId?: string }
  ) => boolean
  /**
   * Last resort for input this tile could not resolve on its own chain (or on
   * the currently-picked destination chain). An address for another chain is
   * usually a cross-chain send whose recipient asset has not been picked yet,
   * so the consumer gets a chance to detect that chain and adopt the address.
   * Return true when it took ownership, false to show the invalid-address
   * error as before.
   */
  onUnparsedAddress?: (
    address: string,
    addressEntryMethod: AddressEntryMethod
  ) => Promise<boolean>
  /**
   * Opt-in expansion of the "Myself" picker past the source asset. The caller
   * supplies the destination assets this send can route to, derived from route
   * metadata rather than any hardcoded asset shape, and adopts a cross-asset
   * pick through `onPickCrossAsset`. Same-asset wallets pin to the top of the
   * modal. Omitting this keeps the source-asset-only picker every other caller
   * gets.
   */
  selfTransfer?: {
    allowedAssets: EdgeAsset[]
    onPickCrossAsset: (pluginId: string, address: string) => Promise<boolean>
  }
  navigation: NavigationBase
}

export const AddressTile2 = React.forwardRef(
  (props: Props, ref: React.ForwardedRef<AddressTileRef>) => {
    const {
      coreWallet,
      tokenId,
      recipientName,
      recipientNameService,
      isCameraOpen,
      lockInputs,
      navigation,
      onChangeAddress,
      onUnparsedAddress,
      selfTransfer,
      recipientAddress,
      resetSendTransaction,
      crossChainAddressValidation,
      title
    } = props

    const theme = useTheme()
    const styles = getStyles(theme)

    // State:
    const [loading, setLoading] = React.useState(false)

    // Full-screen spinner driven by `loading` state:
    const spinnerResolveRef = React.useRef<(() => void) | null>(null)
    const spinnerTokenRef = React.useRef(0)
    React.useEffect(() => {
      if (loading && spinnerResolveRef.current == null) {
        let resolveFn: () => void
        const done = new Promise<void>(resolve => {
          resolveFn = resolve
        })
        spinnerResolveRef.current = resolveFn!
        const token = ++spinnerTokenRef.current
        showFullScreenSpinner(lstrings.spinner_hint, done)
          .catch(() => {})
          .finally(() => {
            // Only clear for the latest spinner instance
            if (spinnerTokenRef.current === token)
              spinnerResolveRef.current = null
          })
      } else if (!loading && spinnerResolveRef.current != null) {
        // Resolve the pending spinner when loading ends
        spinnerResolveRef.current()
        spinnerResolveRef.current = null
      }
    }, [loading])

    // Ensure spinner is dismissed on unmount
    React.useEffect(() => {
      return () => {
        if (spinnerResolveRef.current != null) {
          spinnerResolveRef.current()
          spinnerResolveRef.current = null
        }
      }
    }, [])

    // Selectors:
    const account = useSelector(state => state.core.account)
    const fioPlugin = account.currencyConfig.fio

    const currencyCode = getCurrencyCode(coreWallet, tokenId)

    const { currencyWallets } = account
    const canSelfTransfer: boolean = Object.keys(currencyWallets).some(
      walletId => {
        if (walletId === coreWallet.id) return false
        const wallet = currencyWallets[walletId]
        // A self-transfer caller offers every asset the send can route to, so
        // the control has to appear whenever the user holds ANY of them. The
        // same-type test below would hide it from exactly the account the
        // cross-chain picker exists for: one wallet on the source chain and
        // the rest elsewhere.
        if (selfTransfer != null) {
          return selfTransfer.allowedAssets.some(
            asset =>
              asset.pluginId === wallet.currencyInfo.pluginId &&
              (asset.tokenId == null ||
                wallet.enabledTokenIds.includes(asset.tokenId))
          )
        }
        if (wallet.type !== coreWallet.type) return false
        if (tokenId == null) return true
        return wallet.enabledTokenIds.includes(tokenId)
      }
    )

    // ---------------------------------------------------------------------------
    // Handlers
    // ---------------------------------------------------------------------------

    const changeAddress = useHandler(
      async (address: string, addressEntryMethod: AddressEntryMethod) => {
        if (address == null || address.trim() === '') return

        // A cross-chain destination cannot go through this wallet's URI
        // parsing or name services. Split payment URIs (scanned QR codes)
        // generically, then validate against the destination chain's own
        // rules and pass the address through verbatim.
        if (crossChainAddressValidation != null) {
          const { addressCandidates, displayAmount, scheme, evmChainId, memo } =
            parsePaymentUri(address)
          const crossChainAddress = addressCandidates.find(candidate =>
            crossChainAddressValidation(candidate, { scheme, evmChainId })
          )
          if (crossChainAddress == null) {
            // Not valid on the picked destination either. It may still belong
            // to some other chain the consumer can switch to.
            const adopted = await onUnparsedAddress?.(
              address,
              addressEntryMethod
            )
            if (adopted === true) return
            showToast(
              `${lstrings.scan_invalid_address_error_title} ${lstrings.scan_invalid_address_error_description}`
            )
            return
          }
          await onChangeAddress({
            parsedUri: { publicAddress: crossChainAddress },
            addressEntryMethod,
            crossChainDisplayAmount: displayAmount,
            crossChainMemo: memo
          })
          return
        }

        setLoading(true)
        const enteredInput = address.trim()
        address = enteredInput
        let zanoAlias: string | undefined
        let resolvedName: { name: string; service: NameService } | undefined
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
              if (resolvedAddress != null) {
                resolvedName = { name: enteredInput, service: 'ens' }
                address = resolvedAddress
              }
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

        // Preserve and resolve ZcashNames like "alice.zcash" / "alice.zec"
        if (
          coreWallet.currencyInfo.pluginId === 'zcash' &&
          isZnsName(enteredInput)
        ) {
          try {
            const resolved = await resolveZnsName(enteredInput)
            if (resolved != null) {
              resolvedName = {
                name: enteredInput.toLowerCase(),
                service: 'zns'
              }
              address = resolved
            }
          } catch (_) {}
        }

        try {
          const parsedUri: EdgeParsedUri & { paymentProtocolUrl?: string } =
            await coreWallet.parseUri(address, currencyCode)
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

          // If we don't already have a resolved name from a forward-typed
          // domain, attempt a reverse lookup against the parsed public
          // address. The dispatcher caches per (pluginId, address) so this
          // is a no-op on subsequent paste of the same address. Re-show the
          // spinner because the first lookup for an address makes sequential
          // ENS/UD network calls that can take several seconds.
          //
          // Skip when `fioAddress` is set: a FIO handle already owns this
          // send's identity, and a reverse-record hit would let the generic
          // `resolvedName` branch in SendScene2 run ahead of FIO handling and
          // misclassify the recipient as "Multiple FIO Addresses".
          if (resolvedName == null && fioAddress == null) {
            setLoading(true)
            try {
              const reverse = await reverseLookupName(
                coreWallet.currencyInfo.pluginId,
                parsedUri.publicAddress
              )
              if (reverse != null) resolvedName = reverse
            } finally {
              setLoading(false)
            }
          }

          // set address
          await onChangeAddress({
            fioAddress,
            parsedUri,
            addressEntryMethod,
            alias: zanoAlias,
            resolvedName
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
            // This wallet's chain can't read the input. Before calling it
            // invalid, let the consumer check whether it addresses another
            // chain, which turns the send into a cross-chain swap.
            setLoading(false)
            const adopted = await onUnparsedAddress?.(
              address,
              addressEntryMethod
            )
            if (adopted === true) return
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
      const nameServices: string[] = []
      if (fioPlugin != null) nameServices.push('FIO')
      if (coreWallet.currencyInfo.pluginId === 'ethereum')
        nameServices.push('ENS')
      if (coreWallet.currencyInfo.pluginId === 'zcash') nameServices.push('ZNS')
      const title =
        nameServices.length > 0
          ? sprintf(
              lstrings.scan_address_modal_title_1s,
              nameServices.join(', ')
            )
          : lstrings.scan_address_modal_title

      Airship.show<string | undefined>(bridge => (
        <AddressModal
          bridge={bridge}
          walletId={coreWallet.id}
          currencyCode={currencyCode}
          title={title}
        />
      ))
        .then(async result => {
          if (result != null && result !== '') {
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
      const sourceAsset = { pluginId, tokenId }
      Airship.show<WalletListResult>(bridge => (
        <WalletListModal
          bridge={bridge}
          headerTitle={lstrings.your_wallets}
          navigation={navigation}
          allowedAssets={selfTransfer?.allowedAssets ?? [sourceAsset]}
          pinnedAssets={selfTransfer == null ? undefined : [sourceAsset]}
          pinnedTitle={
            selfTransfer == null
              ? undefined
              : lstrings.wallet_list_modal_header_same_asset
          }
          otherTitle={
            selfTransfer == null
              ? undefined
              : lstrings.wallet_list_modal_header_other_assets
          }
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

          // A wallet on another chain is a cross-asset destination, so the
          // caller adopts it (recipient asset, quote reset) instead of this
          // tile validating the address against the source wallet's chain.
          const destPluginId = wallet.currencyInfo.pluginId
          if (selfTransfer != null && destPluginId !== pluginId) {
            await selfTransfer.onPickCrossAsset(destPluginId, address)
            return
          }
          await changeAddress(address, 'other')
        })
        .catch((err: unknown) => {
          showError(err)
        })
    })

    const handleTilePress = useHandler(() => {
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
        {recipientAddress == null || recipientAddress === '' ? (
          <EdgeAnim
            style={styles.buttonsContainer}
            enter={{ type: 'stretchInY' }}
            exit={{ type: 'stretchOutY' }}
          >
            <EdgeTouchableOpacity
              style={styles.buttonContainer}
              onPress={handleChangeAddress}
              testID="addressTileEnter"
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
                testID="addressTileMyself"
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
              testID="addressTileScan"
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
              testID="addressTilePaste"
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
        ) : null}
        {recipientAddress == null || recipientAddress === '' ? null : (
          <EdgeAnim
            enter={{ type: 'stretchInY' }}
            exit={{ type: 'stretchOutY' }}
          >
            {recipientName == null ? null : (
              <View style={styles.recipientNameRow}>
                {recipientNameService != null ? (
                  <NameServicePrefix service={recipientNameService} />
                ) : null}
                <EdgeText>{recipientName}</EdgeText>
              </View>
            )}
            <EdgeText
              numberOfLines={6}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
              allowFontScaling
              style={styles.recipientAddressText}
            >
              {recipientAddress}
            </EdgeText>
          </EdgeAnim>
        )}
      </EdgeRow>
    )
  }
)

const getStyles = cacheStyles((theme: Theme) => ({
  recipientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.rem(0.5)
  },
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
  },
  recipientAddressText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    includeFontPadding: false
  }
}))
