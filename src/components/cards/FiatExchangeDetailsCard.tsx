import { div } from 'biggystring'
import type {
  EdgeAssetAction,
  EdgeCurrencyWallet,
  EdgeTransaction,
  EdgeTxActionFiat
} from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { getExchangeDenom } from '../../selectors/DenominationSelectors'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { composeEmail, EmailUnavailableError } from '../../util/mail'
import { unixToLocaleDateTime } from '../../util/utils'
import { openBrowserUri } from '../../util/WebUtils'
import { RawTextModal } from '../modals/RawTextModal'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  action: EdgeTxActionFiat
  assetAction: EdgeAssetAction
  transaction: EdgeTransaction
  wallet: EdgeCurrencyWallet
}

export function FiatExchangeDetailsCard(props: Props) {
  const { action, assetAction, transaction, wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const {
    orderId,
    orderUri,
    isEstimate,
    fiatPlugin: { providerDisplayName, supportEmail },
    payinAddress,
    payoutAddress,
    fiatAsset,
    cryptoAsset
  } = action

  const { tokenId, pluginId, nativeAmount } = cryptoAsset

  const { assetActionType: direction } = assetAction

  const createExchangeDataString = (nl: string = '\n') => {
    const { dateTime } = unixToLocaleDateTime(transaction.date)

    const exchangeData = [
      [lstrings.fio_date_label, dateTime],
      [lstrings.transaction_details_tx_id_modal_title, transaction.txid],
      [lstrings.transaction_details_exchange_service, providerDisplayName],
      [lstrings.transaction_details_exchange_order_id, orderId],
      [isEstimate ? lstrings.estimated_quote : lstrings.fixed_quote, undefined]
    ]
    if (payinAddress != null)
      exchangeData.push([
        lstrings.transaction_details_exchange_exchange_address,
        payinAddress
      ])
    if (payoutAddress != null)
      exchangeData.push([
        lstrings.transaction_details_exchange_payout_address,
        payoutAddress
      ])

    return exchangeData
      .map(([key, value]) => (value == null ? key : `${key}: ${value}`))
      .join(nl)
  }

  const handleExchangeDetails = useHandler(async () => {
    await Airship.show(bridge => (
      <RawTextModal
        bridge={bridge}
        body={createExchangeDataString()}
        title={lstrings.transaction_details_exchange_details}
      />
    ))
  })

  const handleEmail = useHandler(async () => {
    const body = createExchangeDataString('<br />')

    try {
      await composeEmail({
        subject: sprintf(
          lstrings.transaction_details_exchange_support_request,
          providerDisplayName
        ),
        recipients: supportEmail != null ? [supportEmail] : undefined,
        body,
        isHtml: true
      })
    } catch (error: unknown) {
      if (error instanceof EmailUnavailableError) {
        showError(lstrings.error_no_email_account)
        return
      }
      showError(error)
    }
  })

  const handleLink = () => {
    if (orderUri == null) return
    openBrowserUri(orderUri).catch((error: unknown) => {
      showError(error)
    })
  }

  const currencyCode = getCurrencyCode(wallet, tokenId)
  let sourceCurrencyCode = ''
  let destinationCurrencyCode = ''
  if (direction === 'buy') {
    sourceCurrencyCode = fiatAsset.fiatCurrencyCode
    destinationCurrencyCode = currencyCode
  } else {
    sourceCurrencyCode = currencyCode
    destinationCurrencyCode = fiatAsset.fiatCurrencyCode
  }
  const { multiplier } = getExchangeDenom(wallet.currencyConfig, tokenId)
  const exchangeAmount =
    nativeAmount != null ? div(nativeAmount, multiplier, multiplier.length) : ''
  const sourceAmount =
    direction === 'buy' ? fiatAsset.fiatAmount : exchangeAmount
  const destinationAmount =
    direction === 'buy' ? exchangeAmount : fiatAsset.fiatAmount

  if (pluginId !== wallet.currencyInfo.pluginId) return null
  if (action.actionType !== 'fiat') return null
  if (direction !== 'buy' && direction !== 'sell') return null

  return (
    <EdgeCard sections>
      <EdgeRow
        rightButtonType="touchable"
        title={lstrings.transaction_details_exchange_details}
        onPress={handleExchangeDetails}
      >
        <View style={styles.tileColumn}>
          <EdgeText>
            {lstrings.title_exchange +
              ' ' +
              sourceAmount +
              ' ' +
              sourceCurrencyCode}
          </EdgeText>
          <EdgeText>
            {lstrings.string_to_capitalize +
              ' ' +
              destinationAmount +
              ' ' +
              destinationCurrencyCode}
          </EdgeText>
          <EdgeText>
            {isEstimate ? lstrings.estimated_quote : lstrings.fixed_quote}
          </EdgeText>
        </View>
      </EdgeRow>
      <EdgeRow
        rightButtonType="copy"
        title={lstrings.transaction_details_exchange_order_id}
        body={orderId}
      />
      {orderUri == null ? null : (
        <EdgeRow
          rightButtonType="touchable"
          title={lstrings.transaction_details_exchange_status_page}
          onPress={handleLink}
          body={orderUri}
        />
      )}
      {supportEmail == null ? null : (
        <EdgeRow
          rightButtonType="touchable"
          title={lstrings.transaction_details_exchange_support}
          onPress={handleEmail}
          body={supportEmail}
        />
      )}
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  tileColumn: {
    flexDirection: 'column',
    justifyContent: 'center'
  }
}))
