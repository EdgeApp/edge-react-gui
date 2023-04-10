import { abs, add, div, gt, mul } from 'biggystring'
import { EdgeCurrencyWallet, EdgeSpendInfo, JsonObject } from 'edge-core-js'
import * as React from 'react'
import { Image, ScrollView, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import WalletConnectLogo from '../../assets/images/walletconnect-logo.png'
import { FlashNotification } from '../../components/navigation/FlashNotification'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { lstrings } from '../../locales/strings'
import { getCurrencyIconUris } from '../../util/CdnUris'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { hexToDecimal, isHex, removeHexPrefix, zeroString } from '../../util/utils'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { Alert } from '../themed/Alert'
import { EdgeText } from '../themed/EdgeText'
import { ModalFooter, ModalTitle } from '../themed/ModalParts'
import { SafeSlider } from '../themed/SafeSlider'
import { ThemedModal } from '../themed/ThemedModal'
import { CryptoFiatAmountTile } from '../tiles/CryptoFiatAmountTile'
import { FiatAmountTile } from '../tiles/FiatAmountTile'
import { IconTile } from '../tiles/IconTile'

interface WcRpcPayload {
  id: string | number
  method: 'personal_sign' | 'eth_sign' | 'eth_signTypedData' | 'eth_signTypedData_v4' | 'eth_sendTransaction' | 'eth_signTransaction' | 'eth_sendRawTransaction'
  params: any[]
}

interface Props {
  bridge: AirshipBridge<void>
  wallet: EdgeCurrencyWallet
  dApp: JsonObject
  uri: string
  payload: WcRpcPayload
}

export const WcSmartContractModal = (props: Props) => {
  const { bridge, wallet, dApp, payload, uri } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dAppName: string = dApp.peerMeta.name
  const icon: string = dApp.peerMeta.icons[0]
  const params = payload.params[0]
  const toAddress: string | null = params.to

  const walletName = getWalletName(wallet)

  let amountCurrencyCode = wallet.currencyInfo.currencyCode
  if (toAddress != null) {
    const metaTokens = wallet.currencyInfo.metaTokens
    const token = metaTokens.find(token => token.contractAddress != null && token.contractAddress.toLowerCase() === toAddress.toLowerCase())
    if (token != null) amountCurrencyCode = token.currencyCode
  }
  const { currencyCode: feeCurrencyCode, displayName: feeDisplayName, pluginId, metaTokens } = wallet.currencyInfo

  const feeCurrencyStr = `${feeDisplayName} (${feeCurrencyCode})`
  const feeCurrencyBalance = wallet.balances[feeCurrencyCode]

  let amountCrypto = '0'
  let networkFeeCrypto = '0'
  if (isHex(removeHexPrefix(params?.value ?? ''))) {
    amountCrypto = hexToDecimal(params.value)
  }
  if (isHex(removeHexPrefix(params?.gas ?? '')) && isHex(removeHexPrefix(params?.gasPrice ?? ''))) {
    networkFeeCrypto = hexToDecimal(removeHexPrefix(mul(params.gas, params.gasPrice, 16)))
  }

  const amountDenom = useDisplayDenom(pluginId, amountCurrencyCode)
  const feeDenom = useDisplayDenom(pluginId, feeCurrencyCode)

  // For total amount, convert 'amount' currency to 'fee' currency so it be totaled as a single crypto amount to pass to FiatAmountTile component
  const amountCurrencyToFeeCurrencyExchangeRate = div(amountDenom.multiplier, feeDenom.multiplier)
  const amountCryptoAsFeeCrypto = mul(amountCurrencyToFeeCurrencyExchangeRate, networkFeeCrypto)
  const totalNativeCrypto = mul(add(amountCrypto, amountCryptoAsFeeCrypto), '-1')

  const isInsufficientBal = amountCurrencyCode === feeCurrencyCode ? gt(abs(totalNativeCrypto), feeCurrencyBalance) : gt(networkFeeCrypto, feeCurrencyBalance)

  const handleSubmit = () => {
    wcRequestResponse(wallet, uri, true, payload)
      .then(async () => await Airship.show(bridge => <FlashNotification bridge={bridge} message={lstrings.wc_smartcontract_confirmed} />))
      .catch(showError)
      .finally(props.bridge.resolve)
  }

  const handleClose = () => {
    wcRequestResponse(wallet, uri, false, payload).catch(showError).finally(props.bridge.resolve)
  }

  const renderWarning = () => {
    return isInsufficientBal ? (
      <Alert title={lstrings.wc_smartcontract_warning_title} message={sprintf(lstrings.wc_smartcontract_insufficient_text, feeCurrencyStr)} type="warning" />
    ) : (
      <Alert numberOfLines={0} title={lstrings.wc_smartcontract_warning_title} message={lstrings.wc_smartcontract_warning_text} type="warning" />
    )
  }

  const contractAddress = metaTokens.find(token => token.currencyCode === amountCurrencyCode)?.contractAddress
  const walletImageUri = getCurrencyIconUris(pluginId, contractAddress).symbolImage
  const slider = isInsufficientBal ? null : (
    <SafeSlider parentStyle={styles.slider} onSlidingComplete={handleSubmit} disabledText={lstrings.send_confirmation_slide_to_confirm} disabled={false} />
  )

  // FIXME: HACK!!1! This is a shortcut so we can remove currency code from the fiat text component without completely refactoring this file
  const tokenId = contractAddress != null ? contractAddress.toLowerCase().replace('0x', '') : undefined

  return (
    <ThemedModal bridge={bridge} onCancel={handleClose} paddingRem={[1, 0]}>
      <View style={styles.title}>
        <Image style={styles.logo} source={WalletConnectLogo} />
        <ModalTitle>{lstrings.wc_smartcontract_title}</ModalTitle>
      </View>
      <ScrollView>
        {renderWarning()}
        {!zeroString(amountCrypto) && (
          <CryptoFiatAmountTile
            title={lstrings.string_amount}
            nativeCryptoAmount={amountCrypto}
            denomination={amountDenom}
            walletId={wallet.id}
            tokenId={tokenId}
          />
        )}
        <IconTile title={lstrings.wc_smartcontract_wallet} iconUri={walletImageUri}>
          <EdgeText>{walletName}</EdgeText>
        </IconTile>
        <IconTile title={lstrings.wc_smartcontract_dapp} iconUri={icon}>
          <EdgeText>{dAppName}</EdgeText>
        </IconTile>
        {!zeroString(networkFeeCrypto) && (
          <CryptoFiatAmountTile
            title={lstrings.wc_smartcontract_network_fee}
            nativeCryptoAmount={networkFeeCrypto}
            denomination={feeDenom}
            walletId={wallet.id}
          />
        )}
        {!zeroString(totalNativeCrypto) && (
          <FiatAmountTile title={lstrings.wc_smartcontract_max_total} nativeCryptoAmount={totalNativeCrypto} wallet={wallet} />
        )}
        {slider}
      </ScrollView>
      <ModalFooter onPress={handleClose} />
    </ThemedModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.rem(1)
  },
  logo: {
    height: theme.rem(2),
    width: theme.rem(2),
    resizeMode: 'contain',
    padding: theme.rem(0.5)
  },
  slider: {
    paddingVertical: theme.rem(1)
  }
}))

async function wcRequestResponse(wallet: EdgeCurrencyWallet, uri: string, approve: boolean, payload: WcRpcPayload): Promise<void> {
  if (!approve) {
    await wallet.otherMethods.wcRejectRequest(uri, payload)
    return
  }

  try {
    switch (payload.method) {
      case 'personal_sign':
      case 'eth_sign':
      case 'eth_signTypedData':
      case 'eth_signTypedData_v4': {
        const typedData = payload.method === 'eth_signTypedData' || payload.method === 'eth_signTypedData_v4'
        const result = await wallet.signMessage(payload.params[1], { otherParams: { typedData } })
        await wallet.otherMethods.wcApproveRequest(uri, payload, result)
        break
      }
      case 'eth_signTransaction': {
        const spendInfo: EdgeSpendInfo = await wallet.otherMethods.txRpcParamsToSpendInfo(payload.params[0])
        const tx = await wallet.makeSpend(spendInfo)
        const signTx = await wallet.signTx(tx)
        await wallet.otherMethods.wcApproveRequest(uri, payload, signTx.signedTx)
        break
      }
      case 'eth_sendTransaction':
      case 'eth_sendRawTransaction': {
        const spendInfo: EdgeSpendInfo = await wallet.otherMethods.txRpcParamsToSpendInfo(payload.params[0])
        const tx = await wallet.makeSpend(spendInfo)
        const signedTx = await wallet.signTx(tx)
        const sentTx = await wallet.broadcastTx(signedTx)
        await wallet.otherMethods.wcApproveRequest(uri, payload, sentTx.txid)
        break
      }
    }
  } catch (e: any) {
    await wallet.otherMethods.wcRejectRequest(uri, payload)
    throw e
  }
}
