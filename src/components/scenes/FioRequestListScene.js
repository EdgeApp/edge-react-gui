// @flow

import { bns } from 'biggystring'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view'
import { sprintf } from 'sprintf-js'

import { FIO_ADDRESS_SETTINGS, FIO_SENT_REQUEST_DETAILS, SEND, TRANSACTION_DETAILS } from '../../constants/SceneKeys.js'
import { formatDate } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { addToFioAddressCache, cancelFioRequest, FIO_NO_BUNDLED_ERR_CODE } from '../../modules/FioAddress/util'
import { FioRequestRowConnector as FioRequestRow } from '../../modules/FioRequest/components/FioRequestRow'
import { isRejectedFioRequest, isSentFioRequest } from '../../modules/FioRequest/util'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { type RootState } from '../../types/reduxTypes'
import { Actions } from '../../types/routerTypes.js'
import type { FioRequest, GuiWallet } from '../../types/types'
import FullScreenLoader from '../common/FullScreenLoader'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import type { WalletListResult } from '../modals/WalletListModal'
import { WalletListModal } from '../modals/WalletListModal'
import { Airship, showError, showToast } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { HIDDEN_MENU_BUTTONS_WIDTH, HiddenMenuButtons } from '../themed/HiddenMenuButtons'
import { SceneHeader } from '../themed/SceneHeader.js'

const SCROLL_THRESHOLD = 0.5

type LocalState = {
  loadingPending: boolean,
  loadingSent: boolean,
  fullScreenLoader: boolean,
  addressCachedUpdated: boolean,
  fioRequestsPending: FioRequest[],
  fioRequestsSent: FioRequest[]
}

type StateProps = {
  state: RootState,
  account: EdgeAccount,
  wallets: { [walletId: string]: GuiWallet },
  currencyWallets: { [walletId: string]: EdgeCurrencyWallet },
  fioWallets: EdgeCurrencyWallet[],
  isConnected: boolean
}

type DispatchProps = {
  onSelectWallet: (walletId: string, currencyCode: string) => void
}

type OwnProps = {
  navigation: any
}

type Props = OwnProps & StateProps & ThemeProps & DispatchProps

class FioRequestList extends React.Component<Props, LocalState> {
  willFocusSubscription: { remove: () => void } | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      loadingPending: true,
      loadingSent: true,
      addressCachedUpdated: false,
      fullScreenLoader: false,
      fioRequestsPending: [],
      fioRequestsSent: []
    }
  }

  componentDidMount = () => {
    this.willFocusSubscription = this.props.navigation.addListener('didFocus', () => {
      this.getFioRequestsPending()
      this.getFioRequestsSent()
    })
  }

  componentWillUnmount(): void {
    this.willFocusSubscription && this.willFocusSubscription.remove()
  }

  componentDidUpdate = () => {
    if (this.state.addressCachedUpdated || this.state.loadingPending || this.state.loadingSent) return

    const { fioRequestsPending, fioRequestsSent } = this.state
    const addressArray = []
    for (const request of fioRequestsPending) {
      addressArray.push(request.payee_fio_address)
      addressArray.push(request.payer_fio_address)
    }
    for (const request of fioRequestsSent) {
      addressArray.push(request.payee_fio_address)
      addressArray.push(request.payer_fio_address)
    }

    addToFioAddressCache(this.props.account, addressArray)
    // eslint-disable-next-line react/no-did-update-set-state
    this.setState({ addressCachedUpdated: true })
  }

  getFioRequestsPending = async () => {
    const { fioWallets = [] } = this.props
    let fioRequestsPending = []
    if (fioWallets.length) {
      try {
        for (const wallet of fioWallets) {
          const fioPublicKey = wallet.publicWalletInfo.keys.publicKey
          const fioAddresses = await wallet.otherMethods.getFioAddresses()
          const approveNeededFioRequests = await wallet.otherMethods.getApproveNeededFioRequests()
          if (fioAddresses.length > 0) {
            try {
              const { requests } = await wallet.otherMethods.fioAction('getPendingFioRequests', { fioPublicKey })
              if (requests) {
                fioRequestsPending = [
                  ...fioRequestsPending,
                  ...requests
                    .filter(request => !approveNeededFioRequests[request.fio_request_id])
                    .map(request => {
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

    this.setState({ fioRequestsPending: fioRequestsPending.sort((a, b) => (a.time_stamp < b.time_stamp ? 1 : -1)), loadingPending: false })
  }

  getFioRequestsSent = async () => {
    const { fioWallets = [] } = this.props
    let fioRequestsSent = []
    if (fioWallets.length) {
      try {
        for (const wallet of fioWallets) {
          const fioPublicKey = wallet.publicWalletInfo.keys.publicKey
          const fioAddresses = await wallet.otherMethods.getFioAddresses()
          if (fioAddresses.length > 0) {
            try {
              const { requests } = await wallet.otherMethods.fioAction('getSentFioRequests', { fioPublicKey })
              if (requests) {
                fioRequestsSent = [
                  ...fioRequestsSent,
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

    this.setState({ fioRequestsSent: fioRequestsSent.sort((a, b) => (a.time_stamp > b.time_stamp ? -1 : 1)), loadingSent: false })
  }

  showRenewAlert = async (fioWallet: EdgeCurrencyWallet, fioAddressName: string) => {
    const answer = await Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.fio_no_bundled_err_msg}
        message={s.strings.fio_no_bundled_renew_err_msg}
        buttons={{
          ok: { label: s.strings.title_fio_renew_address },
          cancel: { label: s.strings.string_cancel_cap, type: 'secondary' }
        }}
      />
    ))
    if (answer === 'ok') {
      return Actions.push(FIO_ADDRESS_SETTINGS, {
        showRenew: true,
        fioWallet,
        fioAddressName
      })
    }
  }

  removeFioPendingRequest = (requestId: string): void => {
    const { fioRequestsPending } = this.state
    this.setState({ fioRequestsPending: fioRequestsPending.filter(item => parseInt(item.fio_request_id) !== parseInt(requestId)) })
  }

  removeFioSentRequest = (requestId: string): void => {
    const { fioRequestsSent } = this.state
    this.setState({ fioRequestsSent: fioRequestsSent.filter(item => parseInt(item.fio_request_id) !== parseInt(requestId)) })
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
    this.setState({ fullScreenLoader: true })
    const { fioWallets = [] } = this.props
    const fioWallet = fioWallets.find(wallet => wallet.id === request.fioWalletId)

    if (fioWallet) {
      try {
        const { fee } = await fioWallet.otherMethods.fioAction('getFeeForRejectFundsRequest', { payerFioAddress })
        if (fee) {
          this.setState({ fullScreenLoader: false })
          this.showRenewAlert(fioWallet, payerFioAddress)
        } else {
          await fioWallet.otherMethods.fioAction('rejectFundsRequest', { fioRequestId: request.fio_request_id, payerFioAddress })
          this.removeFioPendingRequest(request.fio_request_id)
          this.closeRow(rowMap, rowKey)
          showToast(s.strings.fio_reject_status)
        }
      } catch (e) {
        showError(s.strings.fio_reject_request_error)
      }
    } else {
      showError(s.strings.err_no_address_title)
    }
    this.setState({ fullScreenLoader: false })
  }

  cancelFioRequest = async (rowMap: { [string]: SwipeRow }, rowKey: string, request: FioRequest, payeeFioAddress: string) => {
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    this.setState({ fullScreenLoader: true })
    const { fioWallets = [] } = this.props
    const fioWallet = fioWallets.find(wallet => wallet.id === request.fioWalletId)

    if (fioWallet) {
      try {
        await cancelFioRequest(fioWallet, parseInt(request.fio_request_id), payeeFioAddress)
        this.removeFioSentRequest(request.fio_request_id)
        this.closeRow(rowMap, rowKey)
        showToast(s.strings.fio_cancel_status)
      } catch (e) {
        this.setState({ fullScreenLoader: false })
        if (e.code === FIO_NO_BUNDLED_ERR_CODE) {
          this.showRenewAlert(fioWallet, payeeFioAddress)
        } else {
          showError(e)
        }
      }
    } else {
      showError(s.strings.fio_wallet_missing_for_fio_request)
    }
    this.setState({ fullScreenLoader: false })
  }

  rejectRowConfirm = async (rowMap: { [string]: SwipeRow }, rowKey: string, request: FioRequest, payerFioAddress: string) => {
    const answer = await Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.fio_reject_request_title}
        message={s.strings.fio_reject_request_message}
        buttons={{
          yes: { label: s.strings.yes },
          cancel: { label: s.strings.string_cancel_cap, type: 'secondary' }
        }}
      />
    ))
    if (answer === 'yes') {
      return this.rejectFioRequest(rowMap, rowKey, request, payerFioAddress)
    }
    if (answer === 'cancel') {
      return this.closeRow(rowMap, rowKey)
    }
  }

  cancelRowConfirm = async (rowMap: { [string]: SwipeRow }, rowKey: string, request: FioRequest, payeeFioAddress: string) => {
    const answer = await Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.fio_reject_request_title}
        message={s.strings.fio_cancel_request_message}
        buttons={{
          yes: { label: s.strings.yes },
          no: { label: s.strings.no, type: 'secondary' }
        }}
      />
    ))
    if (answer === 'yes') {
      return this.cancelFioRequest(rowMap, rowKey, request, payeeFioAddress)
    }
    if (answer === 'no') {
      return this.closeRow(rowMap, rowKey)
    }
  }

  headerRowUsingTitle = (sectionObj: { section: { title: string } }) => {
    const styles = getStyles(this.props.theme)
    if (!sectionObj.section.title) return null
    return (
      <Gradient style={styles.singleDateArea}>
        <EdgeText style={styles.formattedDate}>{sectionObj.section.title}</EdgeText>
      </Gradient>
    )
  }

  selectPendingRequest = (fioRequest: FioRequest) => {
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    const { wallets = {}, onSelectWallet } = this.props
    const availableWallets: Array<{ id: string, currencyCode: string }> = []
    for (const walletKey: string of Object.keys(wallets)) {
      if (wallets[walletKey].currencyCode.toUpperCase() === fioRequest.content.token_code.toUpperCase()) {
        availableWallets.push({ id: wallets[walletKey].id, currencyCode: wallets[walletKey].currencyCode })
        if (availableWallets.length > 1) {
          this.renderDropUp(fioRequest)
          return
        }
      }
      if (
        wallets[walletKey].currencyCode.toUpperCase() === fioRequest.content.chain_code.toUpperCase() &&
        wallets[walletKey].enabledTokens.indexOf(fioRequest.content.token_code.toUpperCase()) > -1
      ) {
        availableWallets.push({ id: wallets[walletKey].id, currencyCode: fioRequest.content.token_code.toUpperCase() })
        if (availableWallets.length > 1) {
          this.renderDropUp(fioRequest)
          return
        }
      }
    }
    if (availableWallets.length) {
      onSelectWallet(availableWallets[0].id, availableWallets[0].currencyCode)
      this.sendCrypto(fioRequest, availableWallets[0].id, availableWallets[0].currencyCode)
      return
    }
    Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={sprintf(s.strings.err_token_not_in_wallet_title, fioRequest.content.token_code.toUpperCase())}
        message={sprintf(s.strings.err_token_not_in_wallet_msg, fioRequest.content.token_code.toUpperCase())}
        buttons={{
          ok: { label: s.strings.string_ok_cap }
        }}
      />
    ))
  }

  renderDropUp = async (selectedFioPendingRequest: FioRequest) => {
    const { onSelectWallet } = this.props
    const { content } = selectedFioPendingRequest
    const chainCode = content.chain_code.toUpperCase()
    const tokenCode = content.token_code.toUpperCase()
    const allowedFullCurrencyCode = chainCode !== tokenCode && tokenCode && tokenCode !== '' ? [`${chainCode}-${tokenCode}`] : [chainCode]

    const { walletId, currencyCode }: WalletListResult = await Airship.show(bridge => (
      <WalletListModal bridge={bridge} headerTitle={s.strings.fio_src_wallet} allowedCurrencyCodes={allowedFullCurrencyCode} />
    ))
    if (walletId && currencyCode) {
      onSelectWallet(walletId, currencyCode)
      this.sendCrypto(selectedFioPendingRequest, walletId, currencyCode)
    }
  }

  sendCrypto = async (pendingRequest: FioRequest, walletId: string, selectedCurrencyCode: string) => {
    const { fioWallets = [], currencyWallets, state } = this.props
    const fioWalletByAddress = fioWallets.find(wallet => wallet.id === pendingRequest.fioWalletId) || null
    if (!fioWalletByAddress) return showError(s.strings.fio_wallet_missing_for_fio_address)
    const exchangeDenomination = getExchangeDenomination(state, pendingRequest.content.token_code.toUpperCase())
    let nativeAmount = bns.mul(pendingRequest.content.amount, exchangeDenomination.multiplier)
    nativeAmount = bns.toFixed(nativeAmount, 0, 0)
    const currencyCode = pendingRequest.content.token_code.toUpperCase()

    const parsedUri = await currencyWallets[walletId].parseUri(pendingRequest.content.payee_public_address, currencyCode)
    const guiMakeSpendInfo = {
      fioPendingRequest: pendingRequest,
      fioAddress: pendingRequest.payee_fio_address,
      publicAddress: parsedUri.legacyAddress || parsedUri.publicAddress,
      nativeAmount,
      currencyCode,
      metadata: parsedUri.metadata,
      uniqueIdentifier: parsedUri.uniqueIdentifier,
      lockInputs: true,
      beforeTransaction: async () => {
        try {
          const getFeeResult = await fioWalletByAddress.otherMethods.fioAction('getFee', {
            endPoint: 'record_obt_data',
            fioAddress: pendingRequest.payer_fio_address
          })
          if (getFeeResult.fee) {
            showError(s.strings.fio_no_bundled_err_msg)
            throw new Error(s.strings.fio_no_bundled_err_msg)
          }
        } catch (e) {
          showError(s.strings.fio_get_fee_err_msg)
          throw e
        }
      },
      onDone: (err, edgeTransaction) => {
        if (!err) {
          this.getFioRequestsPending()
          Actions.replace(TRANSACTION_DETAILS, { edgeTransaction })
        }
      }
    }

    Actions.push(SEND, {
      guiMakeSpendInfo,
      selectedWalletId: walletId,
      selectedCurrencyCode
    })
  }

  selectSentRequest = (fioRequest: FioRequest) => {
    if (!this.props.isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    Actions.push(FIO_SENT_REQUEST_DETAILS, {
      selectedFioSentRequest: fioRequest
    })
  }

  pendingRequestHeaders = () => {
    const { fioRequestsPending } = this.state
    const headers: Array<{ title: string, data: FioRequest[] }> = []
    let requestsInSection: FioRequest[] = []
    let previousTimestamp = 0
    let previousTitle = ''
    if (fioRequestsPending) {
      fioRequestsPending.forEach((fioRequest, i) => {
        if (i === 0) {
          requestsInSection = []
          previousTimestamp = fioRequest.time_stamp
        }
        if (i > 0 && formatDate(new Date(previousTimestamp)) !== formatDate(new Date(fioRequest.time_stamp))) {
          headers.push({ title: previousTitle, data: requestsInSection })
          requestsInSection = []
        }
        requestsInSection.push(fioRequest)
        previousTimestamp = fioRequest.time_stamp
        previousTitle = formatDate(new Date(fioRequest.time_stamp), true)
      })
      headers.push({ title: previousTitle, data: requestsInSection })
    }

    return headers
  }

  sentRequestHeaders = () => {
    const { fioRequestsSent } = this.state
    const headers: Array<{ title: string, data: FioRequest[] }> = []
    let requestsInSection: FioRequest[] = []
    let previousTimestamp = 0
    let previousTitle = ''
    if (fioRequestsSent) {
      fioRequestsSent.forEach((fioRequest, i) => {
        if (i === 0) {
          requestsInSection = []
          previousTimestamp = fioRequest.time_stamp
        }
        if (i > 0 && formatDate(new Date(previousTimestamp)) !== formatDate(new Date(fioRequest.time_stamp))) {
          headers.push({ title: previousTitle, data: requestsInSection })
          requestsInSection = []
        }
        requestsInSection.push(fioRequest)
        previousTimestamp = fioRequest.time_stamp
        previousTitle = formatDate(new Date(fioRequest.time_stamp), true)
      })
      headers.push({ title: previousTitle, data: requestsInSection })
    }
    return headers
  }

  listKeyExtractor(item: FioRequest) {
    return item.fio_request_id.toString()
  }

  renderPending = (itemObj: { item: FioRequest }) => {
    const { item: fioRequest } = itemObj
    return <FioRequestRow fioRequest={fioRequest} onSelect={this.selectPendingRequest} />
  }

  renderSent = (itemObj: { item: FioRequest }) => {
    const { item: fioRequest } = itemObj
    return <FioRequestRow fioRequest={fioRequest} onSelect={this.selectSentRequest} isSent />
  }

  renderHiddenItem = (rowObj: { item: FioRequest }, rowMap: { [string]: SwipeRow }) => {
    return (
      <HiddenMenuButtons
        rightSwipable={{
          label: s.strings.swap_terms_reject_button,
          color: 'danger',
          onPress: _ => this.rejectRowConfirm(rowMap, rowObj.item.fio_request_id.toString(), rowObj.item, rowObj.item.payer_fio_address)
        }}
      />
    )
  }

  renderSentHiddenItem = (rowObj: { item: FioRequest }, rowMap: { [string]: SwipeRow }) => {
    if (isSentFioRequest(rowObj.item.status) || isRejectedFioRequest(rowObj.item.status)) {
      return null
    }
    return (
      <HiddenMenuButtons
        rightSwipable={{
          label: s.strings.string_cancel_cap,
          color: 'danger',
          onPress: _ => this.cancelRowConfirm(rowMap, rowObj.item.fio_request_id.toString(), rowObj.item, rowObj.item.payee_fio_address)
        }}
      />
    )
  }

  render() {
    const { theme } = this.props
    const { loadingPending, loadingSent, fullScreenLoader, fioRequestsPending, fioRequestsSent } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="header">
        {fullScreenLoader && <FullScreenLoader indicatorStyles={styles.fullScreenLoader} />}
        <View style={styles.scene}>
          <View style={styles.row}>
            <SceneHeader title={s.strings.fio_pending_requests} underline />
            {!loadingPending && !fioRequestsPending.length ? <EdgeText style={styles.emptyListText}>{s.strings.fio_no_requests_label}</EdgeText> : null}
            <View style={styles.container}>
              {loadingPending && <ActivityIndicator color={theme.iconTappable} style={styles.loading} size="small" />}
              <SwipeListView
                useSectionList
                sections={this.pendingRequestHeaders()}
                renderItem={this.renderPending}
                keyExtractor={this.listKeyExtractor}
                renderHiddenItem={this.renderHiddenItem}
                renderSectionHeader={this.headerRowUsingTitle}
                rightOpenValue={theme.rem(-HIDDEN_MENU_BUTTONS_WIDTH)}
                disableRightSwipe
              />
            </View>
          </View>
          <View style={styles.row}>
            <SceneHeader title={s.strings.fio_sent_requests} underline withTopMargin />
            {!loadingSent && !fioRequestsSent.length ? <EdgeText style={styles.emptyListText}>{s.strings.fio_no_requests_label}</EdgeText> : null}
            <View style={styles.container}>
              {loadingSent && <ActivityIndicator color={theme.iconTappable} style={styles.loading} size="small" />}
              <SwipeListView
                initialNumToRender={fioRequestsSent ? fioRequestsSent.length : 0}
                onEndReachedThreshold={SCROLL_THRESHOLD}
                useSectionList
                sections={this.sentRequestHeaders()}
                renderItem={this.renderSent}
                keyExtractor={item => item.fio_request_id.toString()}
                renderHiddenItem={this.renderSentHiddenItem}
                renderSectionHeader={this.headerRowUsingTitle}
                rightOpenValue={theme.rem(-HIDDEN_MENU_BUTTONS_WIDTH)}
                disableRightSwipe
              />
            </View>
          </View>
        </View>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  scene: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  },
  container: {
    flex: 1,
    alignItems: 'stretch'
  },
  row: {
    height: '50%'
  },
  emptyListText: {
    fontSize: theme.rem(0.75),
    fontWeight: 'normal',
    paddingVertical: theme.rem(1.75),
    paddingHorizontal: theme.rem(1.25),
    opacity: 0.5
  },
  fullScreenLoader: {
    paddingBottom: theme.rem(3.5)
  },
  loading: {
    flex: 1,
    marginTop: theme.rem(2.5),
    alignSelf: 'center'
  },
  singleDateArea: {
    paddingVertical: theme.rem(0.5),
    paddingLeft: theme.rem(1),
    paddingRight: theme.rem(1.5)
  },
  formattedDate: {
    color: theme.primaryText,
    fontSize: theme.rem(0.75)
  }
}))

export const FioRequestListScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    state,
    account: state.core.account,
    wallets: state.ui.wallets.byId,
    fioWallets: state.ui.wallets.fioWallets,
    currencyWallets: state.core.account.currencyWallets,
    isConnected: state.network.isConnected
  }),
  dispatch => ({
    onSelectWallet(walletId: string, currencyCode: string) {
      dispatch({
        type: 'UI/WALLETS/SELECT_WALLET',
        data: { currencyCode, walletId }
      })
    }
  })
)(withTheme(FioRequestList))
