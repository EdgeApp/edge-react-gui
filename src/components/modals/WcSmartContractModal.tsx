import { abs, add, div, gt, mul } from 'biggystring'
import { asArray, asEither, asNumber, asObject, asOptional, asString, asTuple, asUnknown, asValue } from 'cleaners'
import { EdgeCurrencyWallet, EdgeSpendInfo } from 'edge-core-js'
import * as React from 'react'
import { Image, ScrollView, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import WalletConnectLogo from '../../assets/images/walletconnect-logo.png'
import { FlashNotification } from '../../components/navigation/FlashNotification'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useWalletConnect } from '../../hooks/useWalletConnect'
import { lstrings } from '../../locales/strings'
import { asEdgeTokenId } from '../../types/types'
import { getCurrencyIconUris } from '../../util/CdnUris'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { zeroString } from '../../util/utils'
import { EdgeCard } from '../cards/EdgeCard'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { Alert } from '../themed/Alert'
import { ModalFooter, ModalTitle } from '../themed/ModalParts'
import { SafeSlider } from '../themed/SafeSlider'
import { CryptoFiatAmountTile } from '../tiles/CryptoFiatAmountTile'
import { FiatAmountTile } from '../tiles/FiatAmountTile'
import { EdgeModal } from './EdgeModal'

interface Props extends WcSmartContractModalProps {
  bridge: AirshipBridge<void>
  wallet: EdgeCurrencyWallet
}

export const WcSmartContractModal = (props: Props) => {
  const { bridge, dApp, nativeAmount, networkFee, payload: rawPayload, tokenId, topic, requestId, wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const walletConnect = useWalletConnect()
  const dAppName = dApp.peerMeta.name
  const iconUri = dApp.peerMeta.icons[0]

  const walletName = getWalletName(wallet)

  const amountCurrencyCode = getCurrencyCode(wallet, tokenId)

  const { currencyCode: feeCurrencyCode, displayName: feeDisplayName, pluginId } = wallet.currencyInfo

  const feeCurrencyStr = `${feeDisplayName} (${feeCurrencyCode})`
  const feeCurrencyBalance = wallet.balanceMap.get(null) ?? '0'

  const amountDenom = useDisplayDenom(wallet.currencyConfig, tokenId)
  const feeDenom = useDisplayDenom(wallet.currencyConfig, null)

  // For total amount, convert 'amount' currency to 'fee' currency so it be totaled as a single crypto amount to pass to FiatAmountTile component
  const amountCurrencyToFeeCurrencyExchangeRate = div(amountDenom.multiplier, feeDenom.multiplier)
  const amountCryptoAsFeeCrypto = mul(amountCurrencyToFeeCurrencyExchangeRate, networkFee)
  const totalNativeCrypto = mul(add(nativeAmount, amountCryptoAsFeeCrypto), '-1')

  const isInsufficientBal = amountCurrencyCode === feeCurrencyCode ? gt(abs(totalNativeCrypto), feeCurrencyBalance) : gt(networkFee, feeCurrencyBalance)

  const handleSubmit = () => {
    wcRequestResponse(true)
      .then(() => {
        Airship.show(bridge => <FlashNotification bridge={bridge} message={lstrings.wc_smartcontract_confirmed} />).catch(() => {})
      })
      .catch(error => showError(error))
      .finally(props.bridge.resolve)
  }

  const handleClose = () => {
    wcRequestResponse(false)
      .catch(error => showError(error))
      .finally(props.bridge.resolve)
  }

  const renderWarning = () => {
    return isInsufficientBal ? (
      <Alert title={lstrings.wc_smartcontract_warning_title} message={sprintf(lstrings.wc_smartcontract_insufficient_text, feeCurrencyStr)} type="warning" />
    ) : (
      <Alert numberOfLines={0} title={lstrings.wc_smartcontract_warning_title} message={lstrings.wc_smartcontract_warning_text} type="warning" />
    )
  }

  const wcRequestResponse = async (approve: boolean): Promise<void> => {
    if (!approve) {
      await walletConnect.rejectRequest(topic, requestId)
      return
    }

    const payload = asPayload(rawPayload)
    try {
      switch (payload.method) {
        case 'personal_sign': {
          const cleanPayload = asEvmSignPayload(payload)
          const result = await wallet.signMessage(cleanPayload.params[0])
          await walletConnect.approveRequest(topic, requestId, result)
          break
        }
        case 'eth_sign':
        case 'eth_signTypedData':
        case 'eth_signTypedData_v4': {
          const cleanPayload = asEvmSignPayload(payload)
          const typedData = cleanPayload.method === 'eth_signTypedData' || cleanPayload.method === 'eth_signTypedData_v4'
          const result = await wallet.signMessage(cleanPayload.params[1], { otherParams: { typedData } })
          await walletConnect.approveRequest(topic, requestId, result)
          break
        }
        case 'eth_signTransaction': {
          const cleanPayload = asEvmTransactionPayload(payload)
          const spendInfo: EdgeSpendInfo = await wallet.otherMethods.txRpcParamsToSpendInfo(cleanPayload.params[0])
          const tx = await wallet.makeSpend(spendInfo)
          const signTx = await wallet.signTx(tx)
          await walletConnect.approveRequest(topic, requestId, signTx.signedTx)
          await wallet.saveTx(signTx)
          break
        }
        case 'eth_sendTransaction':
        case 'eth_sendRawTransaction': {
          const cleanPayload = asEvmTransactionPayload(payload)
          const spendInfo: EdgeSpendInfo = await wallet.otherMethods.txRpcParamsToSpendInfo(cleanPayload.params[0])
          const tx = await wallet.makeSpend(spendInfo)
          const signedTx = await wallet.signTx(tx)
          const sentTx = await wallet.broadcastTx(signedTx)
          await walletConnect.approveRequest(topic, requestId, sentTx.txid)
          await wallet.saveTx(sentTx)
          break
        }
        case 'algo_signTxn': {
          const cleanPayload = asAlgoWcRpcPayload(payload)
          const signedTxs = await Promise.all(cleanPayload.params[0].map(async txnObj => await wallet.signMessage(txnObj.txn)))
          await walletConnect.approveRequest(topic, requestId, signedTxs)
          break
        }
        case 'cosmos_getAccounts':
        case 'cosmos_signDirect':
        case 'cosmos_signAmino': {
          const cleanPayload = asEither(asCosmosGetAccountsPayload, asCosmosSignDirectPayload, asCosmosSignAminoPayload)(payload)
          const result = await wallet.signMessage('', { otherParams: cleanPayload })
          await walletConnect.approveRequest(topic, requestId, JSON.parse(result))
        }
      }
    } catch (e: any) {
      await walletConnect.rejectRequest(topic, requestId)
      throw e
    }
  }

  const walletImageUri = getCurrencyIconUris(pluginId, tokenId).symbolImage
  const slider = isInsufficientBal ? null : (
    <SafeSlider parentStyle={styles.slider} onSlidingComplete={handleSubmit} disabledText={lstrings.send_confirmation_slide_to_confirm} disabled={false} />
  )

  return (
    <EdgeModal
      bridge={bridge}
      onCancel={handleClose}
      title={
        <View style={styles.title}>
          <Image style={styles.logo} source={WalletConnectLogo} />
          <ModalTitle>{lstrings.wc_smartcontract_title}</ModalTitle>
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.scrollPadding} scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}>
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
        <EdgeCard icon={walletImageUri}>
          <EdgeRow title={lstrings.wc_smartcontract_wallet} body={walletName} />
        </EdgeCard>
        <EdgeCard icon={iconUri}>
          <EdgeRow title={lstrings.wc_smartcontract_dapp} body={dAppName} />
        </EdgeCard>
        {zeroString(networkFee) ? null : (
          <CryptoFiatAmountTile
            title={lstrings.wc_smartcontract_network_fee}
            nativeCryptoAmount={networkFee}
            denomination={feeDenom}
            tokenId={null}
            walletId={wallet.id}
          />
        )}
        {zeroString(totalNativeCrypto) ? null : (
          <FiatAmountTile title={lstrings.wc_smartcontract_max_total} nativeCryptoAmount={totalNativeCrypto} tokenId={null} wallet={wallet} />
        )}
        {slider}
      </ScrollView>
      {/* <ModalFooterFade /> */}
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
  },
  slider: {
    paddingVertical: theme.rem(1)
  }
}))

// [message, account, password]: personal_sign (password not supported yet)
// [address, message]: eth_sign, eth_signTypedData, eth_signTypedData_v4

const asEvmSignMethod = asValue('personal_sign', 'eth_sign', 'eth_signTypedData', 'eth_signTypedData_v4')
const asEvmSignPayload = asObject({
  method: asEvmSignMethod,
  params: asTuple(asString, asString)
})

const asEvmTransactionMethod = asValue('eth_sendTransaction', 'eth_signTransaction', 'eth_sendRawTransaction')
const asEvmTransactionPayload = asObject({
  method: asEvmTransactionMethod,
  params: asTuple(
    asObject({
      from: asString,
      to: asOptional(asString),
      data: asString,
      gas: asOptional(asString),
      gasPrice: asOptional(asString),
      value: asOptional(asString),
      nonce: asOptional(asString)
    }),
    asOptional(asString, '')
  )
})
const asAlgoPayloadMethod = asValue('algo_signTxn')
const asAlgoWcRpcPayload = asObject({
  method: asAlgoPayloadMethod,
  params: asTuple(
    asArray(
      asObject({
        txn: asString,
        message: asOptional(asString)
      })
    )
  )
})

const asCosmosPayloadMethod = asValue('cosmos_getAccounts', 'cosmos_signDirect', 'cosmos_signAmino')
const asCosmosGetAccountsPayload = asObject({
  method: asValue('cosmos_getAccounts'),
  params: asObject({})
})
const asCosmosSignDirectPayload = asObject({
  method: asValue('cosmos_signDirect'),
  params: asObject({
    signerAddress: asString,
    signDoc: asObject({
      chainId: asString,
      accountNumber: asString,
      authInfoBytes: asString,
      bodyBytes: asString
    })
  })
})
const asCosmosSignAminoPayload = asObject({
  method: asValue('cosmos_signAmino'),
  params: asObject({
    signerAddress: asString,
    signDoc: asObject({
      chain_id: asString,
      account_number: asString,
      sequence: asString,
      memo: asString,
      msgs: asArray(asUnknown),
      fee: asObject({
        amount: asArray(asObject({ denom: asString, amount: asString })),
        gas: asString
      })
    })
  })
})

const asPayload = asObject({ method: asEither(asCosmosPayloadMethod, asAlgoPayloadMethod, asEvmSignMethod, asEvmTransactionMethod) }).withRest

export const asWcSmartContractModalProps = asObject({
  dApp: asObject({
    peerMeta: asObject({
      name: asString,
      icons: asArray(asString)
    })
  }),
  nativeAmount: asString,
  networkFee: asString,
  tokenId: asEdgeTokenId,
  topic: asString,
  requestId: asNumber,
  payload: asUnknown
})
type WcSmartContractModalProps = ReturnType<typeof asWcSmartContractModalProps>
