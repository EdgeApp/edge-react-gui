import { mul, toFixed } from 'biggystring'
import { EdgeAccount, EdgeCurrencyWallet, EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, SectionList, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { refreshAllFioAddresses } from '../../../actions/FioAddressActions'
import { SPECIAL_CURRENCY_INFO } from '../../../constants/WalletAndCurrencyConstants'
import { formatDate, SHORT_DATE_FMT } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import { getExchangeDenominationFromState } from '../../../selectors/DenominationSelectors'
import { connect } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { FioAddress, FioRequest } from '../../../types/types'
import { getTokenId } from '../../../util/CurrencyInfoHelpers'
import {
  addToFioAddressCache,
  cancelFioRequest,
  convertFIOToEdgeCodes,
  FIO_FAKE_RECORD_OBT_DATA_REQUEST,
  FIO_NO_BUNDLED_ERR_CODE,
  fioMakeSpend,
  fioSignAndBroadcast
} from '../../../util/FioAddressUtils'
import { tokenIdsToCurrencyCodes } from '../../../util/utils'
import { SceneWrapper } from '../../common/SceneWrapper'
import { ButtonsModal } from '../../modals/ButtonsModal'
import { WalletListModal, WalletListResult } from '../../modals/WalletListModal'
import { FullScreenLoader } from '../../progress-indicators/FullScreenLoader'
import { Airship, showError, showToast } from '../../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { FioRequestRow } from '../../themed/FioRequestRow'
import { SceneHeader } from '../../themed/SceneHeader'
import { SectionHeader } from '../../themed/TransactionListComponents'

const SCROLL_THRESHOLD = 0.5

interface LocalState {
  loadingPending: boolean
  loadingSent: boolean
  fullScreenLoader: boolean
  addressCachedUpdated: boolean
  fioRequestsPending: FioRequest[]
  fioRequestsSent: FioRequest[]
  prevPendingAmount: number
  prevSentAmount: number
  pendingRequestPaging: { [key: string]: number }
  sentRequestPaging: { [key: string]: number }
}

interface StateProps {
  account: EdgeAccount
  fioAddresses: FioAddress[]
  currencyWallets: { [walletId: string]: EdgeCurrencyWallet }
  fioWallets: EdgeCurrencyWallet[]
  isConnected: boolean
}

interface DispatchProps {
  onSelectWallet: (walletId: string, currencyCode: string) => void
  refreshAllFioAddresses: () => Promise<void>
  getExchangeDenomination: (pluginId: string, currencyCode: string) => EdgeDenomination
}

interface OwnProps extends EdgeSceneProps<'fioRequestList'> {}

type Props = OwnProps & StateProps & ThemeProps & DispatchProps

const ITEMS_PER_PAGE = 50

class FioRequestList extends React.Component<Props, LocalState> {
  willFocusSubscription: (() => void) | null = null

  constructor(props: Props) {
    super(props)
    this.props.refreshAllFioAddresses().catch(err => showError(err))
    this.state = {
      loadingPending: true,
      loadingSent: true,
      addressCachedUpdated: false,
      fullScreenLoader: false,
      fioRequestsPending: [],
      fioRequestsSent: [],
      prevPendingAmount: -1,
      prevSentAmount: -1,
      pendingRequestPaging: {},
      sentRequestPaging: {}
    }
  }

  componentDidMount = () => {
    this.willFocusSubscription = this.props.navigation.addListener('focus', () => {
      this.getFioRequestsPending().catch(err => showError(err))
      this.getFioRequestsSent().catch(err => showError(err))
      this.props.refreshAllFioAddresses().catch(err => showError(err))
    })
  }

  componentWillUnmount(): void {
    if (this.willFocusSubscription != null) this.willFocusSubscription()
  }

  componentDidUpdate = () => {
    if (this.state.addressCachedUpdated || this.state.loadingPending || this.state.loadingSent) return

    const { fioRequestsPending, fioRequestsSent } = this.state
    const addressArray: string[] = []
    for (const request of fioRequestsPending) {
      addressArray.push(request.payee_fio_address)
      addressArray.push(request.payer_fio_address)
    }
    for (const request of fioRequestsSent) {
      addressArray.push(request.payee_fio_address)
      addressArray.push(request.payer_fio_address)
    }

    addToFioAddressCache(this.props.account, addressArray).catch(err => showError(err))
    // eslint-disable-next-line react/no-did-update-set-state
    this.setState({ addressCachedUpdated: true })
  }

  getFioRequestsPending = async () => {
    const { fioWallets = [], fioAddresses } = this.props
    const { pendingRequestPaging, fioRequestsPending } = this.state
    this.setState({ loadingPending: true, prevPendingAmount: fioRequestsPending.length })
    let newRequests: FioRequest[] = []
    try {
      newRequests = await this.getFioRequests(fioWallets, pendingRequestPaging, 'PENDING')
    } catch (e: any) {
      showError(e.message)
    }

    const fioAddressNames = fioAddresses.map(({ name }) => name)
    this.setState({
      fioRequestsPending: [
        ...fioRequestsPending,
        ...newRequests.filter(({ payer_fio_address: payerFioAddress }: FioRequest) => fioAddressNames.includes(payerFioAddress))
      ],
      loadingPending: false,
      pendingRequestPaging
    })
  }

  getFioRequestsSent = async () => {
    const { fioWallets = [] } = this.props
    const { fioRequestsSent, sentRequestPaging } = this.state
    this.setState({ loadingSent: true, prevSentAmount: fioRequestsSent.length })
    let newRequests: FioRequest[] = []
    try {
      newRequests = await this.getFioRequests(fioWallets, sentRequestPaging, 'SENT')
    } catch (e: any) {
      showError(e.message)
    }

    this.setState({
      fioRequestsSent: [...fioRequestsSent, ...newRequests],
      loadingSent: false,
      sentRequestPaging
    })
  }

  getFioRequests = async (
    fioWallets: EdgeCurrencyWallet[],
    paging: { [fioPublicKey: string]: number },
    requestsType: 'PENDING' | 'SENT'
  ): Promise<FioRequest[]> => {
    const nextFioRequests: FioRequest[] = []
    if (fioWallets.length) {
      try {
        for (const wallet of fioWallets) {
          const fioPublicKey = wallet.publicWalletInfo.keys.publicKey
          if (paging[fioPublicKey] == null) paging[fioPublicKey] = 1

          const fioRequests = await wallet.otherMethods.getFioRequests(requestsType, paging[fioPublicKey], ITEMS_PER_PAGE)
          nextFioRequests.push(...fioRequests.map((request: FioRequest) => ({ ...request, fioWalletId: wallet.id })))
          paging[fioPublicKey]++
        }
      } catch (e: any) {
        throw new Error(lstrings.fio_get_requests_error)
      }
    }
    return nextFioRequests
  }

  showNoBundledTxsAlert = async (fioWallet: EdgeCurrencyWallet, fioAddressName: string) => {
    const { navigation } = this.props
    const answer = await Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.fio_no_bundled_err_msg}
        message={lstrings.fio_no_bundled_add_err_msg}
        buttons={{
          ok: { label: lstrings.title_fio_add_bundled_txs }
        }}
        closeArrow
      />
    ))
    if (answer === 'ok') {
      return navigation.navigate('fioAddressSettings', {
        showAddBundledTxs: true,
        fioWallet,
        fioAddressName
      })
    }
  }

  removeFioPendingRequest = (requestId: number): void => {
    const { fioRequestsPending } = this.state
    this.setState({ fioRequestsPending: fioRequestsPending.filter(item => item.fio_request_id !== requestId) })
  }

  removeFioSentRequest = (requestId: number): void => {
    const { fioRequestsSent } = this.state
    this.setState({ fioRequestsSent: fioRequestsSent.filter(item => item.fio_request_id !== requestId) })
  }

  rejectFioRequest = async (request: FioRequest) => {
    const payerFioAddress = request.payer_fio_address
    if (!this.props.isConnected) {
      showError(lstrings.fio_network_alert_text)
      return
    }
    this.setState({ fullScreenLoader: true })
    const { fioWallets = [] } = this.props
    const fioWallet = fioWallets.find(wallet => wallet.id === request.fioWalletId)

    if (fioWallet) {
      try {
        let edgeTx = await fioMakeSpend(fioWallet, 'rejectFundsRequest', { fioRequestId: request.fio_request_id, payerFioAddress })
        if (edgeTx.networkFee !== '0') {
          this.setState({ fullScreenLoader: false })
          await this.showNoBundledTxsAlert(fioWallet, payerFioAddress)
        } else {
          edgeTx = await fioSignAndBroadcast(fioWallet, edgeTx)
          await fioWallet.saveTx(edgeTx)
          this.removeFioPendingRequest(request.fio_request_id)
          showToast(lstrings.fio_reject_status)
        }
      } catch (e: any) {
        showError(lstrings.fio_reject_request_error)
      }
    } else {
      showError(lstrings.err_no_address_title)
    }
    this.setState({ fullScreenLoader: false })
  }

  cancelFioRequest = async (request: FioRequest) => {
    const payeeFioAddress = request.payee_fio_address
    if (!this.props.isConnected) {
      showError(lstrings.fio_network_alert_text)
      return
    }
    this.setState({ fullScreenLoader: true })
    const { fioWallets = [] } = this.props
    const fioWallet = fioWallets.find(wallet => wallet.id === request.fioWalletId)

    if (fioWallet) {
      try {
        await cancelFioRequest(fioWallet, request.fio_request_id, payeeFioAddress)
        this.removeFioSentRequest(request.fio_request_id)
        showToast(lstrings.fio_cancel_status)
      } catch (e: any) {
        this.setState({ fullScreenLoader: false })
        if (e.code === FIO_NO_BUNDLED_ERR_CODE) {
          await this.showNoBundledTxsAlert(fioWallet, payeeFioAddress)
        } else {
          showError(e)
        }
      }
    } else {
      showError(lstrings.fio_wallet_missing_for_fio_request)
    }
    this.setState({ fullScreenLoader: false })
  }

  rejectRowConfirm = async (request: FioRequest) => {
    const answer = await Airship.show<'yes' | 'cancel' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.fio_reject_request_title}
        message={lstrings.fio_reject_request_message}
        buttons={{
          yes: { label: lstrings.yes },
          cancel: { label: lstrings.string_cancel_cap }
        }}
      />
    ))
    if (answer === 'yes') {
      return await this.rejectFioRequest(request)
    }
  }

  cancelRowConfirm = async (request: FioRequest) => {
    const answer = await Airship.show<'yes' | 'no' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.fio_reject_request_title}
        message={lstrings.fio_cancel_request_message}
        buttons={{
          yes: { label: lstrings.yes },
          no: { label: lstrings.no }
        }}
      />
    ))
    if (answer === 'yes') {
      return await this.cancelFioRequest(request)
    }
  }

  headerRowUsingTitle = (sectionObj: { section: { title: string } }) => {
    if (!sectionObj.section.title) return null
    return <SectionHeader title={sectionObj.section.title} />
  }

  selectPendingRequest = async (fioRequest: FioRequest) => {
    if (!this.props.isConnected) {
      showError(lstrings.fio_network_alert_text)
      return
    }
    const { account, onSelectWallet } = this.props
    const availableWallets: Array<{ id: string; currencyCode: string }> = []
    for (const walletId of Object.keys(account.currencyWallets)) {
      const wallet = account.currencyWallets[walletId]
      const { chainCode, tokenCode } = convertFIOToEdgeCodes(
        wallet.currencyInfo.pluginId,
        fioRequest.content.chain_code.toUpperCase(),
        fioRequest.content.token_code.toUpperCase()
      )
      const walletCurrencyCode = wallet.currencyInfo.currencyCode.toUpperCase()
      if (walletCurrencyCode === tokenCode) {
        availableWallets.push({ id: walletId, currencyCode: tokenCode })
        if (availableWallets.length > 1) {
          await this.renderDropUp(fioRequest)
          return
        }
      }
      const enabledTokens = tokenIdsToCurrencyCodes(wallet.currencyConfig, wallet.enabledTokenIds)
      if (walletCurrencyCode === chainCode && enabledTokens.includes(tokenCode)) {
        availableWallets.push({ id: walletId, currencyCode: tokenCode })
        if (availableWallets.length > 1) {
          await this.renderDropUp(fioRequest)
          return
        }
      }
    }
    if (availableWallets.length) {
      onSelectWallet(availableWallets[0].id, availableWallets[0].currencyCode)
      await this.sendCrypto(fioRequest, availableWallets[0].id, availableWallets[0].currencyCode)
      return
    }
    await Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={sprintf(lstrings.err_token_not_in_wallet_title, fioRequest.content.token_code.toUpperCase())}
        message={sprintf(lstrings.err_token_not_in_wallet_msg, fioRequest.content.token_code.toUpperCase())}
        buttons={{ ok: { label: lstrings.string_ok_cap } }}
      />
    ))
  }

  renderDropUp = async (selectedFioPendingRequest: FioRequest) => {
    const { account, onSelectWallet } = this.props
    const { content } = selectedFioPendingRequest
    const pluginId = Object.keys(SPECIAL_CURRENCY_INFO).find(
      pluginId => (SPECIAL_CURRENCY_INFO[pluginId].fioChainCode ?? SPECIAL_CURRENCY_INFO[pluginId].chainCode) === content.chain_code.toUpperCase()
    )
    if (pluginId == null) {
      showError(sprintf(lstrings.fio_request_unknown_chain_code, content.chain_code.toUpperCase()))
      return
    }

    const { tokenCode } = convertFIOToEdgeCodes(pluginId, content.chain_code.toUpperCase(), content.token_code.toUpperCase())
    const tokenId = getTokenId(account, pluginId, tokenCode)
    const allowedAssets = [{ pluginId, tokenId }]

    const { walletId, currencyCode } = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal bridge={bridge} navigation={this.props.navigation} headerTitle={lstrings.fio_src_wallet} allowedAssets={allowedAssets} />
    ))
    if (walletId && currencyCode) {
      onSelectWallet(walletId, currencyCode)
      await this.sendCrypto(selectedFioPendingRequest, walletId, currencyCode)
    }
  }

  sendCrypto = async (pendingRequest: FioRequest, walletId: string, selectedCurrencyCode: string) => {
    const { fioWallets = [], currencyWallets, navigation, getExchangeDenomination } = this.props
    const fioWalletByAddress = fioWallets.find(wallet => wallet.id === pendingRequest.fioWalletId) || null
    if (!fioWalletByAddress) return showError(lstrings.fio_wallet_missing_for_fio_address)
    const currencyWallet = currencyWallets[walletId]
    const exchangeDenomination = getExchangeDenomination(currencyWallet.currencyInfo.pluginId, pendingRequest.content.token_code.toUpperCase())
    let nativeAmount = mul(pendingRequest.content.amount, exchangeDenomination.multiplier)
    nativeAmount = toFixed(nativeAmount, 0, 0)
    const currencyCode = pendingRequest.content.token_code.toUpperCase()

    const parsedUri = await currencyWallet.parseUri(pendingRequest.content.payee_public_address, currencyCode)
    const guiMakeSpendInfo = {
      fioPendingRequest: pendingRequest,
      fioAddress: pendingRequest.payee_fio_address,
      publicAddress: parsedUri.legacyAddress || parsedUri.publicAddress,
      nativeAmount,
      currencyCode,
      metadata: parsedUri.metadata,
      uniqueIdentifier: parsedUri.uniqueIdentifier,
      spendTargets: [
        {
          nativeAmount,
          publicAddress: parsedUri.legacyAddress || parsedUri.publicAddress,
          otherParams: {
            uniqueIdentifier: parsedUri.uniqueIdentifier,
            fioAddress: pendingRequest.payee_fio_address
          }
        }
      ],
      lockInputs: true,
      beforeTransaction: async () => {
        try {
          const edgeTx = await fioMakeSpend(fioWalletByAddress, 'recordObtData', {
            ...FIO_FAKE_RECORD_OBT_DATA_REQUEST,
            payerFioAddress: pendingRequest.payer_fio_address
          })
          if (edgeTx.networkFee !== '0') {
            showError(lstrings.fio_no_bundled_err_msg)
            throw new Error(lstrings.fio_no_bundled_err_msg)
          }
        } catch (e: any) {
          showError(lstrings.fio_get_fee_err_msg)
          throw e
        }
      },
      // @ts-expect-error
      onDone: (err, edgeTransaction) => {
        if (!err && edgeTransaction != null) {
          this.removeFioPendingRequest(pendingRequest.fio_request_id)
          navigation.replace('transactionDetails', { edgeTransaction, walletId })
        }
      }
    }

    navigation.navigate('send', {
      guiMakeSpendInfo,
      selectedWalletId: walletId,
      selectedCurrencyCode
    })
  }

  selectSentRequest = (fioRequest: FioRequest) => {
    const { navigation } = this.props
    if (!this.props.isConnected) {
      showError(lstrings.fio_network_alert_text)
      return
    }
    navigation.navigate('fioSentRequestDetails', {
      selectedFioSentRequest: fioRequest
    })
  }

  pendingRequestHeaders = () => this.requestHeaders(this.state.fioRequestsPending)

  sentRequestHeaders = () => this.requestHeaders(this.state.fioRequestsSent)

  requestHeaders = (fioRequests: FioRequest[]) => {
    const headers: Array<{ title: string; data: FioRequest[] }> = []
    let requestsInSection: FioRequest[] = []
    let previousTimestamp = '0'
    let previousTitle = ''
    if (fioRequests) {
      // Sort newest to oldest
      const sortedArrayFioRequests = fioRequests.sort((requestA, requestB) => Date.parse(requestB.time_stamp) - Date.parse(requestA.time_stamp))
      sortedArrayFioRequests.forEach((fioRequest, i) => {
        const reqTimestamp = fioRequest.time_stamp.includes('Z') ? fioRequest.time_stamp : `${fioRequest.time_stamp}Z`
        if (i === 0) {
          requestsInSection = []
          previousTimestamp = reqTimestamp
        }
        if (i > 0 && formatDate(new Date(previousTimestamp)) !== formatDate(new Date(reqTimestamp))) {
          headers.push({ title: previousTitle, data: requestsInSection })
          requestsInSection = []
        }
        requestsInSection.push(fioRequest)
        previousTimestamp = reqTimestamp
        previousTitle = formatDate(new Date(reqTimestamp), SHORT_DATE_FMT)
      })
      headers.push({ title: previousTitle, data: requestsInSection })
    }
    return headers
  }

  listKeyExtractor(item: FioRequest) {
    return `${item.fio_request_id.toString()}${item.fioWalletId}`
  }

  pendingLazyLoad = ({ distanceFromEnd }: { distanceFromEnd: number }) => {
    const { loadingPending, fioRequestsPending, prevPendingAmount } = this.state
    if (!loadingPending && (prevPendingAmount < fioRequestsPending.length || (distanceFromEnd < 0 && fioRequestsPending.length > 0))) {
      this.getFioRequestsPending().catch(err => showError(err))
    }
  }

  sentLazyLoad = ({ distanceFromEnd }: { distanceFromEnd: number }) => {
    const { loadingSent, fioRequestsSent, prevSentAmount } = this.state
    if (!loadingSent && (prevSentAmount < fioRequestsSent.length || (distanceFromEnd < 0 && fioRequestsSent.length > 0))) {
      this.getFioRequestsSent().catch(err => showError(err))
    }
  }

  renderPending = (listItem: { item: FioRequest }) => {
    const { item } = listItem

    return <FioRequestRow fioRequest={item} isSent={false} onPress={this.selectPendingRequest} onSwipe={this.rejectRowConfirm} />
  }

  renderSent = (listItem: { item: FioRequest }) => {
    const { item } = listItem

    return <FioRequestRow fioRequest={item} isSent onPress={this.selectSentRequest} onSwipe={this.cancelRowConfirm} />
  }

  render() {
    const { theme } = this.props
    const { loadingPending, loadingSent, fullScreenLoader, fioRequestsPending, fioRequestsSent } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="theme">
        {fullScreenLoader && <FullScreenLoader indicatorStyles={styles.fullScreenLoader} />}
        <View style={styles.scene}>
          <View style={styles.row}>
            <SceneHeader title={lstrings.fio_pending_requests} underline />
            <View style={styles.container}>
              {!loadingPending && !fioRequestsPending.length ? <EdgeText style={styles.emptyListText}>{lstrings.fio_no_requests_label}</EdgeText> : null}
              {loadingPending && !fioRequestsPending.length && <ActivityIndicator color={theme.iconTappable} style={styles.loading} size="small" />}
              <SectionList
                initialNumToRender={10}
                keyExtractor={this.listKeyExtractor}
                renderItem={this.renderPending}
                renderSectionHeader={this.headerRowUsingTitle}
                sections={this.pendingRequestHeaders()}
                onEndReached={this.pendingLazyLoad}
                onEndReachedThreshold={SCROLL_THRESHOLD}
              />
            </View>
          </View>
          <View style={styles.row}>
            <SceneHeader title={lstrings.fio_sent_requests} underline withTopMargin />
            <View style={styles.container}>
              {!loadingSent && !fioRequestsSent.length ? <EdgeText style={styles.emptyListText}>{lstrings.fio_no_requests_label}</EdgeText> : null}
              {loadingSent && !fioRequestsSent.length && <ActivityIndicator color={theme.iconTappable} style={styles.loading} size="small" />}
              <SectionList
                initialNumToRender={10}
                keyExtractor={this.listKeyExtractor}
                renderItem={this.renderSent}
                renderSectionHeader={this.headerRowUsingTitle}
                sections={this.sentRequestHeaders()}
                onEndReached={this.sentLazyLoad}
                onEndReachedThreshold={SCROLL_THRESHOLD}
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
    alignItems: 'stretch',
    flex: 1,
    paddingTop: theme.rem(0.5)
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
  }
}))

export const FioRequestListScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    account: state.core.account,
    fioWallets: state.ui.wallets.fioWallets,
    fioAddresses: state.ui.fioAddress.fioAddresses,
    currencyWallets: state.core.account.currencyWallets,
    isConnected: state.network.isConnected
  }),
  dispatch => ({
    onSelectWallet(walletId: string, currencyCode: string) {
      dispatch({
        type: 'UI/WALLETS/SELECT_WALLET',
        data: { currencyCode, walletId }
      })
    },
    async refreshAllFioAddresses() {
      await dispatch(refreshAllFioAddresses())
    },
    getExchangeDenomination(pluginId: string, currencyCode: string) {
      return dispatch(getExchangeDenominationFromState(pluginId, currencyCode))
    }
  })
)(withTheme(FioRequestList))
