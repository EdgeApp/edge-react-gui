// @flow
import { bns } from 'biggystring'
import { type JsonObject } from 'edge-core-js/types'
import { WcRpcPayload } from 'edge-currency-accountbased'
import * as React from 'react'
import { View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.js'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { useSelector } from '../../types/reactRedux.js'
import { DECIMAL_PRECISION, hexToDecimal, isHex, removeHexPrefix, zeroString } from '../../util/utils.js'
import { showError } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import Alert from '../themed/Alert'
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

  const {
    amountNativeToExchangeRatio,
    amountMultiplier,
    amountCurrencyCode,
    feeNativeToExchangeRatio,
    feeMultiplier,
    feeCurrencyCode,
    feeCurrencyStr,
    isInsufficientBal,
    isoFiatCurrencyCode,
    walletName,
    wallet
  } = useSelector(state => {
    const { currencyWallets } = state.core.account
    const wallet = currencyWallets[walletId]
    const walletName = wallet.name

    let amountCurrencyCode = wallet.currencyInfo.currencyCode
    if (toAddress != null) {
      const metaTokens = wallet.currencyInfo.metaTokens
      const token = metaTokens.find(token => token.contractAddress != null && token.contractAddress.toLowerCase() === toAddress.toLowerCase())
      if (token != null) amountCurrencyCode = token.currencyCode
    }
    const feeCurrencyCode = wallet.currencyInfo.currencyCode

    const guiWallet = state.ui.wallets.byId[walletId]
    const { isoFiatCurrencyCode } = guiWallet

    const amountNativeToExchangeRatio = getExchangeDenomination(state, amountCurrencyCode).multiplier
    const feeNativeToExchangeRatio = getExchangeDenomination(state, feeCurrencyCode).multiplier
    const amountMultiplier = getDisplayDenomination(state, amountCurrencyCode).multiplier
    const feeMultiplier = getDisplayDenomination(state, feeCurrencyCode).multiplier

    const feeCurrencyStr = `${guiWallet.currencyNames[feeCurrencyCode]} (${feeCurrencyCode})`
    const isInsufficientBal = -1 * parseFloat(amountCrypto) + parseFloat(networkFeeCrypto) > parseFloat(guiWallet.primaryNativeBalance)

    return {
      amountNativeToExchangeRatio,
      amountMultiplier,
      amountCurrencyCode,
      feeNativeToExchangeRatio,
      feeMultiplier,
      feeCurrencyCode,
      feeCurrencyStr,
      isInsufficientBal,
      isoFiatCurrencyCode,
      walletName,
      wallet
    }
  })

  let amountCrypto = '0'
  let networkFeeCrypto = '0'
  if (isHex(removeHexPrefix(params?.value ?? ''))) {
    amountCrypto = hexToDecimal(params.value)
  }
  if (isHex(removeHexPrefix(params?.gas ?? ''))) {
    networkFeeCrypto = bns.mul(hexToDecimal(params.gas), hexToDecimal(params.gasPrice ?? '0x3B9ACA00'))
  }

  const displayAmount = bns.div(amountCrypto, amountMultiplier, DECIMAL_PRECISION)
  const displayFee = bns.div(networkFeeCrypto, feeMultiplier, DECIMAL_PRECISION)

  // For total amount, convert 'amount' currency to 'fee' currency so it be totaled as a single crypto amount to pass to FiatAmountTile component
  const amountCurrencyToFeeCurrencyExchangeRate = bns.div(amountNativeToExchangeRatio, feeNativeToExchangeRatio)
  const amountCryptoAsFeeCrypto = bns.mul(amountCurrencyToFeeCurrencyExchangeRate, networkFeeCrypto)
  const totalNativeCrypto = bns.mul(bns.add(amountCrypto, amountCryptoAsFeeCrypto), '-1')
  const totalCrypto = bns.div(totalNativeCrypto, amountMultiplier, DECIMAL_PRECISION)

  const handleSubmit = async () => {
    try {
      await wallet.otherMethods.wcRequestResponse(uri, true, payload)
    } catch (e) {
      showError(e.message)
    }

    props.bridge.resolve(null)
  }

  const handleClose = async () => {
    try {
      await wallet.otherMethods.wcRequestResponse(uri, false, payload)
    } catch (e) {
      showError(e.message)
    }
    props.bridge.resolve(null)
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

  const walletImageUri = getCurrencyIcon(feeCurrencyCode, amountCurrencyCode).symbolImage
  const modalHeight = isInsufficientBal ? styles.containerPartial : styles.containerFull
  const slider = isInsufficientBal ? null : (
    <Slider parentStyle={styles.slider} onSlidingComplete={handleSubmit} disabledText={s.strings.send_confirmation_slide_to_confirm} />
  )

  return (
    <ThemedModal
      bridge={bridge}
      onCancel={() => {
        handleClose()
      }}
      paddingRem={[0, 0]}
    >
      <ModalTitle paddingRem={0.5}>
        <AntDesignIcon name="infocirlceo" size={theme.rem(1.5)} color={theme.icon} />
        {s.strings.wc_smartcontract_title}
      </ModalTitle>
      <View style={modalHeight}>
        {renderWarning()}
        {!zeroString(displayAmount) && (
          <CryptoFiatAmountTile
            title={s.strings.string_amount}
            cryptoAmount={displayAmount}
            cryptoCurrencyCode={amountCurrencyCode}
            isoFiatCurrencyCode={isoFiatCurrencyCode}
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
        {!zeroString(displayFee) && (
          <CryptoFiatAmountTile
            title={s.strings.wc_smartcontract_network_fee}
            cryptoAmount={displayFee}
            cryptoCurrencyCode={feeCurrencyCode}
            isoFiatCurrencyCode={isoFiatCurrencyCode}
          />
        )}
        {!zeroString(totalCrypto) && (
          <FiatAmountTile
            title={s.strings.wc_smartcontract_max_total}
            cryptoAmount={totalCrypto}
            cryptoCurrencyCode={feeCurrencyCode}
            isoFiatCurrencyCode={isoFiatCurrencyCode}
          />
        )}
        {slider}
      </View>
      <ModalCloseArrow
        paddingVertical={theme.rem(0)}
        onPress={() => {
          handleClose()
        }}
      />
    </ThemedModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  containerFull: {
    width: '100%',
    flexDirection: 'column'
  },
  containerPartial: {
    width: '100%',
    flexDirection: 'column'
  },
  slider: {
    paddingVertical: theme.rem(1)
  }
}))
