// @flow

import { bns } from 'biggystring'
import {
  type EdgeAccount,
  type EdgeCurrencyWallet,
  type EdgeMetadata,
  type EdgeParsedUri,
  type EdgeSpendTarget,
  type EdgeTransaction,
  asMaybeNoAmountSpecifiedError
} from 'edge-core-js'
import * as React from 'react'
import { TextInput, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import { type FioSenderInfo, sendConfirmationUpdateTx, signBroadcastAndSave } from '../../actions/SendConfirmationActions'
import { selectWallet } from '../../actions/WalletActions'
import { CHANGE_MINING_FEE } from '../../constants/SceneKeys.js'
import { FIO_STR, getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { checkRecordSendFee, FIO_NO_BUNDLED_ERR_CODE } from '../../modules/FioAddress/util'
import { Slider } from '../../modules/UI/components/Slider/Slider'
import { convertCurrencyFromExchangeRates } from '../../selectors/WalletSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { Actions } from '../../types/routerTypes.js'
import { type GuiExchangeRates, type GuiMakeSpendInfo, type GuiWallet } from '../../types/types.js'
import * as UTILS from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal'
import { FlipInputModal } from '../modals/FlipInputModal.js'
import { UniqueIdentifierModal } from '../modals/UniqueIdentifierModal.js'
import type { WalletListResult } from '../modals/WalletListModal'
import { WalletListModal } from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { AddressTile } from '../themed/AddressTile.js'
import { EdgeText } from '../themed/EdgeText'
import { PinDots } from '../themed/PinDots.js'
import { SelectFioAddress } from '../themed/SelectFioAddress.js'
import { Tile } from '../themed/Tile.js'

const PIN_MAX_LENGTH = 4

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
  sendConfirmationUpdateTx: (guiMakeSpendInfo: GuiMakeSpendInfo, selectedWalletId?: string, selectedCurrencyCode?: string) => void,
  signBroadcastAndSave: (fioSender?: FioSenderInfo, selectedWalletId?: string, selectedCurrencyCode?: string) => void,
  updateSpendPending: boolean => void,
  uniqueIdentifierButtonPressed: () => void,
  onChangePin: (pin: string) => void,
  selectWallet: (walletId: string, currencyCode: string) => void
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
  fioSender: FioSenderInfo
} & WalletStates

class SendComponent extends React.PureComponent<Props, State> {
  addressTile: ?React.ElementRef<typeof AddressTile>
  pinInput: ?React.ElementRef<typeof TextInput> = React.createRef()

  constructor(props: Props) {
    super(props)
    this.state = {
      recipientAddress: '',
      loading: false,
      resetSlider: false,
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
          props.selectWallet(walletId, currencyCode)
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
      const nativeAmount = parsedUri.nativeAmount || ''
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

  handleFlipInputModal = () => {
    Airship.show(bridge => <FlipInputModal bridge={bridge} walletId={this.state.selectedWalletId} currencyCode={this.state.selectedCurrencyCode} />).catch(
      error => console.log(error)
    )
  }

  handleFeesChange = () =>
    Actions.push(CHANGE_MINING_FEE, {
      wallet: this.state.coreWallet,
      currencyCode: this.state.selectedCurrencyCode
    })

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

  handleFocusPin = () => {
    if (this.pinInput && this.pinInput.current) {
      this.pinInput.current.focus()
    }
  }

  handleChangePin = (pin: string) => {
    this.props.onChangePin(pin)
    if (pin.length >= PIN_MAX_LENGTH && this.pinInput) {
      this.pinInput.current.blur()
    }
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

    return (
      <Tile
        type={lockInputs || lockTilesMap.wallet ? 'static' : 'editable'}
        title={s.strings.send_scene_send_from_wallet}
        onPress={lockInputs || lockTilesMap.wallet ? undefined : this.handleWalletPress}
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

  renderAmount() {
    const { exchangeRates, lockInputs, lockTilesMap = {}, hiddenTilesMap = {}, nativeAmount, settings, theme } = this.props
    const { guiWallet, selectedCurrencyCode, recipientAddress } = this.state

    if (recipientAddress && !hiddenTilesMap.amount) {
      let cryptoAmountSyntax
      let fiatAmountSyntax
      const cryptoDisplayDenomination = UTILS.getDenomination(selectedCurrencyCode, settings, 'display')
      const cryptoExchangeDenomination = UTILS.getDenomination(selectedCurrencyCode, settings, 'exchange')
      const fiatDenomination = UTILS.getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
      const fiatSymbol = fiatDenomination.symbol ? fiatDenomination.symbol : ''
      if (nativeAmount === '') {
        cryptoAmountSyntax = s.strings.string_amount
      } else if (nativeAmount != null && !bns.eq(nativeAmount, '0')) {
        const displayAmount = bns.div(nativeAmount, cryptoDisplayDenomination.multiplier, UTILS.DECIMAL_PRECISION)
        const exchangeAmount = bns.div(nativeAmount, cryptoExchangeDenomination.multiplier, UTILS.DECIMAL_PRECISION)
        const fiatAmount = convertCurrencyFromExchangeRates(exchangeRates, selectedCurrencyCode, guiWallet.isoFiatCurrencyCode, exchangeAmount)
        cryptoAmountSyntax = `${displayAmount ?? '0'} ${cryptoDisplayDenomination.name}`
        if (fiatAmount) {
          fiatAmountSyntax = `${fiatSymbol} ${bns.toFixed(fiatAmount, 2, 2) ?? '0'}`
        }
      } else {
        cryptoAmountSyntax = `0 ${cryptoDisplayDenomination.name}`
      }

      return (
        <Tile
          type={lockInputs || lockTilesMap.amount ? 'static' : 'touchable'}
          title={s.strings.fio_request_amount}
          onPress={lockInputs || lockTilesMap.amount ? undefined : this.handleFlipInputModal}
        >
          <EdgeText style={{ fontSize: theme.rem(2) }}>{cryptoAmountSyntax}</EdgeText>
          {fiatAmountSyntax == null ? null : <EdgeText>{fiatAmountSyntax}</EdgeText>}
        </Tile>
      )
    }

    return null
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

  renderFees() {
    const { exchangeRates, settings, transaction, theme } = this.props
    const { guiWallet, selectedCurrencyCode, recipientAddress } = this.state

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

  renderMetadata() {
    const { transactionMetadata } = this.props

    if (transactionMetadata && transactionMetadata.name) {
      return (
        <Tile type="static" title={s.strings.send_scene_metadata_name_title}>
          <EdgeText>{transactionMetadata.name}</EdgeText>
        </Tile>
      )
    }

    return null
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

  renderUniqueIdentifier() {
    const { sendConfirmationUpdateTx, uniqueIdentifier, uniqueIdentifierButtonPressed } = this.props
    const { recipientAddress, selectedCurrencyCode } = this.state
    const uniqueIdentifierInfo = getSpecialCurrencyInfo(selectedCurrencyCode || '').uniqueIdentifier

    if (recipientAddress && uniqueIdentifierInfo) {
      const { addButtonText, identifierName } = uniqueIdentifierInfo

      return (
        <>
          <Tile type="touchable" title={identifierName} onPress={uniqueIdentifierButtonPressed}>
            <EdgeText>{uniqueIdentifier || addButtonText}</EdgeText>
          </Tile>
          <UniqueIdentifierModal onConfirm={sendConfirmationUpdateTx} currencyCode={selectedCurrencyCode} />
        </>
      )
    }

    return null
  }

  renderInfoTiles() {
    const { infoTiles } = this.props

    if (!infoTiles || !infoTiles.length) return null
    return infoTiles.map(({ label, value }) => <Tile key={label} type="static" title={label} body={value} />)
  }

  renderAuthentication() {
    const { authRequired, pin, theme } = this.props
    const styles = getStyles(theme)

    if (authRequired === 'pin') {
      return (
        <Tile type="touchable" title={s.strings.four_digit_pin} onPress={this.handleFocusPin}>
          <View style={styles.pinContainer}>
            <PinDots pinLength={pin.length} maxLength={PIN_MAX_LENGTH} />
          </View>
          <TextInput
            ref={this.pinInput}
            maxLength={PIN_MAX_LENGTH}
            onChangeText={this.handleChangePin}
            keyboardType="numeric"
            returnKeyType="done"
            placeholder="Enter PIN"
            placeholderTextColor={theme.textLink}
            style={styles.pinInput}
            value={pin}
            secureTextEntry
          />
        </Tile>
      )
    }

    return null
  }

  // Render
  render() {
    const { pending, resetSlider, sliderDisabled, theme } = this.props
    const { loading, recipientAddress, resetSlider: localResetSlider } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="theme">
        <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)}>
          {this.renderSelectedWallet()}
          {this.renderAddressTile()}
          {this.renderAmount()}
          {this.renderError()}
          {this.renderFees()}
          {this.renderMetadata()}
          {this.renderSelectFioAddress()}
          {this.renderUniqueIdentifier()}
          {this.renderInfoTiles()}
          {this.renderAuthentication()}
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
  pinContainer: {
    marginTop: theme.rem(0.25)
  },
  pinInput: {
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    color: theme.primaryText,
    position: 'absolute',
    width: 0,
    height: 0
  }
}))

export const SendScene = connect<StateProps, DispatchProps, RouteProps>(
  (state, ownProps) => {
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
  dispatch => ({
    reset() {
      dispatch({ type: 'UI/SEND_CONFIRMATION/RESET' })
    },
    sendConfirmationUpdateTx(guiMakeSpendInfo: GuiMakeSpendInfo, selectedWalletId?: string, selectedCurrencyCode?: string) {
      dispatch(sendConfirmationUpdateTx(guiMakeSpendInfo, true, selectedWalletId, selectedCurrencyCode))
    },
    updateSpendPending(pending: boolean) {
      dispatch({
        type: 'UI/SEND_CONFIRMATION/UPDATE_SPEND_PENDING',
        data: { pending }
      })
    },
    signBroadcastAndSave(fioSender?: FioSenderInfo, selectedWalletId?: string, selectedCurrencyCode?: string) {
      dispatch(signBroadcastAndSave(fioSender, selectedWalletId, selectedCurrencyCode))
    },
    uniqueIdentifierButtonPressed() {
      dispatch({ type: 'UNIQUE_IDENTIFIER_MODAL/ACTIVATED' })
    },
    onChangePin(pin: string) {
      dispatch({ type: 'UI/SEND_CONFIRMATION/NEW_PIN', data: { pin } })
    },
    selectWallet(walletId: string, currencyCode: string) {
      dispatch(selectWallet(walletId, currencyCode))
    }
  })
)(withTheme(SendComponent))
