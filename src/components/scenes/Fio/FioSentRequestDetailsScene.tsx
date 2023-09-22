import { mul } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'

import { FIAT_CODES_SYMBOLS } from '../../../constants/WalletAndCurrencyConstants'
import { formatDate, formatNumber, SHORT_DATE_FMT } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import { getSelectedCurrencyWallet } from '../../../selectors/WalletSelectors'
import { connect } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { FioRequestStatus, GuiExchangeRates } from '../../../types/types'
import { SceneWrapper } from '../../common/SceneWrapper'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'
import { Tile } from '../../tiles/Tile'

interface OwnProps extends EdgeSceneProps<'fioSentRequestDetails'> {}

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
    return <Tile type="static" title={lstrings.fio_request_amount} body={text} />
  }

  statusField = (status: FioRequestStatus) => {
    const styles = getStyles(this.props.theme)
    let statusLabel = <EdgeText style={styles.status}>{lstrings.fragment_wallet_unconfirmed}</EdgeText>
    if (status === 'sent_to_blockchain') {
      statusLabel = <EdgeText style={[styles.status, styles.statusReceived]}>{lstrings.fragment_transaction_list_receive_prefix}</EdgeText>
    } else if (status === 'rejected') {
      statusLabel = <EdgeText style={[styles.status, styles.statusRejected]}>{lstrings.fio_reject_status}</EdgeText>
    }
    return (
      <Tile type="static" title={lstrings.string_status}>
        {statusLabel}
      </Tile>
    )
  }

  render() {
    const { route, theme } = this.props
    const { selectedFioSentRequest } = route.params
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="theme">
        <SceneHeader title={lstrings.title_fio_sent_request_details} underline />
        <View style={styles.headerSpace} />
        {this.amountField()}
        <Tile type="static" title={lstrings.fio_request_sent_details_from} body={selectedFioSentRequest.payee_fio_address} />
        <Tile type="static" title={lstrings.fio_request_sent_details_to} body={selectedFioSentRequest.payer_fio_address} />
        {this.statusField(selectedFioSentRequest.status)}
        <Tile type="static" title={lstrings.fio_date_label} body={formatDate(new Date(selectedFioSentRequest.time_stamp), SHORT_DATE_FMT)} />
        <Tile type="static" title={lstrings.memo_memo_title} body={selectedFioSentRequest.content.memo} />
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  headerSpace: {
    paddingTop: theme.rem(0.5)
  },
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
