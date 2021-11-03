// @flow
import { bns } from 'biggystring'
import { WcRpcPayload } from 'edge-currency-accountbased'
import * as React from 'react'
import { View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.js'
import { useSelector } from '../../types/reactRedux.js'
import { hexToDecimal, isHex, removeHexPrefix } from '../../util/utils.js'
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
  dApp: Object,
  uri: string,
  payload: WcRpcPayload
}

export const WcSmartContractModal = (props: Props) => {
  const { bridge, walletId, dApp, payload, uri } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dAppName: string = dApp.peerMeta.name ?? 'no name'

  let amountCrypto
  let networkFeeCrypto
  const params = payload.params[0]
  if (typeof payload === 'object') {
    if (isHex(removeHexPrefix(params?.value ?? ''))) {
      amountCrypto = hexToDecimal(params.value)
    }
    if (isHex(removeHexPrefix(params?.gas ?? '')) && isHex(removeHexPrefix(params?.gasPrice ?? ''))) {
      networkFeeCrypto = bns.mul(hexToDecimal(params.gas), hexToDecimal(params.gasPrice))
    }
  }
  const totalCrypto = bns.mul(bns.add(amountCrypto ?? '0', networkFeeCrypto ?? '0'), '-1')

  const { feeCurrencyStr, isInsufficientBal, isoFiatCurrencyCode, walletImageUri, currencyCode, walletName, wallet } = useSelector(state => {
    const { currencyWallets } = state.core.account
    const wallet = currencyWallets[walletId]
    const guiWallet = state.ui.wallets.byId[walletId]
    const currencyCode = guiWallet.currencyCode
    const { isoFiatCurrencyCode } = guiWallet
    const walletName = guiWallet.name
    const walletImageUri = getCurrencyIcon(guiWallet.currencyCode, currencyCode).symbolImage
    const isInsufficientBal = -1 * parseFloat(amountCrypto) + parseFloat(networkFeeCrypto) > parseFloat(guiWallet.primaryNativeBalance)
    const feeCurrencyStr = `${guiWallet.currencyNames[currencyCode]} (${currencyCode})`

    return {
      currencyCode,
      feeCurrencyStr,
      isInsufficientBal,
      isoFiatCurrencyCode,
      walletImageUri,
      walletName,
      wallet
    }
  })

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

  const modalHeight = isInsufficientBal ? styles.containerPartial : styles.containerFull
  const slider = isInsufficientBal ? null : (
    <Slider parentStyle={styles.slider} onSlidingComplete={handleSubmit} disabledText={s.strings.send_confirmation_slide_to_confirm} />
  )
  const maxTotalAmount = -1 * parseFloat(amountCrypto) + parseFloat(networkFeeCrypto) /* normalize positive fee vs negative amount */
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
        {amountCrypto != null && (
          <CryptoFiatAmountTile
            title={s.strings.string_amount}
            cryptoAmount={amountCrypto}
            cryptoCurrencyCode={currencyCode}
            isoFiatCurrencyCode={isoFiatCurrencyCode}
          />
        )}
        <IconTile title={s.strings.wc_smartcontract_wallet} iconUri={walletImageUri}>
          <EdgeText>{walletName}</EdgeText>
        </IconTile>
        <IconTile title={s.strings.wc_smartcontract_dapp} iconUri={getCurrencyIcon('ETH', 'AAVE').symbolImage}>
          <EdgeText>{dAppName}</EdgeText>
        </IconTile>
        {networkFeeCrypto != null && (
          <CryptoFiatAmountTile
            title={s.strings.wc_smartcontract_network_fee}
            cryptoAmount={networkFeeCrypto}
            cryptoCurrencyCode={currencyCode}
            isoFiatCurrencyCode={isoFiatCurrencyCode}
          />
        )}
        {totalCrypto !== '0' && (
          <FiatAmountTile
            title={s.strings.wc_smartcontract_max_total}
            cryptoAmount={maxTotalAmount}
            cryptoCurrencyCode={currencyCode}
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
