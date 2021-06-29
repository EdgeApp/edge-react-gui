// @flow

import React from 'react'
import { type EdgeCurrencyWallet, type EdgeTransaction, asMaybeNoAmountSpecifiedError } from 'edge-core-js'

import { type FeeOption } from '../../reducers/scenes/SendConfirmationReducer'
import { Airship } from '../../services/AirshipInstance'
import type { ExchangeRatesState } from '../../../modules/ExchangeRates/reducer'
import { type ThemeProps, withTheme } from '../../services/ThemeContext'
import type { GuiWallet } from '../../../types/types'
import s from '../../../locales/strings'
import * as UTILS from '../../../util/utils'
import { EdgeText } from '../../themed/EdgeText'
import { Tile } from '../../themed/Tile'
import { ChangeMiningFeeModal } from '../../modals/ChangeMiningFeeModal'

type Props = {
  guiWallet: GuiWallet,
  currencyCode: string,
  coreWallet: EdgeCurrencyWallet,
  error: Error | null,
  exchangeRates: ExchangeRatesState,
  settings: any,
  transaction: EdgeTransaction | null,
  isHidden: boolean,
  handleFeesUpdate: (networkFeeOption: FeeOption, customNetworkFee: Object) => void
}

export const FeesComponent = ({
  guiWallet,
  coreWallet,
  currencyCode,
  error,
  exchangeRates,
  settings,
  transaction,
  isHidden,
  handleFeesUpdate,
  theme
}: Props & ThemeProps) => {
  const handleFeesChange = async () => {
    const response = await Airship.show(bridge => <ChangeMiningFeeModal bridge={bridge} wallet={coreWallet} currencyCode={currencyCode} />)

    if (response) {
      handleFeesUpdate(response.networkFeeOption, response.customNetworkFee)
    }
  }

  if (error && !asMaybeNoAmountSpecifiedError(error)) {
    return (
      <Tile type="static" title={s.strings.send_scene_error_title}>
        <EdgeText style={{ color: theme.dangerText }}>{error.message}</EdgeText>
      </Tile>
    )
  }

  if (isHidden) return null

  const {
    fiatAmount,
    cryptoAmount,
    cryptoSymbol = '',
    fiatSymbol = '',
    fiatStyle: feeSyntaxStyle
  } = UTILS.convertTransactionFeeToDisplayFee(guiWallet, currencyCode, exchangeRates, transaction, settings)
  const feeSyntax = `${cryptoSymbol} ${cryptoAmount} (${fiatSymbol} ${fiatAmount})`

  return (
    <Tile type="touchable" title={`${s.strings.string_fee}:`} onPress={handleFeesChange}>
      <EdgeText style={{ color: feeSyntaxStyle ? theme[feeSyntaxStyle] : theme.primaryText }}>{feeSyntax}</EdgeText>
    </Tile>
  )
}

export const Fees = withTheme(FeesComponent)
