// @flow

import React from 'react'
import { bns } from 'biggystring'

import type { ExchangeRatesState } from '../../../modules/ExchangeRates/reducer'
import type { GuiWallet } from '../../../types/types'
import * as UTILS from '../../../util/utils'
import { convertCurrencyFromExchangeRates } from '../../../modules/UI/selectors'
import { type ThemeProps, withTheme } from '../../services/ThemeContext'
import { Airship } from '../../services/AirshipInstance'
import s from '../../../locales/strings'
import { FlipInputModal } from '../../modals/FlipInputModal'
import { EdgeText } from '../../themed/EdgeText'
import { Tile } from '../../themed/Tile'

type Props = {
  walletId: string,
  exchangeRates: ExchangeRatesState,
  isStatic: boolean,
  isHidden: boolean,
  nativeAmount: string | null,
  settings: any,
  guiWallet: GuiWallet,
  currencyCode: string
}

export const AmountComponent = ({
  walletId,
  exchangeRates,
  isStatic,
  isHidden,
  nativeAmount,
  settings,
  guiWallet,
  currencyCode,
  theme
}: Props & ThemeProps) => {
  if (isHidden) return null

  const handleFlipinputModal = () => {
    Airship.show(bridge => <FlipInputModal bridge={bridge} walletId={walletId} currencyCode={currencyCode} />).catch(console.log)
  }


  let cryptoAmountSyntax
  let fiatAmountSyntax
  const cryptoDisplayDenomination = UTILS.getDenomination(currencyCode, settings, 'display')
  const cryptoExchangeDenomination = UTILS.getDenomination(currencyCode, settings, 'exchange')
  const fiatDenomination = UTILS.getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
  const fiatSymbol = fiatDenomination.symbol ?? ''

  if (nativeAmount && !bns.eq(nativeAmount, '0')) {
    const displayAmount = bns.div(nativeAmount, cryptoDisplayDenomination.multiplier, UTILS.DIVIDE_PRECISION)
    const exchangeAmount = bns.div(nativeAmount, cryptoExchangeDenomination.multiplier, UTILS.DIVIDE_PRECISION)
    const fiatAmount = convertCurrencyFromExchangeRates(exchangeRates, currencyCode, guiWallet.isoFiatCurrencyCode, parseFloat(exchangeAmount))
    cryptoAmountSyntax = `${displayAmount ?? '0'} ${cryptoDisplayDenomination.name}`

    if (fiatAmount) {
      fiatAmountSyntax = `${fiatSymbol} ${fiatAmount.toFixed(2) ?? '0'}`
    }
  } else {
    cryptoAmountSyntax = `0 ${cryptoDisplayDenomination.name}`
  }

  return (
    <Tile
      type={isStatic ? 'static' : 'touchable'}
      title={s.strings.fio_request_amount}
      onPress={isStatic ? undefined : handleFlipinputModal}
    >
      <EdgeText style={{ fontSize: theme.rem(2) }}>{cryptoAmountSyntax}</EdgeText>
      {fiatAmountSyntax && <EdgeText>{fiatAmountSyntax}</EdgeText>}
    </Tile>
  )
}

export const Amount = withTheme(AmountComponent)
