// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { Alert, FlatList, Image, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import slowlog from 'react-native-slowlog'
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import fioRequestsIcon from '../../assets/images/sidenav/fiorequests.png'
import * as Constants from '../../constants/indexConstants'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import { FioRequestRowConnector as FioRequestRow } from '../../modules/FioRequest/components/FioRequestRow'
import T from '../../modules/UI/components/FormattedText/index'
import { styles as requestListStyles } from '../../styles/scenes/FioRequestListStyle'
import styles from '../../styles/scenes/TransactionListStyle'
import { THEME } from '../../theme/variables/airbitz'
import type { FioRequest, GuiWallet } from '../../types/types'
import FullScreenLoader from '../common/FullScreenLoader'
import { SceneWrapper } from '../common/SceneWrapper'
import { SettingsHeaderRow } from '../common/SettingsHeaderRow.js'
import { showError } from '../services/AirshipInstance'

const SCROLL_THRESHOLD = 0.5

export type State = {
  loading: boolean,
  rejectLoading: boolean,
  fioRequestsPending: FioRequest[],
  fioRequestsSent: FioRequest[]
}

export type StateProps = {
  wallets: { [walletId: string]: GuiWallet },
  fioWallets: EdgeCurrencyWallet[],
  isConnected: boolean
}

export class FioRequestList extends Component<StateProps, State> {
  headerIconSize = THEME.rem(1.375)

  constructor (props: StateProps) {
    super(props)
    this.state = {
      loading: false,
      rejectLoading: false,
      fioRequestsPending: [],
      fioRequestsSent: []
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  componentDidMount = () => {
    this.getFioRequestsPending()
    this.getFioRequestsSent()
  }

  getFioRequestsPending = async () => {
    const { fioWallets } = this.props
    let fioRequestsPending = []
    this.setState({ fioRequestsPending: [], loading: true })
    if (fioWallets.length) {
      try {
        for (const wallet of fioWallets) {
          const fioPublicKey = wallet.publicWalletInfo.keys.publicKey
          const fioAddresses = await wallet.otherMethods.getFioAddresses()
          if (fioAddresses.length > 0) {
            try {
              const { requests } = await wallet.otherMethods.fioAction('getPendingFioRequests', { fioPublicKey })
              if (requests) {
                fioRequestsPending = [
                  ...fioRequestsPending,
                  ...requests.map(request => {
                    request.fioWalletId = wallet.id
                    return request
                  })
                ]
              } else {
                showError(s.strings.fio_get_requests_error)
              }
            } catch (e) {
              //
            }
          }
        }
      } catch (e) {
        showError(s.strings.fio_get_requests_error)
      }
    }

    this.setState({ fioRequestsPending: fioRequestsPending.sort((a, b) => (a.time_stamp < b.time_stamp ? -1 : 1)), loading: false })
  }

  getFioRequestsSent = async () => {
    const { fioWallets } = this.props
    let fioRequestsSent = []
    this.setState({ fioRequestsSent: [], loading: true })
    if (fioWallets.length) {
      try {
        for (const wallet of fioWallets) {
          const fioPublicKey = wallet.publicWalletInfo.keys.publicKey
          const fioAddresses = await wallet.otherMethods.getFioAddresses()
          if (fioAddresses.length > 0) {
            try {
              const { requests } = await wallet.otherMethods.fioAction('getSentFioRequests', { fioPublicKey })
              if (requests) {
                fioRequestsSent = [...fioRequestsSent, ...requests]
              } else {
                showError(s.strings.fio_get_requests_error)
              }
            } catch (e) {
              //
            }
          }
        }
      } catch (e) {
        showError(s.strings.fio_get_requests_error)
      }
    }

    this.setState({ fioRequestsSent: fioRequestsSent.sort((a, b) => (a.time_stamp > b.time_stamp ? -1 : 1)), loading: false })
  }

  removeFioPendingRequest = (requestId: string): void => {
    const { fioRequestsPending } = this.state
    this.setState({ fioRequestsPending: fioRequestsPending.filter(item => parseInt(item.fio_request_id) !== parseInt(requestId)) })
  }

  closeRow = (rowMap: { [string]: SwipeRow }, rowKey: string) => {
    if (rowMap[rowKey]) {
      rowMap[rowKey].closeRow()
    }
  }

  rejectFioRequest = async (rowMap: { [string]: SwipeRow }, rowKey: string, request: FioRequest, payerFioAddress: string) => {
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    this.setState({ rejectLoading: true })
    const { fioWallets } = this.props
    const fioWallet = fioWallets.find(wallet => wallet.id === request.fioWalletId)

    if (fioWallet) {
      try {
        const { fee } = await fioWallet.otherMethods.fioAction('getFeeForRejectFundsRequest', { payerFioAddress })
        if (fee) {
          showError(`${s.strings.fio_no_bundled_err_title}. ${s.strings.fio_no_bundled_err_msg}`)
        } else {
          await fioWallet.otherMethods.fioAction('rejectFundsRequest', { fioRequestId: request.fio_request_id, payerFioAddress })
          this.removeFioPendingRequest(request.fio_request_id)
          this.closeRow(rowMap, rowKey)
        }
      } catch (e) {
        showError(s.strings.fio_reject_request_error)
      }
    } else {
      showError(s.strings.err_no_address_title)
    }
    this.setState({ rejectLoading: false })
  }

  rejectRowConfirm = (rowMap: { [string]: SwipeRow }, rowKey: string, request: FioRequest, payerFioAddress: string) => {
    Alert.alert(
      s.strings.fio_reject_request_title,
      s.strings.fio_reject_request_message,
      [
        {
          text: s.strings.string_cancel_cap,
          onPress: () => this.closeRow(rowMap, rowKey),
          style: 'cancel'
        },
        { text: s.strings.fio_reject_request_yes, onPress: () => this.rejectFioRequest(rowMap, rowKey, request, payerFioAddress) }
      ],
      { cancelable: false }
    )
  }

  headerRowUsingTitle = (sectionObj: { section: { title: string } }) => {
    return (
      <View style={styles.singleDateArea}>
        <View style={styles.leftDateArea}>
          <T style={styles.formattedDate}>{sectionObj.section.title}</T>
        </View>
      </View>
    )
  }

  selectPendingRequest = (fioRequest: FioRequest) => {
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    const { wallets } = this.props
    for (const walletKey: string of Object.keys(wallets)) {
      if (wallets[walletKey].currencyCode.toLowerCase() === fioRequest.content.chain_code.toLowerCase()) {
        Actions[Constants.FIO_PENDING_REQUEST_DETAILS]({ selectedFioPendingRequest: fioRequest })
        return
      }
    }
    Alert.alert(
      sprintf(s.strings.err_token_not_in_wallet_title, fioRequest.content.token_code),
      sprintf(s.strings.err_token_not_in_wallet_msg, fioRequest.content.token_code),
      [{ text: s.strings.string_ok_cap }]
    )
  }

  selectSentRequest = (fioRequest: FioRequest) => {
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    Actions[Constants.FIO_SENT_REQUEST_DETAILS]({ selectedFioSentRequest: fioRequest })
  }

  pendingRequestHeaders = () => {
    const { fioRequestsPending } = this.state
    const headers: { title: string, data: FioRequest[] }[] = []
    let requestsInSection: FioRequest[] = []
    let previousTimestamp = 0
    let previousTitle = ''
    if (fioRequestsPending) {
      fioRequestsPending.forEach((fioRequest, i) => {
        if (i === 0) {
          requestsInSection = []
          previousTimestamp = fioRequest.time_stamp
        }
        if (i > 0 && intl.formatExpDate(new Date(previousTimestamp)) !== intl.formatExpDate(new Date(fioRequest.time_stamp))) {
          headers.push({ title: previousTitle, data: requestsInSection })
          requestsInSection = []
        }
        requestsInSection.push(fioRequest)
        previousTimestamp = fioRequest.time_stamp
        previousTitle = intl.formatExpDate(new Date(fioRequest.time_stamp), true)
      })
      headers.push({ title: previousTitle, data: requestsInSection })
    }

    return headers
  }

  listKeyExtractor (item: FioRequest) {
    return item.fio_request_id.toString()
  }

  renderPending = (itemObj: { item: FioRequest, index: number }) => {
    const { item: fioRequest, index } = itemObj
    const isLastOfDate =
      index + 1 === this.state.fioRequestsPending.length ||
      (index > 0 &&
        intl.formatExpDate(new Date(this.state.fioRequestsPending[index + 1].time_stamp), true) !== intl.formatExpDate(new Date(fioRequest.time_stamp), true))
    return <FioRequestRow fioRequest={fioRequest} isLastOfDate={isLastOfDate} onSelect={this.selectPendingRequest} />
  }

  renderSent = (itemObj: { item: FioRequest, index: number }) => {
    const { item: fioRequest, index } = itemObj
    const isHeaderRow =
      index === 0 ||
      (index > 0 &&
        intl.formatExpDate(new Date(this.state.fioRequestsSent[index - 1].time_stamp), true) !== intl.formatExpDate(new Date(fioRequest.time_stamp), true))
    const isLastOfDate =
      index + 1 === this.state.fioRequestsSent.length ||
      (index > 0 &&
        intl.formatExpDate(new Date(this.state.fioRequestsSent[index + 1].time_stamp), true) !== intl.formatExpDate(new Date(fioRequest.time_stamp), true))
    return <FioRequestRow fioRequest={fioRequest} onSelect={this.selectSentRequest} isSent={true} isHeaderRow={isHeaderRow} isLastOfDate={isLastOfDate} />
  }

  renderHiddenItem = (rowObj: { item: FioRequest }, rowMap: { [string]: SwipeRow }) => {
    return (
      <View style={requestListStyles.rowBack}>
        <TouchableOpacity
          style={[requestListStyles.backRightBtn, requestListStyles.backRightBtnRight]}
          onPress={_ => this.rejectRowConfirm(rowMap, rowObj.item.fio_request_id.toString(), rowObj.item, rowObj.item.payer_fio_address)}
        >
          <T style={requestListStyles.backTextWhite}>{s.strings.swap_terms_reject_button}</T>
        </TouchableOpacity>
      </View>
    )
  }

  render () {
    const { loading, rejectLoading, fioRequestsPending, fioRequestsSent } = this.state

    return (
      <SceneWrapper>
        {(rejectLoading || loading) && <FullScreenLoader />}
        <View style={requestListStyles.scene}>
          <View style={requestListStyles.row}>
            <SettingsHeaderRow icon={<Image source={fioRequestsIcon} style={requestListStyles.iconImage} />} text={s.strings.fio_pending_requests} />
            {!loading && !fioRequestsPending.length ? (
              <View style={requestListStyles.emptyListContainer}>
                <T style={requestListStyles.text}>{s.strings.fio_no_requests_label}</T>
              </View>
            ) : null}
            <View style={requestListStyles.container}>
              <SwipeListView
                useSectionList
                sections={this.pendingRequestHeaders()}
                renderItem={this.renderPending}
                keyExtractor={this.listKeyExtractor}
                renderHiddenItem={this.renderHiddenItem}
                renderSectionHeader={this.headerRowUsingTitle}
                rightOpenValue={requestListStyles.swipeRow.right}
                disableRightSwipe={true}
              />
            </View>
          </View>
          <View style={requestListStyles.row}>
            <SettingsHeaderRow icon={<IonIcon name="ios-send" color={THEME.COLORS.WHITE} size={this.headerIconSize} />} text={s.strings.fio_sent_requests} />
            {!loading && !fioRequestsSent.length ? (
              <View style={requestListStyles.emptyListContainer}>
                <T style={requestListStyles.text}>{s.strings.fio_no_requests_label}</T>
              </View>
            ) : null}
            <View style={requestListStyles.scrollView}>
              <View style={requestListStyles.container}>
                <View style={requestListStyles.requestsWrap}>
                  <FlatList
                    style={styles.transactionsScrollWrap}
                    data={fioRequestsSent}
                    renderItem={this.renderSent}
                    initialNumToRender={fioRequestsSent ? fioRequestsSent.length : 0}
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
