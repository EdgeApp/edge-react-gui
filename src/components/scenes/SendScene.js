// @flow

import { bns } from 'biggystring'
import { Scene } from 'edge-components'
import type { EdgeCurrencyWallet, EdgeParsedUri, EdgeSpendTarget } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import { connect } from 'react-redux'

import { type FioSenderInfo, reset, sendConfirmationUpdateTx, signBroadcastAndSave, updateSpendPending } from '../../actions/SendConfirmationActions.js'
import { FIO_STR } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings.js'
import { checkRecordSendFee, FIO_NO_BUNDLED_ERR_CODE } from '../../modules/FioAddress/util'
import { getDisplayDenomination } from '../../modules/Settings/selectors.js'
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
  // Wallet
  currencyCode: string,
  guiWallet: GuiWallet,
  coreWallet?: EdgeCurrencyWallet,

  // Fees
  feeSyntax: string,
  feeSyntaxStyle?: string,

  // Amount
  amountSyntax: string,

  // Slider
  sliderDisabled: boolean,
  resetSlider: boolean,
  pending: boolean,
  lockInputs?: boolean,
  error: Error | null
}

type DispatchProps = {
  onSelectWallet(walletId: string, currencyCode: string): void,
  reset: () => void,
  sendConfirmationUpdateTx: (guiMakeSpendInfo: GuiMakeSpendInfo) => Promise<void>, // Somehow has a return??
  signBroadcastAndSave: (fioSender?: FioSenderInfo) => void,
  updateSpendPending: boolean => void
}

type RouteProps = {
  allowedCurrencyCodes?: string[],
  guiMakeSpendInfo?: GuiMakeSpendInfo,
  selectedWalletId?: string,
  selectedCurrencyCode?: string
}

type Props = StateProps & DispatchProps & RouteProps & ThemeProps

type State = {
  recipientAddress: string,
  loading: boolean,
  fioSender: FioSenderInfo
}

class SendComponent extends React.PureComponent<Props, State> {
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
      }
    }
  }

  componentDidMount(): void {
    const { guiMakeSpendInfo, selectedWalletId, selectedCurrencyCode } = this.props

    if (guiMakeSpendInfo) {
      this.props.sendConfirmationUpdateTx(guiMakeSpendInfo)
      this.setState({ recipientAddress: guiMakeSpendInfo.publicAddress || '' })
    }

    if (selectedWalletId && selectedCurrencyCode) {
      this.props.onSelectWallet(selectedWalletId, selectedCurrencyCode)
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
    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.fio_src_wallet} allowedCurrencyCodes={this.props.allowedCurrencyCodes} />)
      .then(({ walletId, currencyCode }: WalletListResult) => {
        if (walletId && currencyCode) {
          this.props.onSelectWallet(walletId, currencyCode)
          this.resetSendTransaction()
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
    sendConfirmationUpdateTx(guiMakeSpendInfo)
    this.setState({ recipientAddress })
  }

  handleFlipinputModal = () => {
    Airship.show(bridge => <FlipInputModal bridge={bridge} walletId={this.props.guiWallet.id} currencyCode={this.props.currencyCode} />).catch(error =>
      console.log(error)
    )
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

  submit = async () => {
    const { guiMakeSpendInfo, currencyCode, updateSpendPending, signBroadcastAndSave } = this.props
    this.setState({ loading: true })

    if (guiMakeSpendInfo && (guiMakeSpendInfo.isSendUsingFioAddress || guiMakeSpendInfo.fioPendingRequest)) {
      const { fioSender } = this.state
      if (fioSender.fioWallet && fioSender.fioAddress && !guiMakeSpendInfo.fioPendingRequest) {
        updateSpendPending(true)
        try {
          await checkRecordSendFee(fioSender.fioWallet, fioSender.fioAddress)
        } catch (e) {
          updateSpendPending(false)
          if (e.code && e.code === FIO_NO_BUNDLED_ERR_CODE && currencyCode !== FIO_STR) {
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
              signBroadcastAndSave(fioSender)
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
    signBroadcastAndSave()

    this.setState({ loading: false })
  }

  renderSelectedWallet() {
    const { guiWallet, lockInputs } = this.props
    return (
      <Tile
        type={lockInputs ? 'static' : 'editable'}
        title={`${s.strings.step} 1: ${s.strings.select_wallet}`}
        onPress={lockInputs ? undefined : this.handleWalletPress}
        body={`${guiWallet.name} (${guiWallet.currencyCode})`}
      />
    )
  }

  renderAddressTile() {
    const { coreWallet, currencyCode, lockInputs } = this.props
    const { recipientAddress } = this.state

    if (coreWallet) {
      return (
        <AddressTile
          title={`${s.strings.step} 2: ${s.strings.transaction_details_recipient} ${s.strings.fragment_send_address}`}
          recipientAddress={recipientAddress}
          coreWallet={coreWallet}
          currencyCode={currencyCode}
          onChangeAddress={this.handleChangeAddress}
          resetSendTransaction={this.resetSendTransaction}
          lockInputs={lockInputs}
        />
      )
    }

    return null
  }

  renderAmount() {
    const { amountSyntax, lockInputs } = this.props
    const { recipientAddress } = this.state

    if (recipientAddress) {
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
    const { error, feeSyntax, feeSyntaxStyle, theme } = this.props
    const { recipientAddress } = this.state

    if (error) {
      return (
        <Tile type="static" title="Error">
          <EdgeText style={{ color: theme.dangerText }}>{error.message}</EdgeText>
        </Tile>
      )
    }

    if (recipientAddress) {
      return (
        <Tile type="static" title={`${s.strings.string_fee}:`}>
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
    const walletId = state.ui.wallets.selectedWalletId
    const wallets = state.ui.wallets.byId
    const guiWallet = wallets[walletId]
    const currencyCode = state.ui.wallets.selectedCurrencyCode
    const { fiatCurrencyCode } = guiWallet

    // Denominations
    const cryptoDenomination = getDisplayDenomination(state, currencyCode)
    const fiatDenomination = UTILS.getDenomFromIsoCode(fiatCurrencyCode)

    // Core Wallet
    const { account } = state.core
    const { currencyWallets } = account
    const coreWallet = currencyWallets ? currencyWallets[walletId] : undefined

    // Fees
    const transactionFee = UTILS.calculateTransactionFee(
      guiWallet,
      currencyCode,
      state.exchangeRates,
      state.ui.scenes.sendConfirmation.transaction,
      state.ui.settings
    )
    const feeSyntax = `${transactionFee.cryptoSymbol || ''} ${transactionFee.cryptoAmount} (${transactionFee.fiatSymbol || ''} ${transactionFee.fiatAmount})`
    const feeSyntaxStyle = transactionFee.fiatStyle

    // Amount
    let amountSyntax
    const { nativeAmount } = state.ui.scenes.sendConfirmation
    const fiatSymbol = fiatDenomination.symbol ? fiatDenomination.symbol : ''
    if (nativeAmount && !bns.eq(nativeAmount, '0')) {
      const exchangeAmount = bns.div(nativeAmount, cryptoDenomination.multiplier, UTILS.DIVIDE_PRECISION)
      const fiatAmount = convertCurrencyFromExchangeRates(state.exchangeRates, currencyCode, guiWallet.isoFiatCurrencyCode, parseFloat(exchangeAmount))
      amountSyntax = `${exchangeAmount || '0'} ${cryptoDenomination.name} = (${fiatSymbol} ${fiatAmount.toFixed(2) || '0'})`
    } else {
      amountSyntax = `${'0'} ${cryptoDenomination.name} = (${fiatSymbol} ${'0'})`
    }

    // Slider
    const { transaction, error, pending, guiMakeSpendInfo } = state.ui.scenes.sendConfirmation

    return {
      // Wallet
      currencyCode,
      guiWallet,
      coreWallet,

      // Fees
      feeSyntax,
      feeSyntaxStyle,

      // Amount
      amountSyntax,

      // slider
      resetSlider: !!error && (error.message === 'broadcastError' || error.message === 'transactionCancelled'),
      sliderDisabled: !transaction || !!error || pending,
      pending,
      lockInputs: guiMakeSpendInfo.lockInputs,
      error
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    onSelectWallet: (walletId: string, currencyCode: string) => {
      dispatch({ type: 'UI/WALLETS/SELECT_WALLET', data: { currencyCode: currencyCode, walletId: walletId } })
    },
    reset: () => dispatch(reset()),
    sendConfirmationUpdateTx: (guiMakeSpendInfo: GuiMakeSpendInfo) => dispatch(sendConfirmationUpdateTx(guiMakeSpendInfo)),
    updateSpendPending: (pending: boolean) => dispatch(updateSpendPending(pending)),
    signBroadcastAndSave: (fioSender?: FioSenderInfo): any => dispatch(signBroadcastAndSave(fioSender))
  })
)(withTheme(SendComponent))
