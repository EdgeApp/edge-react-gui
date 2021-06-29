// @flow

import {
  type EdgeAccount,
  type EdgeCurrencyWallet,
  type EdgeMetadata,
  type EdgeParsedUri,
  type EdgeSpendTarget,
  type EdgeTransaction,
  type EdgeSpendInfo
} from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { connect } from 'react-redux'

import { type FeeOption } from '../../../reducers/scenes/SendConfirmationReducer'
import { type FioSenderInfo, sendConfirmationUpdateTx, signBroadcastAndSave, getAuthRequiredType } from '../../../actions/SendConfirmationActions'
import { FIO_STR } from '../../../constants/WalletAndCurrencyConstants'
import s from '../../../locales/strings'
import { checkRecordSendFee, FIO_NO_BUNDLED_ERR_CODE } from '../../../modules/FioAddress/util'
import { Slider } from '../../../modules/UI/components/Slider/Slider'
import { type Dispatch, type RootState } from '../../../types/reduxTypes'
import { type SpendAuthType } from '../../../types/types'
import { type GuiExchangeRates, type GuiWallet } from '../../../types/types'
import { SceneWrapper } from '../../common/SceneWrapper'
import { ButtonsModal } from '../../modals/ButtonsModal'
import type { WalletListResult } from '../../modals/WalletListModal'
import { WalletListModal } from '../../modals/WalletListModal'
import { Airship, showError } from '../../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../services/ThemeContext'
import { AddressTile } from '../../themed/AddressTile'
import { EdgeText } from '../../themed/EdgeText'
import { SelectFioAddress } from '../../themed/SelectFioAddress'
import { Tile } from '../../themed/Tile'

import { Authentication } from './Authentication'
import { InfoTiles } from './InfoItems'
import { UniqueIdentifier } from './UniqueIdentifier'
import { Fees } from './Fees'
import { Amount } from './Amount'

export type FeeOption = 'custom' | 'high' | 'low' | 'standard'

export type GuiMakeSpendInfo = {
  currencyCode?: string,
  metadata?: any,
  nativeAmount?: string,
  networkFeeOption?: FeeOption,
  customNetworkFee?: Object,
  publicAddress?: string,
  spendTargets?: EdgeSpendTarget[],
  lockInputs?: boolean,
  uniqueIdentifier?: string,
  otherParams?: Object,
  dismissAlert?: boolean,
  fioAddress?: string,
  fioPendingRequest?: FioRequest,
  isSendUsingFioAddress?: boolean,
  onBack?: () => void,
  onDone?: (error: Error | null, edgeTransaction?: EdgeTransaction) => void,
  beforeTransaction?: () => Promise<void>
}

type StateProps = {
  account: EdgeAccount,
  authRequired: 'pin' | 'none',
  defaultSelectedWalletId: string,
  defaultSelectedWalletCurrencyCode: string,
  error: Error | null,
  exchangeRates: GuiExchangeRates,
  lockInputs?: boolean,
  nativeAmount: string | null,
  pending: boolean,
  pin: string,
  resetSlider: boolean,
  settings: any,
  sliderDisabled: boolean,
  transaction: EdgeTransaction | null,
  transactionMetadata: EdgeMetadata | null,
  uniqueIdentifier?: string,
  wallets: { [walletId: string]: GuiWallet },
  isSendUsingFioAddress?: boolean
}

type DispatchProps = {
  reset: () => void,
  sendConfirmationUpdateTx: (guiMakeSpendInfo: GuiMakeSpendInfo, selectedWalletId: string, selectedCurrencyCode: string) => Promise<void>, // Somehow has a return??
  signBroadcastAndSave: (fioSender?: FioSenderInfo, selectedWalletId?: string, selectedCurrencyCode?: string) => void,
  updateSpendPending: boolean => void,
  onChangePin: (pin: string) => void
}

type RouteProps = {
  allowedCurrencyCodes?: string[],
  guiMakeSpendInfo?: GuiMakeSpendInfo,
  selectedWalletId?: string,
  selectedCurrencyCode?: string,
  isCameraOpen?: boolean,
  lockTilesMap?: {
    address?: boolean,
    wallet?: boolean,
    amount?: boolean
  },
  hiddenTilesMap?: {
    address?: boolean,
    amount?: boolean,
    fioAddressSelect?: boolean
  },
  infoTiles?: Array<{ label: string, value: string }>
}

type Props = StateProps & DispatchProps & RouteProps & ThemeProps

type WalletStates = {
  selectedWalletId: string,
  selectedCurrencyCode: string,
  guiWallet: GuiWallet,
  coreWallet?: EdgeCurrencyWallet
}

type State = {
  recipientAddress: string,
  loading: boolean,
  resetSlider: boolean,
  fioSender: FioSenderInfo,
  //
  forceUpdateGuiCounter: number,
  transactionMetadata: EdgeMetadata | null,
  address: string,
  nativeAmount: string,
  guiMakeSpendInfo: GuiMakeSpendInfo,
  spendInfo: EdgeSpendInfo | null,
  pending: boolean,
  transaction: EdgeTransaction | null,
  error: Error | null,
  pin: string,
  authRequired: 'pin' | 'none',
  toggleCryptoOnTop: number
} & WalletStates

const initialState = {
  forceUpdateGuiCounter: 0,
  guiMakeSpendInfo: {
    networkFeeOption: 'standard',
    customNetworkFee: {},
    publicAddress: '',
    nativeAmount: '0',
    metadata: {
      name: '',
      category: '',
      notes: '',
      amountFiat: 0,
      bizId: 0
    }
  },
  spendInfo: null,
  transactionMetadata: null,
  nativeAmount: '0',
  transaction: {
    txid: '',
    date: 0,
    currencyCode: '',
    blockHeight: -1,
    nativeAmount: '0',
    networkFee: '',
    parentNetworkFee: '',
    ourReceiveAddresses: [],
    signedTx: '',
    metadata: {},
    otherParams: {}
  },
  pending: false,
  error: null,
  pin: '',
  authRequired: 'none',
  address: '',
  toggleCryptoOnTop: 0
}

class SendComponent extends React.PureComponent<Props, State> {
  addressTile: ?React.ElementRef<typeof AddressTile>

  constructor(props: Props) {
    super(props)

    const { guiMakeSpendInfo } = props

    this.state = {
      recipientAddress: '',
      loading: false,
      resetSlider: false,
      fioSender: {
        fioAddress: guiMakeSpendInfo && guiMakeSpendInfo.fioPendingRequest ? guiMakeSpendInfo.fioPendingRequest.payer_fio_address : '',
        fioWallet: null,
        fioError: '',
        memo: guiMakeSpendInfo && guiMakeSpendInfo.fioPendingRequest ? guiMakeSpendInfo.fioPendingRequest.content.memo : '',
        memoError: '',
      },
      ...initialState,
      ...this.setWallets(props, props.selectedWalletId, props.selectedCurrencyCode)
    }
  }

  getSpendInfo = (newSpendInfo?: GuiMakeSpendInfo = {}, selectedCurrencyCode?: string): EdgeSpendInfo => {
    const { nativeAmount, guiMakeSpendInfo: stateGuiMakeSpendInfo, spendInfo } = this.state
    const guiMakeSpendInfo = stateGuiMakeSpendInfo || initialState.guiMakeSpendInfo
    const uniqueIdentifier = (newSpendInfo || guiMakeSpendInfo).uniqueIdentifier || ''
    const firstSpendTargetPublicAddress = spendInfo ? spendInfo.spendTargets[0].publicAddress : ''
    const spendTargets = newSpendInfo.spendTargets || [
      {
        nativeAmount: newSpendInfo.nativeAmount || nativeAmount,
        publicAddress: (newSpendInfo || guiMakeSpendInfo).publicAddress || firstSpendTargetPublicAddress,
        otherParams: {
          uniqueIdentifier
        }
      }
    ]
    const metadata = guiMakeSpendInfo.metadata || {}

    return {
      currencyCode: newSpendInfo.currencyCode || selectedCurrencyCode,
      metadata: { ...metadata, ...(newSpendInfo.metadata || {}) },
      spendTargets,
      networkFeeOption: (newSpendInfo || guiMakeSpendInfo).networkFeeOption,
      customNetworkFee: { ...guiMakeSpendInfo, ...(newSpendInfo.customNetworkFee || {}) },
      otherParams: newSpendInfo.otherParams || {}
    }
  }

  sendConfirmationUpdateTx = async (
    guiMakeSpendInfo: GuiMakeSpendInfo | EdgeParsedUri,
    forceUpdateGui?: boolean = true,
    selectedWalletId?: string,
    selectedCurrencyCode?: string
  ) => {
    const { account: { currencyWallets }, defaultSelectedWalletId, defaultSelectedWalletCurrencyCode } = this.props

    const walletId = selectedWalletId || defaultSelectedWalletId
    const edgeWallet = currencyWallets[walletId]
    const guiMakeSpendInfoClone = { ...guiMakeSpendInfo }
    const spendInfo = this.getSpendInfo(guiMakeSpendInfoClone, selectedCurrencyCode || defaultSelectedWalletCurrencyCode)

    const authRequired = getAuthRequired(state, spendInfo)
    dispatch({
      type: 'UI/SEND_CONFIRMATION/NEW_SPEND_INFO',
      data: { spendInfo, authRequired }
    })

    await edgeWallet
      .makeSpend(spendInfo)
      .then(edgeTransaction => {
        return dispatch({
          type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
          data: {
            error: null,
            forceUpdateGui,
            guiMakeSpendInfo: guiMakeSpendInfoClone,
            transaction: edgeTransaction
          }
        })
      })
      .catch(async (error: mixed) => {
        console.log(error)
        const insufficientFunds = asMaybeInsufficientFundsError(error)
        if (insufficientFunds != null && insufficientFunds.currencyCode != null && spendInfo.currencyCode !== insufficientFunds.currencyCode) {
          const { currencyCode, networkFee = '' } = insufficientFunds
          const multiplier = settingsGetExchangeDenomination(state, currencyCode).multiplier
          const amountString = UTILS.roundedFee(networkFee, 2, multiplier)
          const result = await Airship.show(bridge => (
            <ButtonsModal
              bridge={bridge}
              title={s.strings.buy_crypto_modal_title}
              message={`${amountString}${sprintf(s.strings.buy_parent_crypto_modal_message, currencyCode)}`}
              buttons={{
                buy: { label: sprintf(s.strings.buy_crypto_modal_buy_action, currencyCode) },
                exchange: { label: s.strings.buy_crypto_modal_exchange },
                cancel: { label: s.strings.buy_crypto_decline, type: 'secondary' }
              }}
            />
          ))
          switch (result) {
            case 'buy':
              Actions.jump(PLUGIN_BUY)
              return
            case 'exchange':
              dispatch(selectWalletForExchange(walletId, currencyCode, 'to'))
              Actions.jump(EXCHANGE_SCENE)
              break
          }
        }
        const typeHack: any = error
        return dispatch({
          type: 'UI/SEND_CONFIRMATION/UPDATE_TRANSACTION',
          data: {
            error: typeHack,
            forceUpdateGui,
            guiMakeSpendInfo: guiMakeSpendInfoClone,
            transaction: null
          }
        })
      })
  }

  setWallets(props: Props, selectedWalletId?: string, selectedCurrencyCode?: string): WalletStates {
    const { account, defaultSelectedWalletId, defaultSelectedWalletCurrencyCode, wallets } = this.props
    const walletId = selectedWalletId || defaultSelectedWalletId
    const currencyCode = selectedCurrencyCode || defaultSelectedWalletCurrencyCode
    return {
      selectedWalletId: walletId,
      selectedCurrencyCode: currencyCode,
      guiWallet: wallets[walletId],
      coreWallet: account && account.currencyWallets ? account.currencyWallets[walletId] : undefined
    }
  }

  componentDidMount(): void {
    const { guiMakeSpendInfo } = this.props

    if (guiMakeSpendInfo) {
      this.props.sendConfirmationUpdateTx(guiMakeSpendInfo, this.state.selectedWalletId, this.state.selectedCurrencyCode)
      const recipientAddress =
        guiMakeSpendInfo && guiMakeSpendInfo.publicAddress
          ? guiMakeSpendInfo.publicAddress
          : guiMakeSpendInfo.spendTargets && guiMakeSpendInfo.spendTargets[0].publicAddress
          ? guiMakeSpendInfo.spendTargets[0].publicAddress
          : ''
      this.setState({ recipientAddress })
    }
  }

  componentWillUnmount() {
    this.props.reset()
    if (this.props.guiMakeSpendInfo && this.props.guiMakeSpendInfo.onBack) {
      this.props.guiMakeSpendInfo.onBack()
    }
  }

  componentDidUpdate(prevProps: Props): void {
    if (prevProps.pending && !this.props.pending) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ resetSlider: true })
    }
    if (!prevProps.pending && !this.props.pending && this.state.resetSlider) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ resetSlider: false })
    }
  }

  resetSendTransaction = () => {
    this.props.reset()
    this.setState({ recipientAddress: '' })
  }

  handleWalletPress = () => {
    const { props } = this
    const oldSelectedCurrencyCode = this.state.selectedCurrencyCode

    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.fio_src_wallet} allowedCurrencyCodes={this.props.allowedCurrencyCodes} />)
      .then(({ walletId, currencyCode }: WalletListResult) => {
        if (walletId && currencyCode) {
          this.setState(
            {
              ...this.state,
              ...this.setWallets(props, walletId, currencyCode)
            },
            () => {
              if (!this.addressTile) return
              if (currencyCode !== oldSelectedCurrencyCode) {
                this.addressTile.reset()
              } else if (currencyCode === oldSelectedCurrencyCode && this.state.recipientAddress !== '') {
                this.addressTile.onChangeAddress(this.state.recipientAddress)
              }
            }
          )
        }
      })
      .catch(error => console.log(error))
  }

  handleChangeAddress = async (newGuiMakeSpendInfo: GuiMakeSpendInfo, parsedUri?: EdgeParsedUri) => {
    const { sendConfirmationUpdateTx, guiMakeSpendInfo } = this.props
    const { spendTargets } = newGuiMakeSpendInfo
    const recipientAddress = parsedUri ? parsedUri.publicAddress : spendTargets && spendTargets[0].publicAddress ? spendTargets[0].publicAddress : ''

    if (parsedUri) {
      const nativeAmount = parsedUri.nativeAmount || '0'
      const spendTargets: EdgeSpendTarget[] = [
        {
          publicAddress: parsedUri.publicAddress,
          nativeAmount
        }
      ]
      newGuiMakeSpendInfo = {
        ...guiMakeSpendInfo,
        spendTargets,
        lockInputs: false,
        metadata: parsedUri.metadata,
        uniqueIdentifier: parsedUri.uniqueIdentifier,
        nativeAmount,
        ...newGuiMakeSpendInfo
      }
    }
    sendConfirmationUpdateTx(newGuiMakeSpendInfo, this.state.selectedWalletId, this.state.selectedCurrencyCode)
    this.setState({ recipientAddress })
  }

  submit = async () => {
    const { guiMakeSpendInfo, updateSpendPending, signBroadcastAndSave } = this.props
    const { selectedWalletId, selectedCurrencyCode } = this.state
    this.setState({ loading: true })

    if (guiMakeSpendInfo && (guiMakeSpendInfo.isSendUsingFioAddress || guiMakeSpendInfo.fioPendingRequest)) {
      const { fioSender } = this.state
      if (fioSender.fioWallet && fioSender.fioAddress && !guiMakeSpendInfo.fioPendingRequest) {
        updateSpendPending(true)
        try {
          await checkRecordSendFee(fioSender.fioWallet, fioSender.fioAddress)
        } catch (e) {
          updateSpendPending(false)
          if (e.code && e.code === FIO_NO_BUNDLED_ERR_CODE && selectedCurrencyCode !== FIO_STR) {
            const answer = await Airship.show(bridge => (
              <ButtonsModal
                bridge={bridge}
                title={s.strings.fio_no_bundled_err_msg}
                message={`${s.strings.fio_no_bundled_non_fio_err_msg} ${s.strings.fio_no_bundled_renew_err_msg}`}
                buttons={{
                  ok: { label: s.strings.legacy_address_modal_continue },
                  cancel: { label: s.strings.string_cancel_cap, type: 'secondary' }
                }}
              />
            ))
            if (answer === 'ok') {
              fioSender.skipRecord = true
              signBroadcastAndSave(fioSender, selectedWalletId, selectedCurrencyCode)
            }
            return
          }

          showError(e)
          return
        }
        updateSpendPending(false)
      }

      return signBroadcastAndSave(fioSender)
    }
    signBroadcastAndSave(undefined, selectedWalletId, selectedCurrencyCode)

    this.setState({ loading: false })
  }

  renderSelectedWallet() {
    const { lockInputs, lockTilesMap = {} } = this.props
    const { guiWallet, selectedCurrencyCode } = this.state

    const isStatic = lockInputs || lockTilesMap.wallet

    return (
      <Tile
        type={isStatic ? 'static' : 'editable'}
        title={s.strings.send_scene_send_from_wallet}
        onPress={isStatic ? undefined : this.handleWalletPress}
        body={`${guiWallet.name} (${selectedCurrencyCode})`}
      />
    )
  }

  renderAddressTile() {
    const { isCameraOpen, lockInputs, lockTilesMap = {}, hiddenTilesMap = {} } = this.props
    const { recipientAddress } = this.state
    const { coreWallet, selectedCurrencyCode } = this.state

    if (coreWallet && !hiddenTilesMap.address) {
      return (
        <AddressTile
          title={s.strings.send_scene_send_to_address}
          recipientAddress={recipientAddress}
          coreWallet={coreWallet}
          currencyCode={selectedCurrencyCode}
          onChangeAddress={this.handleChangeAddress}
          resetSendTransaction={this.resetSendTransaction}
          lockInputs={lockInputs || lockTilesMap.address}
          isCameraOpen={!!isCameraOpen}
          ref={ref => (this.addressTile = ref)}
        />
      )
    }

    return null
  }

  renderMetadata() {
    const { transactionMetadata } = this.props

    if (!transactionMetadata || !transactionMetadata.name) return null

    return (
      <Tile type="static" title={s.strings.send_scene_metadata_name_title}>
        <EdgeText>{transactionMetadata.name}</EdgeText>
      </Tile>
    )
  }

  renderError() {
    const { error, theme } = this.props

    if (error && asMaybeNoAmountSpecifiedError(error) == null) {
      return (
        <Tile type="static" title={s.strings.send_scene_error_title}>
          <EdgeText style={{ color: theme.dangerText }}>{error.message}</EdgeText>
        </Tile>
      )
    }
    return null
  }

  handleFioAddressSelect = (fioAddress: string, fioWallet: EdgeCurrencyWallet, fioError: string) => {
    this.setState({
      fioSender: {
        ...this.state.fioSender,
        fioAddress,
        fioWallet,
        fioError
      }
    })
  }

  handleMemoChange = (memo: string, memoError: string) => {
    this.setState({
      fioSender: {
        ...this.state.fioSender,
        memo,
        memoError
      }
    })
  }

  renderSelectFioAddress() {
    const { hiddenTilesMap = {}, guiMakeSpendInfo, isSendUsingFioAddress } = this.props
    const { fioSender } = this.state

    if (hiddenTilesMap.fioAddressSelect) return null

    return (
      <View>
        <SelectFioAddress
          selected={fioSender.fioAddress}
          memo={fioSender.memo}
          memoError={fioSender.memoError}
          onSelect={this.handleFioAddressSelect}
          onMemoChange={this.handleMemoChange}
          fioRequest={guiMakeSpendInfo && guiMakeSpendInfo.fioPendingRequest ? guiMakeSpendInfo.fioPendingRequest : undefined}
          isSendUsingFioAddress={isSendUsingFioAddress}
        />
      </View>
    )
  }

  handleFeesUpdate = (networkFeeOption: FeeOption, customNetworkFee: Object) => {
    const { coreWallet, selectedCurrencyCode } = this.state

    if (coreWallet) {
      sendConfirmationUpdateTx({ networkFeeOption, customNetworkFee }, true, coreWallet.id, selectedCurrencyCode)
    }
  }

  // Render
  render() {
    const { error, exchangeRates, settings, transaction, pending, resetSlider, sliderDisabled, authRequired, pin, onChangePin, infoTiles, uniqueIdentifier, lockTilesMap = {}, hiddenTilesMap = {}, nativeAmount, lockInputs, theme } = this.props
    const { loading, recipientAddress, resetSlider: localResetSlider, selectedCurrencyCode, guiWallet, coreWallet, selectedWalletId } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="theme">
        <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)}>
          {this.renderSelectedWallet()}
          {this.renderAddressTile()}
          <Amount
            walletId={selectedWalletId}
            exchangeRates={exchangeRates}
            isStatic={lockInputs || lockTilesMap.amount}
            isHidden={!recipientAddress || hiddenTilesMap.amount}
            nativeAmount={nativeAmount}
            settings={settings}
            guiWallet={guiWallet}
            currencyCode={selectedCurrencyCode}
          />
          {this.renderError()}
          <Fees
            guiWallet={guiWallet}
            coreWallet={coreWallet}
            currencyCode={selectedCurrencyCode}
            error={error}
            exchangeRates={exchangeRates}
            settings={settings}
            transaction={transaction}
            isHidden={!recipientAddress}
            onFeesUpdate={this.handleFeesUpdate}
          />
          {this.renderMetadata()}
          {this.renderSelectFioAddress()}
          <UniqueIdentifier
            uniqueId={uniqueIdentifier}
            currencyCode={selectedCurrencyCode}
            isHidden={!recipientAddress}
          />
          <InfoTiles
            items={infoTiles}
          />
          <Authentication
            authRequired={authRequired}
            pin={pin}
            onChangePin={onChangePin}
          />
          <View style={styles.footer}>
            {!!recipientAddress && !localResetSlider && (
              <Slider onSlidingComplete={this.submit} reset={resetSlider || localResetSlider} disabled={sliderDisabled} showSpinner={loading || pending} />
            )}
          </View>
        </KeyboardAwareScrollView>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  footer: {
    margin: theme.rem(2),
    justifyContent: 'center',
    alignItems: 'center'
  },
}))

export const SendScene = connect(
  (state: RootState, ownProps: RouteProps): StateProps => {
    const { nativeAmount, transaction, transactionMetadata, error, pending, guiMakeSpendInfo } = state.ui.scenes.sendConfirmation
    const isSendUsingFioAddress = guiMakeSpendInfo.isSendUsingFioAddress || (ownProps.guiMakeSpendInfo && ownProps.guiMakeSpendInfo.isSendUsingFioAddress)

    return {
      account: state.core.account,
      authRequired: state.ui.scenes.sendConfirmation.authRequired,
      defaultSelectedWalletId: state.ui.wallets.selectedWalletId,
      defaultSelectedWalletCurrencyCode: state.ui.wallets.selectedCurrencyCode,
      error,
      exchangeRates: state.exchangeRates,
      lockInputs: guiMakeSpendInfo.lockInputs,
      metadata: guiMakeSpendInfo && guiMakeSpendInfo.metadata ? guiMakeSpendInfo : undefined,
      nativeAmount,
      pending,
      pin: state.ui.scenes.sendConfirmation.pin,
      resetSlider: !!error && (error.message === 'broadcastError' || error.message === 'transactionCancelled'),
      settings: state.ui.settings,
      sliderDisabled: !transaction || !!error || !!pending,
      transaction,
      transactionMetadata,
      uniqueIdentifier: guiMakeSpendInfo.uniqueIdentifier,
      wallets: state.ui.wallets.byId,
      isSendUsingFioAddress
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    reset() {
      dispatch({ type: 'UI/SEND_CONFIRMATION/RESET' })
    },
    async sendConfirmationUpdateTx(guiMakeSpendInfo: GuiMakeSpendInfo, selectedWalletId: string, selectedCurrencyCode: string) {
      await dispatch(sendConfirmationUpdateTx(guiMakeSpendInfo, true, selectedWalletId, selectedCurrencyCode))
    },
    updateSpendPending(pending: boolean) {
      dispatch({
        type: 'UI/SEND_CONFIRMATION/UPDATE_SPEND_PENDING',
        data: { pending }
      })
    },
    signBroadcastAndSave: (fioSender?: FioSenderInfo, selectedWalletId?: string, selectedCurrencyCode?: string): any =>
      dispatch(signBroadcastAndSave(fioSender, selectedWalletId, selectedCurrencyCode)),
    onChangePin(pin: string) {
      dispatch({ type: 'UI/SEND_CONFIRMATION/NEW_PIN', data: { pin } })
    },
    getAuthRequiredType: (spendInfo: EdgeSpendInfo): 'pin' | 'none' => dispatch(getAuthRequiredType(spendInfo))
  })
)(withTheme(SendComponent))
