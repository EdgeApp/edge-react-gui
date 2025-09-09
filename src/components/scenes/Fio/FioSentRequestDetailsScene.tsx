import { mul } from 'biggystring'
import type { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import type { GuiExchangeRates } from '../../../actions/ExchangeRateActions'
import { fioCodeToEdgeAsset } from '../../../constants/FioConstants'
import { FIAT_CODES_SYMBOLS } from '../../../constants/WalletAndCurrencyConstants'
import { formatDate, formatNumber, SHORT_DATE_FMT } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import { getExchangeRate } from '../../../selectors/WalletSelectors'
import { connect } from '../../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../../types/routerTypes'
import type { FioRequest, FioRequestStatus } from '../../../types/types'
import { EdgeCard } from '../../cards/EdgeCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { EdgeRow } from '../../rows/EdgeRow'
import {
  cacheStyles,
  type Theme,
  type ThemeProps,
  withTheme
} from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

export interface FioSentRequestDetailsParams {
  selectedFioSentRequest: FioRequest
}

type OwnProps = EdgeAppSceneProps<'fioSentRequestDetails'>

interface StateProps {
  account: EdgeAccount
  fiatSymbol: string
  isoFiatCurrencyCode: string
  exchangeRates: GuiExchangeRates
}

type Props = StateProps & OwnProps & ThemeProps

class FioSentRequestDetailsComponent extends React.PureComponent<Props> {
  fiatAmount = (tokenCode: string, amount: string = '0') => {
    const { exchangeRates, isoFiatCurrencyCode } = this.props
    const edgeAsset = fioCodeToEdgeAsset(
      this.props.account,
      this.props.route.params.selectedFioSentRequest.content.chain_code,
      tokenCode
    )
    if (edgeAsset == null) return '0'
    const { pluginId, tokenId } = edgeAsset
    const fiatPerCrypto = getExchangeRate(
      exchangeRates,
      pluginId,
      tokenId,
      isoFiatCurrencyCode
    ).toString()
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
    const text = `${amount} ${tokenCode} (${fiatSymbol} ${this.fiatAmount(
      tokenCode,
      amount
    )})`
    return <EdgeRow title={lstrings.fio_request_amount} body={text} />
  }

  statusField = (status: FioRequestStatus) => {
    const styles = getStyles(this.props.theme)
    let statusLabel = (
      <EdgeText style={styles.status}>
        {lstrings.fragment_wallet_unconfirmed}
      </EdgeText>
    )
    if (status === 'sent_to_blockchain') {
      statusLabel = (
        <EdgeText style={[styles.status, styles.statusReceived]}>
          {lstrings.received}
        </EdgeText>
      )
    } else if (status === 'rejected') {
      statusLabel = (
        <EdgeText style={[styles.status, styles.statusRejected]}>
          {lstrings.fio_reject_status}
        </EdgeText>
      )
    }
    return <EdgeRow title={lstrings.string_status}>{statusLabel}</EdgeRow>
  }

  render() {
    const { route, theme } = this.props
    const { selectedFioSentRequest } = route.params
    const styles = getStyles(theme)

    return (
      <SceneWrapper scroll>
        <SceneHeader
          title={lstrings.title_fio_sent_request_details}
          underline
        />
        <View style={styles.headerSpace}>
          <EdgeCard sections>
            {this.amountField()}
            <EdgeRow
              title={lstrings.fio_request_sent_details_from}
              body={selectedFioSentRequest.payee_fio_address}
            />
            <EdgeRow
              title={lstrings.fio_request_sent_details_to}
              body={selectedFioSentRequest.payer_fio_address}
            />
            {this.statusField(selectedFioSentRequest.status)}
            <EdgeRow
              title={lstrings.fio_date_label}
              body={formatDate(
                new Date(selectedFioSentRequest.time_stamp),
                SHORT_DATE_FMT
              )}
            />
            <EdgeRow
              title={lstrings.memo_memo_title}
              body={selectedFioSentRequest.content.memo}
            />
          </EdgeCard>
        </View>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  headerSpace: {
    paddingTop: theme.rem(0.5),
    marginHorizontal: theme.rem(0.5)
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

export const FioSentRequestDetailsScene = connect<
  StateProps,
  unknown,
  OwnProps
>(
  state => {
    const { defaultFiat, defaultIsoFiat } = state.ui.settings
    return {
      account: state.core.account,
      exchangeRates: state.exchangeRates,
      fiatSymbol: FIAT_CODES_SYMBOLS[defaultFiat],
      isoFiatCurrencyCode: defaultIsoFiat
    }
  },
  dispatch => ({})
)(withTheme(FioSentRequestDetailsComponent))
