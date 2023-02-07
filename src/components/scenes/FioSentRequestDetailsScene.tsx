import { mul } from 'biggystring'
import * as React from 'react'

import { FIAT_CODES_SYMBOLS } from '../../constants/WalletAndCurrencyConstants'
import { formatDate, formatNumber, SHORT_DATE_FMT } from '../../locales/intl'
import s from '../../locales/strings'
import { isRejectedFioRequest, isSentFioRequest } from '../../modules/FioRequest/util'
import { getSelectedCurrencyWallet } from '../../selectors/WalletSelectors'
import { connect } from '../../types/reactRedux'
import { RouteProp } from '../../types/routerTypes'
import { GuiExchangeRates } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { SceneHeader } from '../themed/SceneHeader'
import { Tile } from '../tiles/Tile'
interface OwnProps {
  route: RouteProp<'fioSentRequestDetails'>
}

interface StateProps {
  fiatSymbol: string
  isoFiatCurrencyCode: string
  exchangeRates: GuiExchangeRates
}

type Props = StateProps & OwnProps & ThemeProps

class FioSentRequestDetailsComponent extends React.PureComponent<Props> {
  fiatAmount = (currencyCode: string, amount: string = '0') => {
    const { exchangeRates, isoFiatCurrencyCode } = this.props
    const rateKey = `${currencyCode}_${isoFiatCurrencyCode}`
    const fiatPerCrypto = exchangeRates[rateKey] ?? '0'
    const fiatAmount = mul(fiatPerCrypto, amount)

    return formatNumber(fiatAmount, { toFixed: 2 })
  }

  amountField = () => {
    const { fiatSymbol, route } = this.props
    const {
      selectedFioSentRequest: { content }
    } = route.params
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
    const { route } = this.props
    const { selectedFioSentRequest } = route.params
    return (
      <SceneWrapper background="header">
        <SceneHeader title={s.strings.title_fio_sent_request_details} underline />
        {this.amountField()}
        <Tile type="static" title={s.strings.fio_request_sent_details_from} body={selectedFioSentRequest.payee_fio_address} />
        <Tile type="static" title={s.strings.fio_request_sent_details_to} body={selectedFioSentRequest.payer_fio_address} />
        {this.statusField(selectedFioSentRequest.status)}
        <Tile type="static" title={s.strings.fio_date_label} body={formatDate(new Date(selectedFioSentRequest.time_stamp), SHORT_DATE_FMT)} />
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

export const FioSentRequestDetailsScene = connect<StateProps, {}, OwnProps>(
  state => {
    const wallet = getSelectedCurrencyWallet(state)
    return {
      exchangeRates: state.exchangeRates,
      fiatSymbol: FIAT_CODES_SYMBOLS[wallet.fiatCurrencyCode.replace('iso:', '')],
      isoFiatCurrencyCode: wallet.fiatCurrencyCode
    }
  },
  dispatch => ({})
)(withTheme(FioSentRequestDetailsComponent))
