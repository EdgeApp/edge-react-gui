// @flow

import { bns } from 'biggystring'
import { Scene } from 'edge-components'
import type { EdgeAccount, EdgeCurrencyWallet, EdgeParsedUri, EdgeSpendTarget, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { type FioSenderInfo, reset, sendConfirmationUpdateTx, signBroadcastAndSave, updateSpendPending } from '../../actions/SendConfirmationActions.js'
import { CHANGE_MINING_FEE_SEND_CONFIRMATION } from '../../constants/indexConstants'
import { FIO_STR } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings.js'
import type { ExchangeRatesState } from '../../modules/ExchangeRates/reducer'
import { checkRecordSendFee, FIO_NO_BUNDLED_ERR_CODE } from '../../modules/FioAddress/util'
import { Slider } from '../../modules/UI/components/Slider/Slider.ui'
import { convertCurrencyFromExchangeRates } from '../../modules/UI/selectors.js'
import { type GuiMakeSpendInfo } from '../../reducers/scenes/SendConfirmationReducer.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import type { GuiWallet } from '../../types/types.js'
import * as UTILS from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal'
import { FlipInputModal } from '../modals/FlipInputModal.js'
import type { WalletListResult } from '../modals/WalletListModal'
import { WalletListModal } from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { AddressTile } from '../themed/AddressTile.js'
import { EdgeText } from '../themed/EdgeText'
import { SelectFioAddress } from '../themed/SelectFioAddress.js'
import { Tile } from '../themed/Tile.js'

type StateProps = {
  account: EdgeAccount,
  defaultSelectedWalletId: string,
  defaultSelectedWalletCurrencyCode: string,
  error: Error | null,
  exchangeRates: ExchangeRatesState,
  lockInputs?: boolean,
  metadata?: any,
  nativeAmount: string | null,
  pending: boolean,
  resetSlider: boolean,
  settings: any,
  sliderDisabled: boolean,
  transaction: EdgeTransaction | null,
  wallets: { [walletId: string]: GuiWallet }
}

type DispatchProps = {
  onSelectWallet(walletId: string, currencyCode: string): void,
  reset: () => void,
  sendConfirmationUpdateTx: (guiMakeSpendInfo: GuiMakeSpendInfo, selectedWalletId: string, selectedCurrencyCode: string) => Promise<void>, // Somehow has a return??
  signBroadcastAndSave: (fioSender?: FioSenderInfo, selectedWalletId?: string, selectedCurrencyCode?: string) => void,
  updateSpendPending: boolean => void
}

type RouteProps = {
  allowedCurrencyCodes?: string[],
  guiMakeSpendInfo?: GuiMakeSpendInfo,
  selectedWalletId?: string,
  selectedCurrencyCode?: string
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
  fioSender: FioSenderInfo
} & WalletStates

class SendComponent extends React.PureComponent<Props, State> {
  addressTile: ?React.ElementRef<typeof AddressTile>

  constructor(props: Props) {
    super(props)
    this.state = {
      recipientAddress: '',
      loading: false,
      fioSender: {
        fioAddress: props.guiMakeSpendInfo && props.guiMakeSpendInfo.fioPendingRequest ? props.guiMakeSpendInfo.fioPendingRequest.payer_fio_address : '',
        fioWallet: null,
        fioError: '',
        memo: props.guiMakeSpendInfo && props.guiMakeSpendInfo.fioPendingRequest ? props.guiMakeSpendInfo.fioPendingRequest.content.memo : '',
        memoError: ''
      },
      ...this.setWallets(props, props.selectedWalletId, props.selectedCurrencyCode)
    }
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
      this.setState({ recipientAddress: guiMakeSpendInfo.publicAddress || '' })
    }
  }

  componentWillUnmount() {
    this.props.reset()
    if (this.props.guiMakeSpendInfo && this.props.guiMakeSpendInfo.onBack) {
      this.props.guiMakeSpendInfo.onBack()
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

  handleChangeAddress = async (guiMakeSpendInfo: GuiMakeSpendInfo, parsedUri?: EdgeParsedUri) => {
    const { sendConfirmationUpdateTx } = this.props
    const { spendTargets } = guiMakeSpendInfo
    const recipientAddress = parsedUri ? parsedUri.publicAddress : spendTargets && spendTargets[0].publicAddress ? spendTargets[0].publicAddress : ''

    if (parsedUri) {
      const nativeAmount = parsedUri.nativeAmount || '0'
      const spendTargets: EdgeSpendTarget[] = [
        {
          publicAddress: parsedUri.publicAddress,
          nativeAmount
        }
      ]
      guiMakeSpendInfo = {
        spendTargets,
        lockInputs: false,
        metadata: parsedUri.metadata,
        uniqueIdentifier: parsedUri.uniqueIdentifier,
        nativeAmount,
        ...guiMakeSpendInfo
      }
    }
    sendConfirmationUpdateTx(guiMakeSpendInfo, this.state.selectedWalletId, this.state.selectedCurrencyCode)
    this.setState({ recipientAddress })
  }

  handleFlipinputModal = () => {
    Airship.show(bridge => (
      <FlipInputModal bridge={bridge} walletId={this.state.selectedWalletId} currencyCode={this.state.selectedCurrencyCode} />
    )).catch(error => console.log(error))
  }

  handleFeesChange = () => Actions[CHANGE_MINING_FEE_SEND_CONFIRMATION]({ wallet: this.state.coreWallet, currencyCode: this.state.selectedCurrencyCode })

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
    const { lockInputs } = this.props
    const { guiWallet, selectedCurrencyCode } = this.state

    return (
      <Tile
        type={lockInputs ? 'static' : 'editable'}
        title={`${s.strings.step} 1: ${s.strings.select_wallet}`}
        onPress={lockInputs ? undefined : this.handleWalletPress}
        body={`${guiWallet.name} (${selectedCurrencyCode})`}
      />
    )
  }

  renderAddressTile() {
    const { lockInputs } = this.props
    const { recipientAddress } = this.state
    const { coreWallet, selectedCurrencyCode } = this.state

    if (coreWallet) {
      return (
        <AddressTile
          title={`${s.strings.step} 2: ${s.strings.transaction_details_recipient} ${s.strings.fragment_send_address}`}
          recipientAddress={recipientAddress}
          coreWallet={coreWallet}
          currencyCode={selectedCurrencyCode}
          onChangeAddress={this.handleChangeAddress}
          resetSendTransaction={this.resetSendTransaction}
          lockInputs={lockInputs}
          ref={ref => (this.addressTile = ref)}
        />
      )
    }

    return null
  }

  renderAmount() {
    const { exchangeRates, lockInputs, nativeAmount, settings } = this.props
    const { guiWallet, selectedCurrencyCode, recipientAddress } = this.state

    if (recipientAddress) {
      let amountSyntax
      const cryptoDisplayDenomination = UTILS.getDisplayDenomination(selectedCurrencyCode, settings)
      const cryptoExchangeDenomination = UTILS.getExchangeDenomination(guiWallet, selectedCurrencyCode, settings)
      const fiatDenomination = UTILS.getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
      const fiatSymbol = fiatDenomination.symbol ? fiatDenomination.symbol : ''
      if (nativeAmount && !bns.eq(nativeAmount, '0')) {
        const displayAmount = bns.div(nativeAmount, cryptoDisplayDenomination.multiplier, UTILS.DIVIDE_PRECISION)
        const exchangeAmount = bns.div(nativeAmount, cryptoExchangeDenomination.multiplier, UTILS.DIVIDE_PRECISION)
        const fiatAmount = convertCurrencyFromExchangeRates(exchangeRates, selectedCurrencyCode, guiWallet.isoFiatCurrencyCode, parseFloat(exchangeAmount))
        amountSyntax = `${displayAmount || '0'} ${cryptoDisplayDenomination.name} = (${fiatSymbol} ${fiatAmount.toFixed(2) || '0'})`
      } else {
        amountSyntax = `${'0'} ${cryptoDisplayDenomination.name} = (${fiatSymbol} ${'0'})`
      }

      return (
        <Tile
          type={lockInputs ? 'static' : 'touchable'}
          title={s.strings.fio_request_amount}
          onPress={lockInputs ? undefined : this.handleFlipinputModal}
          body={amountSyntax}
        />
      )
    }

    return null
  }

  renderFees() {
    const { error, exchangeRates, settings, transaction, theme } = this.props
    const { guiWallet, selectedCurrencyCode, recipientAddress } = this.state

    if (error) {
      return (
        <Tile type="static" title="Error">
          <EdgeText style={{ color: theme.dangerText }}>{error.message}</EdgeText>
        </Tile>
      )
    }

    if (recipientAddress) {
      const transactionFee = UTILS.convertTransactionFeeToDisplayFee(guiWallet, selectedCurrencyCode, exchangeRates, transaction, settings)
      const feeSyntax = `${transactionFee.cryptoSymbol || ''} ${transactionFee.cryptoAmount} (${transactionFee.fiatSymbol || ''} ${transactionFee.fiatAmount})`
      const feeSyntaxStyle = transactionFee.fiatStyle

      return (
        <Tile type="touchable" title={`${s.strings.string_fee}:`} onPress={this.handleFeesChange}>
          <EdgeText style={{ color: feeSyntaxStyle ? theme[feeSyntaxStyle] : theme.primaryText }}>{feeSyntax}</EdgeText>
        </Tile>
      )
    }

    return null
  }

  renderSelectFioAddress() {
    const { fioSender } = this.state

    return (
      <View>
        <SelectFioAddress
          selected={fioSender.fioAddress}
          memo={fioSender.memo}
          memoError={fioSender.memoError}
          onSelect={this.handleFioAddressSelect}
          onMemoChange={this.handleMemoChange}
        />
      </View>
    )
  }

  // Render
  render() {
    const { pending, resetSlider, sliderDisabled, theme } = this.props
    const { loading, recipientAddress } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="theme">
        <ScrollView>
          <View style={styles.tilesContainer}>
            {this.renderSelectedWallet()}
            {this.renderAddressTile()}
            {this.renderAmount()}
            {this.renderFees()}
            {this.renderSelectFioAddress()}
          </View>
          <Scene.Footer style={styles.footer}>
            {!!recipientAddress && (
              <Slider
                onSlidingComplete={this.submit}
                resetSlider={resetSlider}
                sliderDisabled={!recipientAddress && sliderDisabled}
                showSpinner={loading || pending}
              />
            )}
          </Scene.Footer>
        </ScrollView>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  tilesContainer: {
    flex: 1
  },
  footer: {
    margin: theme.rem(2)
  }
}))

export const SendScene = connect(
  (state: RootState): StateProps => {
    const { nativeAmount, transaction, error, pending, guiMakeSpendInfo } = state.ui.scenes.sendConfirmation
    return {
      account: state.core.account,
      defaultSelectedWalletId: state.ui.wallets.selectedWalletId,
      defaultSelectedWalletCurrencyCode: state.ui.wallets.selectedCurrencyCode,
      error,
      exchangeRates: state.exchangeRates,
      lockInputs: guiMakeSpendInfo.lockInputs,
      metadata: guiMakeSpendInfo && guiMakeSpendInfo.metadata ? guiMakeSpendInfo : undefined,
      nativeAmount,
      pending,
      resetSlider: !!error && (error.message === 'broadcastError' || error.message === 'transactionCancelled'),
      settings: state.ui.settings,
      sliderDisabled: !transaction || !!error || pending,
      transaction,
      wallets: state.ui.wallets.byId
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    onSelectWallet: (walletId: string, currencyCode: string) => {
      dispatch({ type: 'UI/WALLETS/SELECT_WALLET', data: { currencyCode: currencyCode, walletId: walletId } })
    },
    reset: () => dispatch(reset()),
    sendConfirmationUpdateTx: (guiMakeSpendInfo: GuiMakeSpendInfo, selectedWalletId: string, selectedCurrencyCode: string) =>
      dispatch(sendConfirmationUpdateTx(guiMakeSpendInfo, true, selectedWalletId, selectedCurrencyCode)),
    updateSpendPending: (pending: boolean) => dispatch(updateSpendPending(pending)),
    signBroadcastAndSave: (fioSender?: FioSenderInfo, selectedWalletId?: string, selectedCurrencyCode?: string): any =>
      dispatch(signBroadcastAndSave(fioSender, selectedWalletId, selectedCurrencyCode))
  })
)(withTheme(SendComponent))
