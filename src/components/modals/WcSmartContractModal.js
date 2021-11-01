// @flow
import { WcRpcPayload } from 'edge-currency-accountbased'
import * as React from 'react'
import { View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.js'
import { useSelector } from '../../types/reactRedux.js'
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
  amountCrypto: number | string,
  bridge: AirshipBridge<string | null>,
  dAppUrl: string,
  networkFeeCrypto: number | string,
  walletCurrencyCode: string,
  // eslint-disable-next-line react/no-unused-prop-types
  walletId: string,
  // eslint-disable-next-line react/no-unused-prop-types
  payload: WcRpcPayload
}

export const WcSmartContractModal = (props: Props) => {
  const { amountCrypto, bridge, dAppUrl, networkFeeCrypto, walletCurrencyCode, walletId } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const { feeCurrencyStr, isInsufficientBal, isoFiatCurrencyCode, walletImageUri, walletName } = useSelector(state => {
    const guiWallet = state.ui.wallets.byId[walletId]
    const { isoFiatCurrencyCode } = guiWallet
    const walletName = guiWallet.name
    const walletImageUri = getCurrencyIcon(guiWallet.currencyCode, walletCurrencyCode).symbolImage
    const isInsufficientBal = -1 * parseFloat(amountCrypto) + parseFloat(networkFeeCrypto) > parseFloat(guiWallet.primaryNativeBalance)
    const feeCurrencyStr = `${guiWallet.currencyNames[walletCurrencyCode]} (${walletCurrencyCode})`

    return {
      feeCurrencyStr,
      isInsufficientBal,
      isoFiatCurrencyCode,
      walletImageUri,
      walletName
    }
  })

  const handleSubmit = () => {
    // TODO: call ethEngine method
    props.bridge.resolve(null)
  }

  const handleClose = () => {
    // TODO: call ethEngine method
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
  return (
    <ThemedModal bridge={bridge} onCancel={handleClose} paddingRem={0}>
      <ModalTitle paddingRem={0.5}>
        <AntDesignIcon name="infocirlceo" size={theme.rem(1.5)} color={theme.icon} />
        {s.strings.wc_smartcontract_title}
      </ModalTitle>
      <View style={modalHeight}>
        {renderWarning()}
        <CryptoFiatAmountTile
          title={s.strings.string_amount}
          cryptoAmount={amountCrypto}
          cryptoCurrencyCode={walletCurrencyCode}
          isoFiatCurrencyCode={isoFiatCurrencyCode}
        />
        <IconTile title={s.strings.wc_smartcontract_wallet} iconUri={walletImageUri}>
          <EdgeText>{walletName}</EdgeText>
        </IconTile>
        <IconTile title={s.strings.wc_smartcontract_dapp} iconUri={getCurrencyIcon('ETH', 'AAVE').symbolImage}>
          <EdgeText>{dAppUrl}</EdgeText>
        </IconTile>
        <CryptoFiatAmountTile
          title={s.strings.wc_smartcontract_network_fee}
          cryptoAmount={networkFeeCrypto}
          cryptoCurrencyCode={walletCurrencyCode}
          isoFiatCurrencyCode={isoFiatCurrencyCode}
        />
        <FiatAmountTile
          title={s.strings.wc_smartcontract_max_total}
          cryptoAmount={-1 * parseFloat(amountCrypto) + parseFloat(networkFeeCrypto) /* normalize positive fee vs negative amount */}
          cryptoCurrencyCode={walletCurrencyCode}
          isoFiatCurrencyCode={isoFiatCurrencyCode}
        />
        {slider}
      </View>
      <ModalCloseArrow onPress={handleClose} />
    </ThemedModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  containerFull: {
    flex: 1,
    width: '100%',
    flexDirection: 'column'
  },
  containerPartial: {
    flex: 0.9,
    width: '100%',
    flexDirection: 'column'
  },
  slider: {
    paddingVertical: theme.rem(2)
  }
}))
