// @flow

import React, { Component } from 'react'
import { Alert, Animated, FlatList, Platform, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import slowlog from 'react-native-slowlog'

import * as Constants from '../../constants/indexConstants'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import FioRequestRow from '../../modules/FioRequest/components/FioRequestRow'
import FullScreenLoader from '../../modules/FioRequest/components/FullScreenLoader'
import SwipeListView from '../../modules/FioRequest/components/SwipeListView'
import T from '../../modules/UI/components/FormattedText/index'
import { styles as requestListStyles } from '../../styles/scenes/FioRequestListStyle'
import styles from '../../styles/scenes/TransactionListStyle'
import type { GuiWallet } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'

const SCROLL_THRESHOLD = 0.5

export type State = {
  rejectLoading: boolean
}

export type StateProps = {
  wallets: { [walletId: string]: GuiWallet },
  loading: boolean,
  isoFiatCurrencyCode: string,
  fiatSymbol: string,
  exchangeRates: any,
  pendingFioRequests: any[],
  sentFioRequests: any[],
  animation: any,
  isConnected: boolean
}

export type DispatchProps = {
  updateExchangeRates: () => any,
  getFioRequestsPending: () => any,
  getFioRequestsSent: () => any,
  fioRejectRequest: (fioRequestId: string, payerFioAddress: string, cb: Function) => void,
  removeFioPendingRequest: (requestId: string) => any,
  setFioPendingRequestSelected: (obj: Object) => any,
  setFioSentRequestSelected: (obj: Object) => any
}

type Props = StateProps & DispatchProps

const PENDING_TEXT = s.strings.fio_pendingrequest
const SENT_TEXT = s.strings.fio_sentrequest

export class FioRequestList extends Component<Props, State> {
  listFooterHeight = 50

  constructor (props: Props) {
    super(props)
    this.state = {
      rejectLoading: false
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  componentDidMount = () => {
    this.props.updateExchangeRates()
    this.props.getFioRequestsPending()
    this.props.getFioRequestsSent()
    this.props.animation = new Animated.Value(0)
  }

  handleScrollEnd = () => {}

  closeRow = (rowMap: any[], rowKey: any) => {
    if (rowMap[rowKey]) {
      rowMap[rowKey].closeRow()
    }
  }

  rejectFioRequest = (rowMap: any[], rowKey: any, requestId: string, payerFioAddress: string) => {
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    this.setState({ rejectLoading: true })
    this.props.fioRejectRequest(`${requestId}`, payerFioAddress, e => {
      if (!e) {
        this.props.removeFioPendingRequest(requestId)
        this.closeRow(rowMap, rowKey)
      }
      this.setState({ rejectLoading: false })
    })
  }

  rejectRow = (rowMap: any[], rowKey: any, requestId: string, payerFioAddress: string) => {
    Alert.alert(
      s.strings.fio_reject_request_title,
      s.strings.fio_reject_request_message,
      [
        {
          text: s.strings.string_cancel_cap,
          onPress: () => this.closeRow(rowMap, rowKey),
          style: 'cancel'
        },
        { text: s.strings.fio_reject_request_yes, onPress: () => this.rejectFioRequest(rowMap, rowKey, requestId, payerFioAddress) }
      ],
      { cancelable: false }
    )
  }

  onSwipeValueChange = (swipeData: any) => {
    const { value } = swipeData
    if (this.props.animation) {
      this.props.animation.setValue(Math.abs(value))
    }
  }

  fiatAmount = (currencyCode: string, amount: string): string => {
    const { exchangeRates, isoFiatCurrencyCode } = this.props
    let fiatPerCrypto
    if (currencyCode === Constants.FIO_STR) {
      fiatPerCrypto = 1
    } else {
      const rateKey = `${currencyCode}_${isoFiatCurrencyCode}`
      fiatPerCrypto = exchangeRates[rateKey] ? exchangeRates[rateKey] : 0
    }
    const amountToMultiply = parseFloat(amount)

    return (fiatPerCrypto * amountToMultiply).toFixed(2)
  }

  headerTitle = (headerDate: Date) => {
    return intl.formatExpDate(headerDate, true)
  }

  headerRowUsingTitle = (headerTitle: string) => {
    return (
      <View style={requestListStyles.rowContainer}>
        <T style={requestListStyles.rowTitle}>{headerTitle}</T>
      </View>
    )
  }

  selectRequest = (tx: Object) => {
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    const { wallets, setFioPendingRequestSelected } = this.props
    for (const walletKey: string of Object.keys(wallets)) {
      if (wallets[walletKey].currencyCode.toLowerCase() === tx.content.chain_code.toLowerCase()) {
        setFioPendingRequestSelected(tx)
        Actions[Constants.FIO_PENDING_REQUEST_DETAILS]()
        return
      }
    }
    showError(`${s.strings.err_token_not_in_wallet_title}. ${s.strings.err_token_not_in_wallet_msg}`)
  }

  selectSentRequest = (tx: Object) => {
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    this.props.setFioSentRequestSelected(tx)
    Actions[Constants.FIO_SENT_REQUEST_DETAILS]()
  }

  addHeadersTransactions = (txs: any[]) => {
    const headers: any[] = []
    let transactionsInSection: any[] = []
    let previousTimestamp = 0
    let previousTitle = ''
    if (txs) {
      txs.forEach((transaction, i) => {
        if (i === 0) {
          transactionsInSection = []
          previousTimestamp = transaction.time_stamp
        }
        if (i > 0 && intl.formatExpDate(new Date(previousTimestamp)) !== intl.formatExpDate(new Date(transaction.time_stamp))) {
          headers.push({ title: previousTitle, data: transactionsInSection })
          transactionsInSection = []
        }
        transactionsInSection.push(transaction)
        previousTimestamp = transaction.time_stamp
        previousTitle = this.headerTitle(new Date(transaction.time_stamp))
      })
      headers.push({ title: previousTitle, data: transactionsInSection })
    }
    return headers
  }

  renderTx = (itemObj: { item: any, index: number }) => {
    const { item: transaction } = itemObj
    return <FioRequestRow transaction={transaction} onSelect={this.selectRequest} fiatSymbol={this.props.fiatSymbol} fiatAmount={this.fiatAmount} />
  }

  renderSentTx = (itemObj: { item: any, index: number }) => {
    const { item: transaction, index } = itemObj
    const isHeaderRow =
      index === 0 ||
      (index > 0 &&
        intl.formatExpDate(new Date(this.props.sentFioRequests[index - 1].time_stamp), true) !== intl.formatExpDate(new Date(transaction.time_stamp), true))
    return (
      <FioRequestRow
        transaction={transaction}
        onSelect={this.selectSentRequest}
        isSent={true}
        isHeaderRow={isHeaderRow}
        fiatSymbol={this.props.fiatSymbol}
        fiatAmount={this.fiatAmount}
      />
    )
  }

  renderHiddenItem (transaction: any, rowMap: any[]) {
    return (
      <View style={requestListStyles.rowBack}>
        <TouchableOpacity
          style={[requestListStyles.backRightBtn, requestListStyles.backRightBtnRight]}
          onPress={() =>
            this.rejectRow(rowMap, transaction.item.fio_request_id.toString(), transaction.item.fio_request_id, transaction.item.payer_fio_address)
          }
        >
          <T style={requestListStyles.backTextWhite}>Reject</T>
        </TouchableOpacity>
      </View>
    )
  }

  render () {
    const { loading, pendingFioRequests, sentFioRequests } = this.props
    const { rejectLoading } = this.state
    const isAndroid = Platform.OS === 'android'
    return (
      <SceneWrapper>
        {(rejectLoading || loading) && <FullScreenLoader />}
        <View style={requestListStyles.scene}>
          <View style={requestListStyles.row}>
            <View style={requestListStyles.listContainer}>
              <T style={requestListStyles.listTitle}>{PENDING_TEXT}</T>
            </View>
            {!loading && !pendingFioRequests.length ? (
              <View style={requestListStyles.emptyListContainer}>
                <T style={requestListStyles.text}>{s.strings.fio_no_requests_label}</T>
              </View>
            ) : null}
            <View style={requestListStyles.container}>
              <SwipeListView
                useSectionList
                sections={this.addHeadersTransactions(pendingFioRequests)}
                renderItem={this.renderTx}
                keyExtractor={item => item.fio_request_id.toString()}
                extraData={this.state}
                renderHiddenItem={this.renderHiddenItem}
                renderSectionHeader={({ section }) => <View style={requestListStyles.rowHeaderOnly}>{this.headerRowUsingTitle(section.title)}</View>}
                rightOpenValue={-75}
                onSwipeValueChange={this.onSwipeValueChange}
                disableRightSwipe={true}
              />
            </View>
          </View>
          <View style={requestListStyles.row}>
            <View style={requestListStyles.listContainer}>
              <T style={requestListStyles.listTitle}>{SENT_TEXT}</T>
            </View>
            {!loading && !sentFioRequests.length ? (
              <View style={requestListStyles.emptyListContainer}>
                <T style={requestListStyles.text}>{s.strings.fio_no_requests_label}</T>
              </View>
            ) : null}
            <View style={requestListStyles.scrollView}>
              <View style={requestListStyles.container}>
                <View style={[isAndroid ? requestListStyles.androidTransactionsWrap : requestListStyles.transactionsWrap]}>
                  <FlatList
                    ListFooterComponent={<View style={{ height: isAndroid ? this.listFooterHeight : 0 }} />}
                    style={styles.transactionsScrollWrap}
                    data={sentFioRequests}
                    renderItem={this.renderSentTx}
                    initialNumToRender={sentFioRequests ? sentFioRequests.length : 0}
                    onEndReached={this.handleScrollEnd}
                    onEndReachedThreshold={SCROLL_THRESHOLD}
                    keyExtractor={item => item.fio_request_id.toString()}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </SceneWrapper>
    )
  }
}
