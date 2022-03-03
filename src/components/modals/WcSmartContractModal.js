// @flow
import { abs, add, div, gt, mul } from 'biggystring'
import { type JsonObject } from 'edge-core-js/types'
import { WcRpcPayload } from 'edge-currency-accountbased'
import * as React from 'react'
import { Image, ScrollView, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import WalletConnectLogo from '../../assets/images/walletconnect-logo.png'
import { FlashNotification } from '../../components/navigation/FlashNotification.js'
import s from '../../locales/strings.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.js'
import { getDenominationFromCurrencyInfo } from '../../selectors/DenominationSelectors.js'
import { useSelector } from '../../types/reactRedux.js'
import { hexToDecimal, isHex, removeHexPrefix, zeroString } from '../../util/utils.js'
import { Airship, showError } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { Alert } from '../themed/Alert'
import { CryptoFiatAmountTile } from '../themed/CryptoFiatAmountTile.js'
import { EdgeText } from '../themed/EdgeText'
import { FiatAmountTile } from '../themed/FiatAmountTile.js'
import { IconTile } from '../themed/IconTile'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'
import { getCurrencyIcon } from './../../util/CurrencyInfoHelpers'

type Props = {
  bridge: AirshipBridge<string | null>,
  // eslint-disable-next-line react/no-unused-prop-types
  walletId: string,
  // eslint-disable-next-line react/no-unused-prop-types
  dApp: JsonObject,
  uri: string,
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
  const guiWallet = useSelector(state => state.ui.wallets.byId[walletId])

  if (wallet == null) return null
  const walletName = wallet.name

  let amountCurrencyCode = wallet.currencyInfo.currencyCode
  if (toAddress != null) {
    const metaTokens = wallet.currencyInfo.metaTokens
    const token = metaTokens.find(token => token.contractAddress != null && token.contractAddress.toLowerCase() === toAddress.toLowerCase())
    if (token != null) amountCurrencyCode = token.currencyCode
  }
  const { currencyCode: feeCurrencyCode, pluginId, metaTokens } = wallet.currencyInfo

  const { isoFiatCurrencyCode } = guiWallet

  const feeCurrencyStr = `${guiWallet.currencyNames[feeCurrencyCode]} (${feeCurrencyCode})`
  const feeCurrencyBalance = guiWallet.primaryNativeBalance

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

  const handleSubmit = async () => {
    try {
      await wallet.otherMethods.wcRequestResponse(uri, true, payload)
      Airship.show(bridge => <FlashNotification bridge={bridge} message={s.strings.wc_smartcontract_confirmed} onPress={() => {}} />)
    } catch (e) {
      showError(e)
    }
    props.bridge.resolve(null)
  }

  const handleClose = async () => {
    props.bridge.resolve(null)
    await wallet.otherMethods.wcRequestResponse(uri, false, payload)
  }

  const renderWarning = () => {
    return isInsufficientBal ? (
      <Alert
        marginTop={0.5}
        title={s.strings.wc_smartcontract_warning_title}
        message={sprintf(s.strings.wc_smartcontract_insufficient_text, feeCurrencyStr)}
        type="warning"
      />
    ) : (
      <Alert marginTop={0.5} title={s.strings.wc_smartcontract_warning_title} message={s.strings.wc_smartcontract_warning_text} type="warning" />
    )
  }

  const contractAddress = metaTokens.find(token => token.currencyCode === amountCurrencyCode)?.contractAddress
  const walletImageUri = getCurrencyIcon(pluginId, contractAddress).symbolImage
  const slider = isInsufficientBal ? null : (
    <Slider parentStyle={styles.slider} onSlidingComplete={handleSubmit} disabledText={s.strings.send_confirmation_slide_to_confirm} />
  )

  return (
    <ThemedModal
      bridge={bridge}
      onCancel={() => {
        handleClose().catch(showError)
      }}
      paddingRem={[1, 0]}
    >
      <View style={styles.title} paddingRem={[0, 0, 0, 1]}>
        <Image style={styles.logo} source={WalletConnectLogo} />
        <ModalTitle>{s.strings.wc_smartcontract_title}</ModalTitle>
      </View>
      <ScrollView>
        {renderWarning()}
        {!zeroString(amountCrypto) && (
          <CryptoFiatAmountTile
            title={s.strings.string_amount}
            nativeCryptoAmount={amountCrypto}
            cryptoCurrencyCode={amountCurrencyCode}
            isoFiatCurrencyCode={isoFiatCurrencyCode}
            denomination={amountDenom}
          />
        )}
        {walletName != null && (
          <IconTile title={s.strings.wc_smartcontract_wallet} iconUri={walletImageUri}>
            <EdgeText>{walletName}</EdgeText>
          </IconTile>
        )}
        <IconTile title={s.strings.wc_smartcontract_dapp} iconUri={icon}>
          <EdgeText>{dAppName}</EdgeText>
        </IconTile>
        {!zeroString(networkFeeCrypto) && (
          <CryptoFiatAmountTile
            title={s.strings.wc_smartcontract_network_fee}
            nativeCryptoAmount={networkFeeCrypto}
            cryptoCurrencyCode={feeCurrencyCode}
            isoFiatCurrencyCode={isoFiatCurrencyCode}
            denomination={feeDenom}
          />
        )}
        {!zeroString(totalNativeCrypto) && (
          <FiatAmountTile
            title={s.strings.wc_smartcontract_max_total}
            nativeCryptoAmount={totalNativeCrypto}
            cryptoCurrencyCode={feeCurrencyCode}
            isoFiatCurrencyCode={isoFiatCurrencyCode}
            cryptoExchangeMultiplier={feeDenom.multiplier}
          />
        )}
        {slider}
      </ScrollView>
      <ModalCloseArrow
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
