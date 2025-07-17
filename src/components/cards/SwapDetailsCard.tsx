import { abs, sub } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTransaction, EdgeTxSwap } from 'edge-core-js'
import * as React from 'react'
import { Linking, Platform } from 'react-native'
import Mailer from 'react-native-mail'
import SafariView from 'react-native-safari-view'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import {
  getExchangeDenom,
  selectDisplayDenom,
  selectDisplayDenomByCurrencyCode
} from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { ReportsTxInfo } from '../../util/reportsServer'
import { convertNativeToDisplay, unixToLocaleDateTime } from '../../util/utils'
import { DataSheetModal, DataSheetSection } from '../modals/DataSheetModal'
import { ShimmerText } from '../progress-indicators/ShimmerText'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship, showError } from '../services/AirshipInstance'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  swapData: EdgeTxSwap
  transaction: EdgeTransaction
  sourceWallet?: EdgeCurrencyWallet

  /** The transaction info from the reports server. */
  reportsTxInfo?: ReportsTxInfo
  /**
   * Whether the transaction info from the reports server is loading.
   * If not provided, the card will not show the status.
   * */
  isReportsTxInfoLoading?: boolean
}

const TXID_PLACEHOLDER = '{{TXID}}'

export function SwapDetailsCard(props: Props) {
  const {
    swapData,
    transaction,
    sourceWallet,
    reportsTxInfo,
    isReportsTxInfoLoading = false
  } = props
  const { memos = [], spendTargets = [], tokenId } = transaction

  const formattedOrderUri =
    swapData.orderUri == null
      ? undefined
      : swapData.orderUri.replace(TXID_PLACEHOLDER, transaction.txid)
  const payoutCurrencyCode = swapData.payoutCurrencyCode

  const handleExchangeDetails = useHandler(async () => {
    await Airship.show(bridge => (
      <DataSheetModal
        bridge={bridge}
        sections={createExchangeDataSheetSections()}
        title={lstrings.transaction_details_exchange_details}
      />
    ))
  })

  const handleEmail = useHandler(() => {
    // Serialize the data sheet sections to a string:
    const sections = createExchangeDataSheetSections()
    const body = sections
      .map(section =>
        // Separate rows with a newline
        section.rows.map(row => row.title + ': ' + row.body).join('\n')
      )
      // Separate sections with two newlines
      .join('\n\n')
      // Replace newlines with <br/> tags
      .replaceAll('\n', '<br/>')

    Mailer.mail(
      {
        subject: sprintf(
          lstrings.transaction_details_exchange_support_request,
          swapData.plugin.displayName
        ),
        recipients:
          swapData.plugin.supportEmail != null
            ? [swapData.plugin.supportEmail]
            : undefined,
        body,
        isHTML: true
      },
      (error, event) => {
        if (String(error) === 'not_available') {
          showError(lstrings.error_no_email_account)
          return
        }

        if (error) showError(error)
      }
    )
  })

  const handleLink = async () => {
    if (formattedOrderUri == null) return

    // Replace {{TXID}} with actual transaction ID if present

    if (Platform.OS === 'ios') {
      SafariView.isAvailable()
        .then(async available => {
          if (available) await SafariView.show({ url: formattedOrderUri })
          else await Linking.openURL(formattedOrderUri)
        })
        .catch(error => {
          showError(error)
          Linking.openURL(formattedOrderUri).catch(err => showError(err))
        })
    } else {
      await Linking.openURL(formattedOrderUri)
    }
  }

  // The wallet may have been deleted:
  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const destinationWallet = currencyWallets[swapData.payoutWalletId]
  const destinationWalletName =
    destinationWallet == null ? '' : getWalletName(destinationWallet)
  const destinationDenomination = useSelector(state =>
    destinationWallet == null
      ? undefined
      : selectDisplayDenomByCurrencyCode(
          state,
          destinationWallet.currencyConfig,
          payoutCurrencyCode
        )
  )

  const sourceNativeAmount = sub(
    abs(transaction.nativeAmount),
    transaction.networkFee
  )
  const sourceWalletDenom = useSelector(state =>
    sourceWallet?.currencyInfo.currencyCode === transaction.currencyCode
      ? getExchangeDenom(sourceWallet.currencyConfig, tokenId)
      : sourceWallet != null
      ? selectDisplayDenom(state, sourceWallet.currencyConfig, tokenId)
      : undefined
  )
  const sourceAmount =
    sourceWalletDenom == null
      ? undefined
      : convertNativeToDisplay(sourceWalletDenom.multiplier)(sourceNativeAmount)
  const sourceAssetName =
    sourceWalletDenom == null || sourceWallet == null
      ? undefined
      : tokenId == null
      ? sourceWalletDenom.name
      : `${sourceWalletDenom.name} (${
          getExchangeDenom(sourceWallet.currencyConfig, null).name
        })`

  const destinationAmount =
    destinationDenomination == null
      ? undefined
      : convertNativeToDisplay(destinationDenomination.multiplier)(
          swapData.payoutNativeAmount
        )
  const destinationAssetName =
    payoutCurrencyCode ===
    getExchangeDenom(destinationWallet.currencyConfig, null).name
      ? payoutCurrencyCode
      : `${payoutCurrencyCode} (${
          getExchangeDenom(destinationWallet.currencyConfig, null).name
        })`

  const createExchangeDataSheetSections = (): DataSheetSection[] => {
    const uniqueIdentifier = memos
      .map(
        (memo, index) =>
          `${memo.value}${index + 1 !== memos.length ? '\n' : ''}`
      )
      .toString()
    const exchangeAddresses = spendTargets
      .map(
        (target, index) =>
          `${target.publicAddress}${
            index + 1 !== spendTargets.length ? '\n' : ''
          }`
      )
      .toString()
    const { dateTime } = unixToLocaleDateTime(transaction.date)

    return [
      {
        rows: [
          {
            title: lstrings.fio_date_label,
            body: dateTime
          },
          {
            title: lstrings.transaction_details_exchange_service,
            body: swapData.plugin.displayName
          },
          {
            title: lstrings.transaction_details_exchange_order_id,
            body: swapData.orderId || ''
          },
          {
            title: lstrings.quote_type,
            body: swapData.isEstimate
              ? lstrings.estimated_quote
              : lstrings.fixed_quote
          },
          ...(reportsTxInfo == null
            ? []
            : [
                {
                  title: lstrings.transaction_details_exchange_status,
                  body: reportsTxInfo.status
                }
              ])
        ]
      },
      {
        rows: [
          ...(sourceWallet?.name == null
            ? []
            : [
                {
                  title: lstrings.transaction_details_exchange_source_wallet,
                  body: sourceWallet.name
                }
              ]),
          ...(sourceAmount == null || sourceAssetName == null
            ? []
            : [
                {
                  title: lstrings.string_send_amount,
                  body: `${sourceAmount} ${sourceAssetName}`
                }
              ])
        ]
      },
      {
        rows: [
          {
            title: lstrings.transaction_details_exchange_destination_wallet,
            body: destinationWalletName
          },
          {
            title: lstrings.string_receive_amount,
            body: `${destinationAmount} ${destinationAssetName}`
          }
        ]
      },
      {
        rows: [
          {
            title: lstrings.transaction_details_tx_id_modal_title,
            body: transaction.txid
          },
          {
            title: lstrings.transaction_details_exchange_exchange_address,
            body: exchangeAddresses
          },
          ...(uniqueIdentifier !== ''
            ? [
                {
                  title:
                    lstrings.transaction_details_exchange_exchange_unique_id,
                  body: uniqueIdentifier
                }
              ]
            : []),
          {
            title: lstrings.transaction_details_exchange_payout_address,
            body: swapData.payoutAddress
          },
          {
            title: lstrings.transaction_details_exchange_refund_address,
            body: swapData.refundAddress || ''
          }
        ]
      }
    ]
  }

  if (destinationAmount == null) {
    return null
  }

  return (
    <EdgeCard sections>
      <EdgeRow
        rightButtonType="touchable"
        title={lstrings.transaction_details_exchange_details}
        onPress={handleExchangeDetails}
      >
        <EdgeText>
          {(sourceAmount == null ? '' : `${sourceAmount} ${sourceAssetName}`) +
            ' → ' +
            `${destinationAmount} ${destinationAssetName}`}
        </EdgeText>
        <EdgeText>
          {swapData.isEstimate
            ? lstrings.estimated_quote
            : lstrings.fixed_quote}
        </EdgeText>
      </EdgeRow>
      {isReportsTxInfoLoading == null ? null : (
        <EdgeRow title={lstrings.transaction_details_exchange_status}>
          {isReportsTxInfoLoading ? (
            <ShimmerText characters={10} />
          ) : (
            <EdgeText>
              {reportsTxInfo == null
                ? lstrings.string_unknown
                : reportsTxInfo.status}
            </EdgeText>
          )}
        </EdgeRow>
      )}
      {swapData.orderUri == null ? null : (
        <EdgeRow
          rightButtonType="touchable"
          title={lstrings.transaction_details_exchange_status_page}
          onPress={handleLink}
          body={formattedOrderUri}
        />
      )}
      {swapData.plugin.supportEmail == null ? null : (
        <EdgeRow
          rightButtonType="touchable"
          title={lstrings.transaction_details_exchange_support}
          onPress={handleEmail}
          body={swapData.plugin.supportEmail}
        />
      )}
    </EdgeCard>
  )
}
