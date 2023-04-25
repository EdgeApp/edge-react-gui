import { abs, add, div, gt, mul } from 'biggystring'
import { asArray, asEither, asNumber, asObject, asOptional, asString, asTuple, asValue } from 'cleaners'
import { EdgeCurrencyWallet, EdgeSpendInfo } from 'edge-core-js'
import * as React from 'react'
import { Image, ScrollView, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import WalletConnectLogo from '../../assets/images/walletconnect-logo.png'
import { FlashNotification } from '../../components/navigation/FlashNotification'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { lstrings } from '../../locales/strings'
import { getCurrencyIconUris } from '../../util/CdnUris'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { zeroString } from '../../util/utils'
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

interface Props extends WcSmartContractModalProps {
  bridge: AirshipBridge<void>
  wallet: EdgeCurrencyWallet
}

export const WcSmartContractModal = (props: Props) => {
  const { bridge, dApp, nativeAmount, networkFee, payload, tokenId, uri, wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dAppName = dApp.peerMeta.name
  const icon = dApp.peerMeta.icons[0]

  const walletName = getWalletName(wallet)

  const amountCurrencyCode = getCurrencyCode(wallet, tokenId)

  const { currencyCode: feeCurrencyCode, displayName: feeDisplayName, pluginId, metaTokens } = wallet.currencyInfo

  const feeCurrencyStr = `${feeDisplayName} (${feeCurrencyCode})`
  const feeCurrencyBalance = wallet.balances[feeCurrencyCode]

  const amountDenom = useDisplayDenom(pluginId, amountCurrencyCode)
  const feeDenom = useDisplayDenom(pluginId, feeCurrencyCode)

  // For total amount, convert 'amount' currency to 'fee' currency so it be totaled as a single crypto amount to pass to FiatAmountTile component
  const amountCurrencyToFeeCurrencyExchangeRate = div(amountDenom.multiplier, feeDenom.multiplier)
  const amountCryptoAsFeeCrypto = mul(amountCurrencyToFeeCurrencyExchangeRate, networkFee)
  const totalNativeCrypto = mul(add(nativeAmount, amountCryptoAsFeeCrypto), '-1')

  const isInsufficientBal = amountCurrencyCode === feeCurrencyCode ? gt(abs(totalNativeCrypto), feeCurrencyBalance) : gt(networkFee, feeCurrencyBalance)

  const handleSubmit = () => {
    wcRequestResponse(wallet, uri, true, payload)
      .then(() => {
        Airship.show(bridge => <FlashNotification bridge={bridge} message={lstrings.wc_smartcontract_confirmed} />).catch(() => {})
      })
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

  return (
    <ThemedModal bridge={bridge} onCancel={handleClose} paddingRem={[1, 0]}>
      <View style={styles.title}>
        <Image style={styles.logo} source={WalletConnectLogo} />
        <ModalTitle>{lstrings.wc_smartcontract_title}</ModalTitle>
      </View>
      <ScrollView>
        {renderWarning()}
        {zeroString(nativeAmount) ? null : (
          <CryptoFiatAmountTile
            title={lstrings.string_amount}
            nativeCryptoAmount={nativeAmount}
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
        {zeroString(networkFee) ? null : (
          <CryptoFiatAmountTile title={lstrings.wc_smartcontract_network_fee} nativeCryptoAmount={networkFee} denomination={feeDenom} walletId={wallet.id} />
        )}
        {zeroString(totalNativeCrypto) ? null : (
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

async function wcRequestResponse(wallet: EdgeCurrencyWallet, uri: string, approve: boolean, payload: Payload): Promise<void> {
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
        const cleanPayload = asEvmWcRpcPayload(payload)
        const typedData = cleanPayload.method === 'eth_signTypedData' || cleanPayload.method === 'eth_signTypedData_v4'
        const result = await wallet.signMessage(cleanPayload.params[1], { otherParams: { typedData } })
        await wallet.otherMethods.wcApproveRequest(uri, cleanPayload, result)
        break
      }
      case 'eth_signTransaction': {
        const cleanPayload = asEvmWcRpcPayload(payload)
        const spendInfo: EdgeSpendInfo = await wallet.otherMethods.txRpcParamsToSpendInfo(cleanPayload.params[0])
        const tx = await wallet.makeSpend(spendInfo)
        const signTx = await wallet.signTx(tx)
        await wallet.otherMethods.wcApproveRequest(uri, cleanPayload, signTx.signedTx)
        break
      }
      case 'eth_sendTransaction':
      case 'eth_sendRawTransaction': {
        const cleanPayload = asEvmWcRpcPayload(payload)
        const spendInfo: EdgeSpendInfo = await wallet.otherMethods.txRpcParamsToSpendInfo(cleanPayload.params[0])
        const tx = await wallet.makeSpend(spendInfo)
        const signedTx = await wallet.signTx(tx)
        const sentTx = await wallet.broadcastTx(signedTx)
        await wallet.otherMethods.wcApproveRequest(uri, cleanPayload, sentTx.txid)
        break
      }
      case 'algo_signTxn': {
        const cleanPayload = asAlgoWcRpcPayload(payload)
        const tx = cleanPayload.params[0][0].txn
        const signedTx = await wallet.signMessage(tx)
        await wallet.otherMethods.wcApproveRequest(uri, cleanPayload, signedTx)
        break
      }
    }
  } catch (e: any) {
    await wallet.otherMethods.wcRejectRequest(uri, payload)
    throw e
  }
}

const asEvmPayloadMethod = asValue(
  'personal_sign',
  'eth_sign',
  'eth_signTypedData',
  'eth_signTypedData_v4',
  'eth_sendTransaction',
  'eth_signTransaction',
  'eth_sendRawTransaction'
)
const asEvmWcRpcPayload = asObject({
  id: asEither(asString, asNumber),
  method: asEvmPayloadMethod,
  params: asEither(
    asTuple(
      asObject({
        from: asString,
        to: asOptional(asString),
        data: asString,
        gas: asOptional(asString),
        gasPrice: asOptional(asString),
        value: asString,
        nonce: asOptional(asString)
      }),
      asOptional(asString, '')
    ),
    asArray(asString)
  )
})
const asAlgoPayloadMethod = asValue('algo_signTxn')
const asAlgoWcRpcPayload = asObject({
  id: asEither(asString, asNumber),
  method: asAlgoPayloadMethod,
  params: asTuple(
    asTuple(
      asObject({
        txn: asString,
        message: asOptional(asString)
      })
    )
  )
})

const asPayload = asObject({ method: asEither(asAlgoPayloadMethod, asEvmPayloadMethod) }).withRest
type Payload = ReturnType<typeof asPayload>

export const asWcSmartContractModalProps = asObject({
  dApp: asObject({
    peerMeta: asObject({
      name: asString,
      icons: asArray(asString)
    })
  }),
  nativeAmount: asString,
  networkFee: asString,
  tokenId: asOptional(asString),
  uri: asString,
  payload: asPayload
})
type WcSmartContractModalProps = ReturnType<typeof asWcSmartContractModalProps>
