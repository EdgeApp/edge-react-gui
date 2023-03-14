import { abs, add, div, gt, mul } from 'biggystring'
import { JsonObject } from 'edge-core-js/types'
import * as React from 'react'
import { Image, ScrollView, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import WalletConnectLogo from '../../assets/images/walletconnect-logo.png'
import { FlashNotification } from '../../components/navigation/FlashNotification'
import s from '../../locales/strings'
import { getDenominationFromCurrencyInfo } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
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
  method: 'personal_sign' | 'eth_sign' | 'eth_signTypedData' | 'eth_sendTransaction' | 'eth_signTransaction' | 'eth_sendRawTransaction'
  params: any[]
}

interface Props {
  bridge: AirshipBridge<void>
  walletId: string
  dApp: JsonObject
  uri: string
  payload: WcRpcPayload
}

export const WcSmartContractModal = (props: Props) => {
  const { bridge, walletId, dApp, payload, uri } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dAppName: string = dApp.peerMeta.name
  const icon: string = dApp.peerMeta.icons[0]
  const params = payload.params[0]
  const toAddress: string | null = params.to

  const currencyWallets = useSelector(state => state.core.account.currencyWallets)
  const wallet = currencyWallets[walletId]

  if (wallet == null) return null
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

  const amountDenom = getDenominationFromCurrencyInfo(wallet.currencyInfo, amountCurrencyCode)
  const feeDenom = getDenominationFromCurrencyInfo(wallet.currencyInfo, feeCurrencyCode)

  // For total amount, convert 'amount' currency to 'fee' currency so it be totaled as a single crypto amount to pass to FiatAmountTile component
  const amountCurrencyToFeeCurrencyExchangeRate = div(amountDenom.multiplier, feeDenom.multiplier)
  const amountCryptoAsFeeCrypto = mul(amountCurrencyToFeeCurrencyExchangeRate, networkFeeCrypto)
  const totalNativeCrypto = mul(add(amountCrypto, amountCryptoAsFeeCrypto), '-1')

  const isInsufficientBal = amountCurrencyCode === feeCurrencyCode ? gt(abs(totalNativeCrypto), feeCurrencyBalance) : gt(networkFeeCrypto, feeCurrencyBalance)

  // @ts-expect-error
  const handleSubmit = reset =>
    wallet.otherMethods
      .wcRequestResponse(uri, true, payload)
      .then(Airship.show(bridge => <FlashNotification bridge={bridge} message={s.strings.wc_smartcontract_confirmed} onPress={() => {}} />))
      .catch(showError)
      .finally(props.bridge.resolve)

  const handleClose = async () => {
    props.bridge.resolve()
    await wallet.otherMethods.wcRequestResponse(uri, false, payload)
  }

  const renderWarning = () => {
    return isInsufficientBal ? (
      <Alert
        // @ts-expect-error
        marginTop={0.5}
        title={s.strings.wc_smartcontract_warning_title}
        message={sprintf(s.strings.wc_smartcontract_insufficient_text, feeCurrencyStr)}
        type="warning"
      />
    ) : (
      <Alert
        numberOfLines={0}
        // @ts-expect-error
        marginTop={0.5}
        title={s.strings.wc_smartcontract_warning_title}
        message={s.strings.wc_smartcontract_warning_text}
        type="warning"
      />
    )
  }

  const contractAddress = metaTokens.find(token => token.currencyCode === amountCurrencyCode)?.contractAddress
  const walletImageUri = getCurrencyIconUris(pluginId, contractAddress).symbolImage
  const slider = isInsufficientBal ? null : (
    <SafeSlider parentStyle={styles.slider} onSlidingComplete={handleSubmit} disabledText={s.strings.send_confirmation_slide_to_confirm} disabled={false} />
  )

  // FIXME: HACK!!1! This is a shortcut so we can remove currency code from the fiat text component without completely refactoring this file
  const tokenId = contractAddress != null ? contractAddress.toLowerCase().replace('0x', '') : undefined

  return (
    <ThemedModal
      bridge={bridge}
      onCancel={() => {
        handleClose().catch(showError)
      }}
      paddingRem={[1, 0]}
    >
      <View style={styles.title}>
        <Image style={styles.logo} source={WalletConnectLogo} />
        <ModalTitle>{s.strings.wc_smartcontract_title}</ModalTitle>
      </View>
      <ScrollView>
        {renderWarning()}
        {!zeroString(amountCrypto) && (
          <CryptoFiatAmountTile
            title={s.strings.string_amount}
            nativeCryptoAmount={amountCrypto}
            denomination={amountDenom}
            walletId={walletId}
            tokenId={tokenId}
          />
        )}
        <IconTile title={s.strings.wc_smartcontract_wallet} iconUri={walletImageUri}>
          <EdgeText>{walletName}</EdgeText>
        </IconTile>
        <IconTile title={s.strings.wc_smartcontract_dapp} iconUri={icon}>
          <EdgeText>{dAppName}</EdgeText>
        </IconTile>
        {!zeroString(networkFeeCrypto) && (
          <CryptoFiatAmountTile
            title={s.strings.wc_smartcontract_network_fee}
            nativeCryptoAmount={networkFeeCrypto}
            denomination={feeDenom}
            walletId={walletId}
          />
        )}
        {!zeroString(totalNativeCrypto) && (
          <FiatAmountTile title={s.strings.wc_smartcontract_max_total} nativeCryptoAmount={totalNativeCrypto} wallet={wallet} />
        )}
        {slider}
      </ScrollView>
      <ModalFooter
        onPress={() => {
          handleClose().catch(showError)
        }}
      />
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
