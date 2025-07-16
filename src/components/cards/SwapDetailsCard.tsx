import { abs, sub } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTransaction, EdgeTxSwap } from 'edge-core-js'
import * as React from 'react'
import { Linking, Platform } from 'react-native'
import Mailer from 'react-native-mail'
import SafariView from 'react-native-safari-view'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { useWalletName } from '../../hooks/useWalletName'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import {
  getExchangeDenom,
  selectDisplayDenom,
  selectDisplayDenomByCurrencyCode
} from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { convertNativeToDisplay, unixToLocaleDateTime } from '../../util/utils'
import { DataSheetModal, DataSheetSection } from '../modals/DataSheetModal'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship, showError } from '../services/AirshipInstance'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  swapData: EdgeTxSwap
  transaction: EdgeTransaction
  wallet: EdgeCurrencyWallet
}

const TXID_PLACEHOLDER = '{{TXID}}'

export function SwapDetailsCard(props: Props) {
  const { swapData, transaction, wallet } = props

  const { memos = [], spendTargets = [], tokenId } = transaction
  const { currencyInfo } = wallet
  const walletName = useWalletName(wallet)
  const walletDefaultDenom = useSelector(state =>
    currencyInfo.currencyCode === transaction.currencyCode
      ? getExchangeDenom(wallet.currencyConfig, tokenId)
      : selectDisplayDenom(state, wallet.currencyConfig, tokenId)
  )

  const {
    isEstimate,
    orderId,
    orderUri,
    payoutAddress,
    payoutWalletId,
    plugin,
    refundAddress
  } = swapData
  const formattedOrderUri =
    orderUri == null
      ? undefined
      : orderUri.replace(TXID_PLACEHOLDER, transaction.txid)
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
          plugin.displayName
        ),
        recipients:
          plugin.supportEmail != null ? [plugin.supportEmail] : undefined,
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
  const destinationWallet = currencyWallets[payoutWalletId]
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
  if (destinationDenomination == null) return null

  const sourceNativeAmount = sub(
    abs(transaction.nativeAmount),
    transaction.networkFee
  )
  const sourceAmount = convertNativeToDisplay(walletDefaultDenom.multiplier)(
    sourceNativeAmount
  )
  const sourceAssetName =
    tokenId == null
      ? walletDefaultDenom.name
      : `${walletDefaultDenom.name} (${
          getExchangeDenom(wallet.currencyConfig, null).name
        })`

  const destinationAmount = convertNativeToDisplay(
    destinationDenomination.multiplier
  )(swapData.payoutNativeAmount)
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
            body: plugin.displayName
          },
          {
            title: lstrings.transaction_details_exchange_order_id,
            body: orderId || ''
          },
          {
            title: lstrings.quote_type,
            body: isEstimate ? lstrings.estimated_quote : lstrings.fixed_quote
          }
        ]
      },
      {
        rows: [
          {
            title: lstrings.transaction_details_exchange_source_wallet,
            body: walletName
          },
          {
            title: lstrings.string_send_amount,
            body: `${sourceAmount} ${sourceAssetName}`
          }
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
            body: payoutAddress
          },
          {
            title: lstrings.transaction_details_exchange_refund_address,
            body: refundAddress || ''
          }
        ]
      }
    ]
  }

  return (
    <EdgeCard sections>
      <EdgeRow
        rightButtonType="touchable"
        title={lstrings.transaction_details_exchange_details}
        onPress={handleExchangeDetails}
      >
        <EdgeText>
          {`${sourceAmount} ${sourceAssetName}` +
            ' → ' +
            `${destinationAmount} ${destinationAssetName}`}
        </EdgeText>
        <EdgeText>
          {swapData.isEstimate
            ? lstrings.estimated_quote
            : lstrings.fixed_quote}
        </EdgeText>
      </EdgeRow>
      {orderUri == null ? null : (
        <EdgeRow
          rightButtonType="touchable"
          title={lstrings.transaction_details_exchange_status_page}
          onPress={handleLink}
          body={formattedOrderUri}
        />
      )}
      {plugin.supportEmail == null ? null : (
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
