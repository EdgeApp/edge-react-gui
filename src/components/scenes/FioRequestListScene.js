// @flow

import React, { Component } from 'react'
import { Alert, Animated, FlatList, Image, Platform, TouchableHighlight, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import slowlog from 'react-native-slowlog'

import checkedIcon from '../../assets/images/createWallet/check_icon_lg.png'
import invalidIcon from '../../assets/images/createWallet/invalid_icon.png'
import fioRequestsIcon from '../../assets/images/fio/fio_sent_request.png'
import * as Constants from '../../constants/indexConstants'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import FullScreenLoader from '../../modules/FioRequest/components/FullScreenLoader'
import SwipeListView from '../../modules/FioRequest/components/SwipeListView'
import { isRejectedFioRequest, isSentFioRequest } from '../../modules/FioRequest/util'
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
  underlayColor = '#AAA'
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

  UNSAFE_componentWillReceiveProps (nextProps: Props) {}

  handleScrollEnd = () => {}

  convertCurrencyStringFromCurrencyCode (code: string) {
    switch (code) {
      case 'BTC':
        return 'Bitcoin'
      case 'BCH':
        return 'Bitcoin Cash'
      case 'ETH':
        return 'Ethereum'
      case 'LTC':
        return 'Litecoin'
      case 'DASH':
        return 'Dash'
      default:
        return ''
    }
  }

  sortDescending = (data: any[]) => {
    if (data !== undefined) {
      if (data.length > 0) {
        data.sort((a, b) => (a.time_stamp > b.time_stamp ? -1 : 1))
      }
    }
    return data
  }

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

  currencyField = (symbol: string, amount: string, styles: any) => {
    return (
      <View>
        <T style={[requestListStyles.currency, styles]}>
          {symbol} {amount}
        </T>
      </View>
    )
  }

  fiatAmount = (currencyCode: string, amount: string) => {
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

  fiatField = (currencyCode: string, fiatSymbol: string, amount: string, styles: any) => {
    return (
      <View>
        <T style={[requestListStyles.fiat, styles]}>
          {fiatSymbol} {this.fiatAmount(currencyCode, amount)}
        </T>
      </View>
    )
  }

  requestedField = (coinType: string) => {
    return (
      <View>
        <T style={requestListStyles.title}>
          {s.strings.title_fio_requested} {this.convertCurrencyStringFromCurrencyCode(coinType)}
        </T>
      </View>
    )
  }

  sentField = (sentTo: string) => {
    return (
      <View>
        <T style={requestListStyles.title}>{sentTo}</T>
      </View>
    )
  }

  statusField = (status: string) => {
    if (isRejectedFioRequest(status)) {
      return <T style={requestListStyles.rejected}>{s.strings.fio_reject_status}</T>
    }
    if (isSentFioRequest(status)) {
      return <T style={requestListStyles.received}>{s.strings.fragment_transaction_list_receive_prefix}</T>
    }

    return null
  }

  requestedTimeAndMemo = (time: Date, memo: string) => {
    const maxLength = 40
    const memoStr = memo && memo.length > maxLength ? memo.slice(0, maxLength) + '... ' : memo
    return (
      <View>
        <T style={requestListStyles.text}>
          {this.getFormattedTime(time)}
          {memoStr ? ` - ${memoStr}` : ''}
        </T>
      </View>
    )
  }

  requestedIcon = (status?: string = '') => {
    let icon
    if (isRejectedFioRequest(status)) {
      icon = <Image style={requestListStyles.transactionStatusLogo} source={invalidIcon} />
    }
    if (isSentFioRequest(status)) {
      icon = <Image style={requestListStyles.transactionStatusLogo} source={checkedIcon} />
    }
    return (
      <View>
        <Image style={styles.transactionLogo} source={fioRequestsIcon} />
        {icon}
      </View>
    )
  }

  dateOnly = (date: Date) => {
    return date.getFullYear() + date.getMonth() + date.getDate()
  }

  getFormattedTime = (date: Date) => {
    let hh = date.getHours()
    let mm = date.getMinutes()
    const symbol = hh >= 12 ? 'PM' : 'AM'

    if (hh > 12) {
      hh = hh % 12
    }
    // These lines ensure you have two-digits
    if (mm < 10) {
      mm = '0' + mm
    }

    // This formats your string to HH:MM:SS
    const t = hh + ':' + mm + ' ' + symbol

    return t
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

  headerRow = (headerDate: Date) => {
    return (
      <View style={requestListStyles.rowContainer}>
        <T style={requestListStyles.rowTitle}>{intl.formatExpDate(headerDate, true)}</T>
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

  addHeadersTransactions = (txs: Array<Object>) => {
    let i = 0
    const newArr: Array<Object> = []
    let tempArr: Array<Object> = []
    let previousTimestamp = 0
    let previousTitle = ''
    if (txs) {
      txs.forEach(transaction => {
        if (i === 0) {
          tempArr = []
          previousTimestamp = transaction.time_stamp
        }
        if (i > 0 && this.dateOnly(new Date(previousTimestamp)) !== this.dateOnly(new Date(transaction.time_stamp))) {
          newArr.push({ title: previousTitle, data: tempArr })
          tempArr = []
        }
        tempArr.push(transaction)
        previousTimestamp = transaction.time_stamp
        previousTitle = this.headerTitle(new Date(transaction.time_stamp))
        i++
      })
      newArr.push({ title: previousTitle, data: tempArr })
    }
    return newArr
  }

  // this can be moved into it's own component if it makes sense
  renderTx = (transaction: Object) => {
    return (
      <TouchableHighlight onPress={() => this.selectRequest(transaction.item)} style={requestListStyles.rowFront} underlayColor={this.underlayColor}>
        <View key={transaction.item.fio_request_id.toString()}>
          <View style={requestListStyles.rowItem}>
            <View style={requestListStyles.columnItem}>
              <View>{this.requestedIcon()}</View>
              <View>
                <View>{this.requestedField(transaction.item.content.token_code)}</View>
                <View>{this.requestedTimeAndMemo(new Date(transaction.item.time_stamp), transaction.item.content.memo)}</View>
              </View>
            </View>
            <View style={requestListStyles.columnCurrency}>
              <View>{this.currencyField(transaction.item.content.token_code, transaction.item.content.amount)}</View>
              <View>{this.fiatField(transaction.item.content.token_code, this.props.fiatSymbol, transaction.item.content.amount)}</View>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    )
  }

  renderSentTx = (transaction: Object) => {
    return (
      <TouchableHighlight
        onPress={() => this.selectSentRequest(transaction.item)}
        style={
          transaction.index === 0 ||
          (transaction.index > 0 &&
            this.dateOnly(new Date(this.props.sentFioRequests[transaction.index - 1].time_stamp)) !== this.dateOnly(new Date(transaction.item.time_stamp)))
            ? requestListStyles.rowFrontWithHeader
            : requestListStyles.rowFront
        }
        underlayColor={this.underlayColor}
      >
        <View key={transaction.item.fio_request_id.toString()}>
          {transaction.index === 0 && <View>{this.headerRow(new Date(transaction.item.time_stamp))}</View>}
          {transaction.index > 0 &&
            this.dateOnly(new Date(this.props.sentFioRequests[transaction.index - 1].time_stamp)) !== this.dateOnly(new Date(transaction.item.time_stamp)) && (
            <View>{this.headerRow(new Date(transaction.item.time_stamp))}</View>
          )}
          <View style={requestListStyles.rowItem}>
            <View style={requestListStyles.columnItem}>
              <View>{this.requestedIcon(transaction.item.status)}</View>
              <View>
                <View>{this.sentField(transaction.item.payer_fio_address)}</View>
                <View>{this.requestedTimeAndMemo(new Date(transaction.item.time_stamp), transaction.item.content.memo)}</View>
              </View>
            </View>
            <View style={requestListStyles.columnCurrency}>
              <View>{this.currencyField(transaction.item.token_code, transaction.item.content.amount)}</View>
              <View>{this.fiatField(transaction.item.content.token_code, this.props.fiatSymbol, transaction.item.content.amount)}</View>
              <View>{this.statusField(transaction.item.status)}</View>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    )
  }

  render () {
    const sentTxs = this.sortDescending(this.props.sentFioRequests)
    const isAndroid = Platform.OS === 'android'
    const { rejectLoading } = this.state
    const { loading } = this.props
    return (
      <SceneWrapper>
        {(rejectLoading || loading) && <FullScreenLoader />}
        <View style={requestListStyles.scene}>
          <View style={requestListStyles.row}>
            <View style={requestListStyles.listContainer}>
              <T style={requestListStyles.listTitle}>{PENDING_TEXT}</T>
            </View>
            <View style={requestListStyles.container}>
              <SwipeListView
                useSectionList
                sections={this.addHeadersTransactions(this.props.pendingFioRequests)}
                renderItem={this.renderTx}
                keyExtractor={item => item.fio_request_id.toString()}
                extraData={this.state}
                renderHiddenItem={(transaction, rowMap) => (
                  <View style={requestListStyles.rowBack}>
                    <TouchableOpacity
                      style={[requestListStyles.backRightBtn, requestListStyles.backRightBtnRight]}
                      onPress={_ =>
                        this.rejectRow(rowMap, transaction.item.fio_request_id.toString(), transaction.item.fio_request_id, transaction.item.payer_fio_address)
                      }
                    >
                      <T style={requestListStyles.backTextWhite}>Reject</T>
                    </TouchableOpacity>
                  </View>
                )}
                renderSectionHeader={({ section }) => <View style={requestListStyles.rowHeaderOnly}>{this.headerRowUsingTitle(section.title)}</View>}
                leftOpenValue={0}
                rightOpenValue={-75}
                onSwipeValueChange={this.onSwipeValueChange}
                closeOnRowBeginSwipe={false}
                closeOnScroll={true}
                closeOnRowPress={true}
                closeOnRowOpen={true}
                disableLeftSwipe={false}
                disableRightSwipe={true}
                recalculateHiddenLayout={false}
                previewFirstRow={false}
                directionalDistanceChangeThreshold={2}
                swipeToOpenPercent={50}
                swipeToOpenVelocityContribution={0}
                swipeToClosePercent={50}
              />
            </View>
          </View>
          <View style={requestListStyles.row}>
            <View style={requestListStyles.listContainer}>
              <T style={requestListStyles.listTitle}>{SENT_TEXT}</T>
            </View>
            <View style={requestListStyles.scrollView}>
              <View style={requestListStyles.container}>
                <View style={[isAndroid ? requestListStyles.androidTransactionsWrap : requestListStyles.transactionsWrap]}>
                  <FlatList
                    ListFooterComponent={<View style={{ height: isAndroid ? this.listFooterHeight : 0 }} />}
                    style={styles.transactionsScrollWrap}
                    data={sentTxs}
                    renderItem={this.renderSentTx}
                    initialNumToRender={sentTxs ? sentTxs.length : 0}
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
