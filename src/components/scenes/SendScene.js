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
import { sprintf } from 'sprintf-js'

import { type FioSenderInfo, sendConfirmationUpdateTx, signBroadcastAndSave } from '../../actions/SendConfirmationActions'
import { selectWallet } from '../../actions/WalletActions'
import { FIO_STR, getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { checkRecordSendFee, FIO_NO_BUNDLED_ERR_CODE } from '../../modules/FioAddress/util'
import { Slider } from '../../modules/UI/components/Slider/Slider'
import { convertCurrencyFromExchangeRates } from '../../selectors/WalletSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { type GuiExchangeRates, type GuiMakeSpendInfo, type GuiWallet } from '../../types/types.js'
import * as UTILS from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal'
import { FlipInputModal } from '../modals/FlipInputModal.js'
import { TextInputModal } from '../modals/TextInputModal.js'
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
  isSendUsingFioAddress?: boolean,
  guiMakeSpendInfo: GuiMakeSpendInfo,
  maxSpendSet: boolean
}

type DispatchProps = {
  reset: () => void,
  sendConfirmationUpdateTx: (guiMakeSpendInfo: GuiMakeSpendInfo, selectedWalletId?: string, selectedCurrencyCode?: string, isFeeChanged?: boolean) => void,
  signBroadcastAndSave: (fioSender?: FioSenderInfo, selectedWalletId?: string, selectedCurrencyCode?: string) => void,
  updateSpendPending: boolean => void,
  onChangePin: (pin: string) => void,
  selectWallet: (walletId: string, currencyCode: string) => void
}

type OwnProps = {
  navigation: NavigationProp<'send'>,
  route: RouteProp<'send'>
}
type Props = OwnProps & StateProps & DispatchProps & ThemeProps

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
  addressTile: AddressTile | void
  pinInput: { current: TextInput | null } = React.createRef()

  constructor(props: Props) {
    super(props)
    const { route } = this.props
    const { selectedWalletId, selectedCurrencyCode, guiMakeSpendInfo } = route.params
    const fioPendingRequest = guiMakeSpendInfo?.fioPendingRequest
    this.state = {
      recipientAddress: '',
      loading: false,
      resetSlider: false,
      fioSender: {
        fioAddress: fioPendingRequest?.payer_fio_address ?? '',
        fioWallet: null,
        fioError: '',
        memo: fioPendingRequest?.content.memo ?? '',
        memoError: ''
      },
      ...this.setWallets(props, selectedWalletId, selectedCurrencyCode)
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
    const { route } = this.props
    const { guiMakeSpendInfo } = route.params
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
    const { route } = this.props
    const { guiMakeSpendInfo } = route.params
    if (guiMakeSpendInfo && guiMakeSpendInfo.onBack) {
      guiMakeSpendInfo.onBack()
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
    const { selectWallet, route } = this.props
    const oldSelectedCurrencyCode = this.state.selectedCurrencyCode

    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.fio_src_wallet} allowedCurrencyCodes={route.params.allowedCurrencyCodes} />)
      .then(({ walletId, currencyCode }: WalletListResult) => {
        if (walletId && currencyCode) {
          selectWallet(walletId, currencyCode)
          this.setState(
            {
              ...this.state,
              ...this.setWallets(this.props, walletId, currencyCode)
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
    const { sendConfirmationUpdateTx, route } = this.props
    const { guiMakeSpendInfo } = route.params
    const { spendTargets } = newGuiMakeSpendInfo
    const recipientAddress = parsedUri ? parsedUri.publicAddress : spendTargets && spendTargets[0].publicAddress ? spendTargets[0].publicAddress : ''

    if (parsedUri) {
      const nativeAmount = parsedUri.nativeAmount || ''
      const otherParams = {}
      if (newGuiMakeSpendInfo.fioAddress != null) {
        otherParams.fioAddress = newGuiMakeSpendInfo.fioAddress
        otherParams.isSendUsingFioAddress = newGuiMakeSpendInfo.isSendUsingFioAddress
      }
      const spendTargets: EdgeSpendTarget[] = [
        {
          publicAddress: parsedUri.publicAddress,
          nativeAmount,
          otherParams
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

  handleFeesChange = () => {
    const { navigation, sendConfirmationUpdateTx, guiMakeSpendInfo, maxSpendSet } = this.props
    if (this.state.coreWallet == null) return
    navigation.navigate('changeMiningFee', {
      guiMakeSpendInfo,
      maxSpendSet,
      wallet: this.state.coreWallet,
      onSubmit: (networkFeeOption, customNetworkFee) => {
        sendConfirmationUpdateTx(
          { ...guiMakeSpendInfo, customNetworkFee, networkFeeOption },
          this.state.selectedWalletId,
          this.state.selectedCurrencyCode,
          true
        )
      }
    })
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

  handleFocusPin = () => {
    if (this.pinInput && this.pinInput.current) {
      this.pinInput.current.focus()
    }
  }

  handleChangePin = (pin: string) => {
    this.props.onChangePin(pin)
    if (pin.length >= PIN_MAX_LENGTH && this.pinInput.current != null) {
      this.pinInput.current.blur()
    }
  }

  submit = async () => {
    const { updateSpendPending, isSendUsingFioAddress, signBroadcastAndSave, route } = this.props
    const { guiMakeSpendInfo } = route.params
    const { selectedWalletId, selectedCurrencyCode } = this.state

    this.setState({ loading: true })

    const isFioPendingRequest = !!guiMakeSpendInfo?.fioPendingRequest
    if (isSendUsingFioAddress || isFioPendingRequest) {
      const { fioSender } = this.state
      if (fioSender.fioWallet != null && fioSender.fioAddress != null && !isFioPendingRequest) {
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
    const { lockInputs, route } = this.props
    const { lockTilesMap = {} } = route.params

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
    const { route, lockInputs } = this.props
    const { isCameraOpen, lockTilesMap = {}, hiddenTilesMap = {} } = route.params
    const { recipientAddress, coreWallet, selectedCurrencyCode } = this.state

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
    const { exchangeRates, lockInputs, nativeAmount, settings, theme, route } = this.props
    const { lockTilesMap = {}, hiddenTilesMap = {} } = route.params
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
    const styles = getStyles(theme)

    if (error && asMaybeNoAmountSpecifiedError(error) == null) {
      return (
        <Tile type="static" title={s.strings.send_scene_error_title}>
          <EdgeText style={styles.errorMessage} numberOfLines={3}>
            {error.message}
          </EdgeText>
        </Tile>
      )
    }
    return null
  }

  renderFees() {
    const { exchangeRates, settings, transaction, theme } = this.props
    const { guiWallet, selectedCurrencyCode, recipientAddress } = this.state
    const { noChangeMiningFee } = getSpecialCurrencyInfo(selectedCurrencyCode)

    if (recipientAddress) {
      const transactionFee = UTILS.convertTransactionFeeToDisplayFee(guiWallet, selectedCurrencyCode, exchangeRates, transaction, settings)
      const feeSyntax = `${transactionFee.cryptoSymbol || ''} ${transactionFee.cryptoAmount} (${transactionFee.fiatSymbol || ''} ${transactionFee.fiatAmount})`
      const feeSyntaxStyle = transactionFee.fiatStyle

      return (
        <Tile type={noChangeMiningFee ? 'static' : 'touchable'} title={`${s.strings.string_fee}:`} onPress={this.handleFeesChange}>
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
    const { isSendUsingFioAddress, route } = this.props
    const { fioSender } = this.state
    const { hiddenTilesMap = {}, guiMakeSpendInfo } = route.params
    const fioPendingRequest = guiMakeSpendInfo?.fioPendingRequest

    if (hiddenTilesMap.fioAddressSelect) return null
    return (
      <View>
        <SelectFioAddress
          selected={fioSender.fioAddress}
          memo={fioSender.memo}
          memoError={fioSender.memoError}
          onSelect={this.handleFioAddressSelect}
          onMemoChange={this.handleMemoChange}
          fioRequest={fioPendingRequest}
          isSendUsingFioAddress={isSendUsingFioAddress}
        />
      </View>
    )
  }

  renderUniqueIdentifier() {
    const { uniqueIdentifier } = this.props
    const { recipientAddress, selectedCurrencyCode } = this.state
    const { uniqueIdentifierInfo } = getSpecialCurrencyInfo(selectedCurrencyCode)

    if (recipientAddress && uniqueIdentifierInfo != null) {
      const { addButtonText, identifierName, keyboardType } = uniqueIdentifierInfo

      const handleUniqueIdentifier = () => {
        Airship.show(bridge => (
          <TextInputModal
            bridge={bridge}
            inputLabel={identifierName}
            keyboardType={keyboardType}
            message={sprintf(s.strings.unique_identifier_modal_description, identifierName)}
            submitLabel={s.strings.unique_identifier_modal_confirm}
            title={identifierName}
          />
        )).then(uniqueIdentifier => {
          if (uniqueIdentifier == null) return
          this.props.sendConfirmationUpdateTx({ uniqueIdentifier })
        })
      }

      return (
        <Tile type="touchable" title={identifierName} onPress={handleUniqueIdentifier}>
          <EdgeText>{uniqueIdentifier ?? addButtonText}</EdgeText>
        </Tile>
      )
    }

    return null
  }

  renderInfoTiles() {
    const { route } = this.props
    const { infoTiles } = route.params

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
        <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
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
  },
  errorMessage: {
    color: theme.dangerText
  }
}))

export const SendScene = connect<StateProps, DispatchProps, OwnProps>(
  state => {
    const { nativeAmount, transaction, transactionMetadata, error, pending, guiMakeSpendInfo, isSendUsingFioAddress } = state.ui.scenes.sendConfirmation

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
      isSendUsingFioAddress,
      guiMakeSpendInfo,
      maxSpendSet: state.ui.scenes.sendConfirmation.maxSpendSet
    }
  },
  dispatch => ({
    reset() {
      dispatch({ type: 'UI/SEND_CONFIRMATION/RESET' })
    },
    sendConfirmationUpdateTx(guiMakeSpendInfo: GuiMakeSpendInfo, selectedWalletId?: string, selectedCurrencyCode?: string, isFeeChanged = false) {
      dispatch(sendConfirmationUpdateTx(guiMakeSpendInfo, true, selectedWalletId, selectedCurrencyCode, isFeeChanged))
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
    onChangePin(pin: string) {
      dispatch({ type: 'UI/SEND_CONFIRMATION/NEW_PIN', data: { pin } })
    },
    selectWallet(walletId: string, currencyCode: string) {
      dispatch(selectWallet(walletId, currencyCode))
    }
  })
)(withTheme(SendComponent))
