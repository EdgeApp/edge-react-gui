// @flow

import * as React from 'react'
import { connect } from 'react-redux'

import { FIAT_CODES_SYMBOLS } from '../../constants/WalletAndCurrencyConstants.js'
import { formatDate, formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { isRejectedFioRequest, isSentFioRequest } from '../../modules/FioRequest/util'
import type { RootState } from '../../reducers/RootReducer'
import { getSelectedWallet } from '../../selectors/WalletSelectors.js'
import { type FioRequest, type GuiExchangeRates, type GuiWallet } from '../../types/types.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { SceneHeader } from '../themed/SceneHeader'
import { Tile } from '../themed/Tile'

type NavigationProps = {
  selectedFioSentRequest: FioRequest
}

type FioSentRequestDetailsProps = {
  fiatSymbol: string,
  isoFiatCurrencyCode: string,
  exchangeRates: GuiExchangeRates
}

type FioSentRequestDetailsDispatchProps = {}

type Props = FioSentRequestDetailsProps & FioSentRequestDetailsDispatchProps & NavigationProps & ThemeProps

class FioSentRequestDetailsComponent extends React.PureComponent<Props> {
  fiatAmount = (currencyCode: string, amount: string) => {
    const { exchangeRates, isoFiatCurrencyCode } = this.props
    const rateKey = `${currencyCode}_${isoFiatCurrencyCode}`
    const fiatPerCrypto = exchangeRates[rateKey] ? exchangeRates[rateKey] : 0
    const amountToMultiply = parseFloat(amount)

    return formatNumber(fiatPerCrypto * amountToMultiply, { toFixed: 2 }) || '0'
  }

  amountField = () => {
    const {
      fiatSymbol,
      selectedFioSentRequest: { content }
    } = this.props
    const { amount } = content
    const tokenCode = content.token_code.toUpperCase()
    const text = `${amount} ${tokenCode} (${fiatSymbol} ${this.fiatAmount(tokenCode, amount)})`
    return <Tile type="static" title={s.strings.fio_request_amount} body={text} />
  }

  statusField = (status: string) => {
    const styles = getStyles(this.props.theme)
    let statusLabel = <EdgeText style={styles.status}>{s.strings.fragment_wallet_unconfirmed}</EdgeText>
    if (isSentFioRequest(status)) {
      statusLabel = <EdgeText style={[styles.status, styles.statusReceived]}>{s.strings.fragment_transaction_list_receive_prefix}</EdgeText>
    }
    if (isRejectedFioRequest(status)) {
      statusLabel = <EdgeText style={[styles.status, styles.statusRejected]}>{s.strings.fio_reject_status}</EdgeText>
    }
    return (
      <Tile type="static" title={s.strings.string_status}>
        {statusLabel}
      </Tile>
    )
  }

  render() {
    const { selectedFioSentRequest } = this.props
    return (
      <SceneWrapper background="header">
        <SceneHeader title={s.strings.title_fio_sent_request_details} underline />
        {this.amountField()}
        <Tile type="static" title={s.strings.fio_request_sent_details_from} body={selectedFioSentRequest.payee_fio_address} />
        <Tile type="static" title={s.strings.fio_request_sent_details_to} body={selectedFioSentRequest.payer_fio_address} />
        {this.statusField(selectedFioSentRequest.status)}
        <Tile type="static" title={s.strings.fio_date_label} body={formatDate(new Date(selectedFioSentRequest.time_stamp), true)} />
        <Tile type="static" title={s.strings.unique_identifier_memo} body={selectedFioSentRequest.content.memo} />
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  status: {
    color: theme.warningText,
    fontSize: theme.rem(1)
  },
  statusRejected: {
    color: theme.dangerText
  },
  statusReceived: {
    color: theme.textLink
  }
}))

const FioSentRequestDetailsScene = connect((state: RootState) => {
  const wallet: GuiWallet = getSelectedWallet(state)
  const isoFiatCurrencyCode = wallet.isoFiatCurrencyCode
  const exchangeRates = state.exchangeRates
  const fiatSymbol = FIAT_CODES_SYMBOLS[wallet.fiatCurrencyCode]

  const out: FioSentRequestDetailsProps = {
    exchangeRates,
    fiatSymbol,
    isoFiatCurrencyCode
  }
  return out
}, {})(withTheme(FioSentRequestDetailsComponent))
export { FioSentRequestDetailsScene }
