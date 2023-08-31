import Clipboard from '@react-native-clipboard/clipboard'
import { EdgeCurrencyWallet, EdgeParsedUri } from 'edge-core-js'
import { ethers } from 'ethers'
import * as React from 'react'
import { AppState, TouchableOpacity, View } from 'react-native'
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
import { NavigationBase } from '../../types/routerTypes'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { parseDeepLink } from '../../util/DeepLinkParser'
import { checkPubAddress } from '../../util/FioAddressUtils'
import { AddressModal } from '../modals/AddressModal'
import { ScanModal } from '../modals/ScanModal'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Tile } from './Tile'

export interface ChangeAddressResult {
  fioAddress?: string
  parsedUri?: EdgeParsedUri
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

export const AddressTile2 = React.forwardRef((props: Props, ref: React.ForwardedRef<AddressTileRef>) => {
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
  const [clipboard, setClipboard] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  // Selectors:
  const account = useSelector(state => state.core.account)
  const fioPlugin = account.currencyConfig.fio

  const tokenId = getTokenId(account, coreWallet.currencyInfo.pluginId, currencyCode)

  const { currencyWallets } = account
  const canSelfTransfer: boolean = Object.keys(currencyWallets).some(walletId => {
    if (walletId === coreWallet.id) return false
    if (currencyWallets[walletId].type !== coreWallet.type) return false
    if (tokenId == null) return true
    return currencyWallets[walletId].enabledTokenIds.includes(tokenId)
  })

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const changeAddress = useHandler(async (address: string) => {
    if (address == null || address === '') return

    setLoading(true)
    let fioAddress
    if (fioPlugin) {
      try {
        const publicAddress = await checkPubAddress(fioPlugin, address.toLowerCase(), coreWallet.currencyInfo.currencyCode, currencyCode)
        fioAddress = address.toLowerCase()
        address = publicAddress
      } catch (e: any) {
        if (!e.code || e.code !== fioPlugin.currencyInfo.defaultSettings.errorCodes.INVALID_FIO_ADDRESS) {
          setLoading(false)
          return showError(e)
        }
      }
    }

    // Try resolving address by ENS domain for ethereum wallets only
    if (coreWallet.currencyInfo.pluginId === 'ethereum' && /^.*\.eth$/.test(address)) {
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

    try {
      const parsedUri: EdgeParsedUri & { paymentProtocolUrl?: string } = await coreWallet.parseUri(address, currencyCode)
      setLoading(false)

      // Check if the URI requires a warning to the user
      const approved = await addressWarnings(parsedUri, currencyCode)
      if (!approved) return

      // Missing isPrivateKeyUri Modal
      // Check is PaymentProtocolUri
      if (!!parsedUri.paymentProtocolUrl && !parsedUri.publicAddress) {
        await launchPaymentProto(navigation, account, parsedUri.paymentProtocolUrl, {
          currencyCode,
          navigateReplace: true,
          wallet: coreWallet
        }).catch(showError)

        return
      }

      if (!parsedUri.publicAddress) {
        return showError(lstrings.scan_invalid_address_error_title)
      }

      // set address
      await onChangeAddress({ fioAddress, parsedUri })
    } catch (e: any) {
      const currencyInfo = coreWallet.currencyInfo
      const ercTokenStandard = currencyInfo.defaultSettings?.otherSettings?.ercTokenStandard ?? ''
      const parsedLink = { ...parseDeepLink(address) }
      if (parsedLink.type === 'paymentProto') {
        if (ercTokenStandard === 'ERC20') {
          showError(new PaymentProtoError('CurrencyNotSupported', { text: currencyInfo.currencyCode }))
        } else {
          await launchPaymentProto(navigation, account, parsedLink.uri, { currencyCode, navigateReplace: true, wallet: coreWallet }).catch(showError)
        }
      } else {
        showError(`${lstrings.scan_invalid_address_error_title} ${lstrings.scan_invalid_address_error_description}`)
      }

      setLoading(false)
    }
  })

  const checkClipboard = useHandler(async () => {
    try {
      setLoading(true)
      const uri = await Clipboard.getString()

      // Will throw in case uri is invalid
      await coreWallet.parseUri(uri, currencyCode)
      setClipboard(uri)
      setLoading(false)
    } catch (e: any) {
      // Failure is acceptable
      setClipboard('')
      setLoading(false)
    }
  })

  const handlePasteFromClipboard = useHandler(() => {
    changeAddress(clipboard).catch(err => showError(err))
  })

  const handleScan = useHandler(() => {
    const title = sprintf(lstrings.send_scan_modal_text_modal_title_s, currencyCode)
    const message = sprintf(lstrings.send_scan_modal_text_modal_message_s, currencyCode)
    Airship.show<string | undefined>(bridge => (
      <ScanModal
        bridge={bridge}
        title={lstrings.scan_qr_label}
        textModalHint={lstrings.send_scan_modal_text_modal_hint}
        textModalBody={message}
        textModalTitle={title}
      />
    ))
      .then(async (result: string | undefined) => {
        if (result) {
          await changeAddress(result)
        }
      })
      .catch(error => {
        showError(error)
      })
  })

  const handleChangeAddress = useHandler(async () => {
    Airship.show<string | undefined>(bridge => (
      <AddressModal bridge={bridge} walletId={coreWallet.id} currencyCode={currencyCode} title={lstrings.scan_address_modal_title} />
    ))
      .then(async result => {
        if (result) {
          await changeAddress(result)
        }
      })
      .catch(error => {
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
        allowedAssets={[{ pluginId, tokenId: getTokenId(account, pluginId, currencyCode) }]}
        excludeWalletIds={[coreWallet.id]}
      />
    ))
      .then(async walletList => {
        const { walletId } = walletList
        if (walletId == null) return
        const wallet = currencyWallets[walletId]

        // Prefer segwit address if the selected wallet has one
        const { segwitAddress, publicAddress } = await wallet.getReceiveAddress()
        const address = segwitAddress != null ? segwitAddress : publicAddress
        await changeAddress(address)
      })
      .catch(err => showError(err))
  })

  const handleTilePress = useHandler(async () => {
    if (!lockInputs && !!recipientAddress) {
      await checkClipboard()
      resetSendTransaction()
    }
  })

  // ---------------------------------------------------------------------------
  // Side-Effects
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    const cleanup = AppState.addEventListener('change', appState => {
      if (appState === 'active') checkClipboard().catch(err => showError(err))
    })
    checkClipboard().catch(err => showError(err))

    return () => cleanup.remove()
  }, [checkClipboard])

  useMount(() => {
    if (isCameraOpen) handleScan()
  })

  React.useImperativeHandle(ref, () => ({
    async onChangeAddress(address: string) {
      await changeAddress(address)
    }
  }))

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  const copyMessage = clipboard !== '' ? `${lstrings.string_paste}: ${clipboard}` : null
  const tileType = loading ? 'loading' : !!recipientAddress && !lockInputs ? 'delete' : 'static'

  return (
    <View>
      <Tile type={tileType} title={title} onPress={handleTilePress}>
        {!recipientAddress && (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.buttonContainer} onPress={handleChangeAddress}>
              <FontAwesome name="edit" size={theme.rem(2)} color={theme.iconTappable} />
              <EdgeText style={styles.buttonText}>{lstrings.enter_as_in_enter_address_with_keyboard}</EdgeText>
            </TouchableOpacity>
            {canSelfTransfer ? (
              <TouchableOpacity style={styles.buttonContainer} onPress={handleSelfTransfer}>
                <AntDesign name="wallet" size={theme.rem(2)} color={theme.iconTappable} />
                <EdgeText style={styles.buttonText}>{lstrings.fragment_send_myself}</EdgeText>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.buttonContainer} onPress={handleScan}>
              <FontAwesome5 name="expand" size={theme.rem(2)} color={theme.iconTappable} />
              <EdgeText style={styles.buttonText}>{lstrings.scan_as_in_scan_barcode}</EdgeText>
            </TouchableOpacity>
            {copyMessage ? (
              <TouchableOpacity style={styles.buttonContainer} onPress={handlePasteFromClipboard}>
                <FontAwesome5 name="clipboard" size={theme.rem(2)} color={theme.iconTappable} />
                <EdgeText style={styles.buttonText}>{lstrings.string_paste}</EdgeText>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
        {recipientAddress == null || recipientAddress === '' ? null : (
          <>
            {fioToAddress == null ? null : <EdgeText>{fioToAddress + '\n'}</EdgeText>}
            <EdgeText numberOfLines={3} disableFontScaling>
              {recipientAddress}
            </EdgeText>
          </>
        )}
      </Tile>
    </View>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  buttonsContainer: {
    paddingTop: theme.rem(1),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center'
  },
  buttonText: {
    fontSize: theme.rem(0.75),
    color: theme.textLink
  }
}))
