import {
  asMaybeNoAmountSpecifiedError,
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeDenomination,
  EdgeMetadata,
  EdgeParsedUri,
  EdgeSpendTarget,
  EdgeTransaction,
  JsonObject
} from 'edge-core-js'
import * as React from 'react'
import { TextInput, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { sprintf } from 'sprintf-js'

import { triggerScamWarningModal } from '../../actions/ScamWarningActions'
import { checkAndShowGetCryptoModal } from '../../actions/ScanActions'
import { FioSenderInfo, sendConfirmationUpdateTx, signBroadcastAndSave } from '../../actions/SendConfirmationActions'
import { selectWalletToken } from '../../actions/WalletActions'
import { FIO_STR, getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { lstrings } from '../../locales/strings'
import { getDisplayDenominationFromState, getExchangeDenominationFromState } from '../../selectors/DenominationSelectors'
import { config } from '../../theme/appConfig'
import { connect } from '../../types/reactRedux'
import { EdgeSceneProps, NavigationBase } from '../../types/routerTypes'
import { GuiExchangeRates, GuiMakeSpendInfo } from '../../types/types'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { checkRecordSendFee, FIO_NO_BUNDLED_ERR_CODE } from '../../util/FioAddressUtils'
import { convertTransactionFeeToDisplayFee } from '../../util/utils'
import { getMemoError, getMemoLabel, getMemoTitle } from '../../util/validateMemos'
import { WarningCard } from '../cards/WarningCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { FlipInputModal, FlipInputModalResult } from '../modals/FlipInputModal'
import { TextInputModal } from '../modals/TextInputModal'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { PinDots } from '../themed/PinDots'
import { SafeSlider } from '../themed/SafeSlider'
import { SelectFioAddress } from '../themed/SelectFioAddress'
import { AddressTile, AddressTileRef } from '../tiles/AddressTile'
import { EditableAmountTile } from '../tiles/EditableAmountTile'
import { ErrorTile } from '../tiles/ErrorTile'
import { Tile } from '../tiles/Tile'

const PIN_MAX_LENGTH = 4

interface OwnProps extends EdgeSceneProps<'send'> {}

interface StateProps {
  account: EdgeAccount
  authRequired: 'pin' | 'none'
  defaultSelectedWalletId: string
  defaultSelectedWalletCurrencyCode: string
  error: Error | null
  exchangeRates: GuiExchangeRates
  nativeAmount: string | null
  pin: string
  sliderDisabled: boolean
  transaction: EdgeTransaction | null
  transactionMetadata: EdgeMetadata | null
  isSendUsingFioAddress?: boolean
  guiMakeSpendInfo: GuiMakeSpendInfo
  maxSpendSet: boolean
  currencyWallets: { [walletId: string]: EdgeCurrencyWallet }
}

interface DispatchProps {
  reset: () => void
  sendConfirmationUpdateTx: (
    navigation: NavigationBase,
    guiMakeSpendInfo: GuiMakeSpendInfo,
    selectedWalletId?: string,
    selectedCurrencyCode?: string,
    isFeeChanged?: boolean
  ) => Promise<void>
  signBroadcastAndSave: (
    navigation: NavigationBase,
    fioSender: FioSenderInfo | undefined,
    selectedWalletId: string | undefined,
    selectedCurrencyCode: string | undefined,
    resetSlider: () => void
  ) => Promise<void>
  onChangePin: (pin: string) => void
  selectWalletToken: (navigation: NavigationBase, walletId: string, tokenId?: string) => Promise<void>
  getExchangeDenomination: (pluginId: string, currencyCode: string) => EdgeDenomination
  getDisplayDenomination: (pluginId: string, currencyCode: string) => EdgeDenomination
  checkAndShowGetCryptoModal: (navigation: NavigationBase, selectedWalletId?: string, selectedCurrencyCode?: string) => Promise<void>
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

interface WalletStates {
  selectedWalletId: string
  selectedCurrencyCode: string
  wallet: EdgeCurrencyWallet
  coreWallet?: EdgeCurrencyWallet
}

type State = {
  recipientAddress: string
  fioSender: FioSenderInfo
} & WalletStates

export interface SendSceneParams {
  guiMakeSpendInfo?: GuiMakeSpendInfo
  selectedWalletId?: string
  selectedCurrencyCode?: string
  isCameraOpen?: boolean
  lockTilesMap?: {
    address?: boolean
    wallet?: boolean
    amount?: boolean
  }
  hiddenFeaturesMap?: {
    address?: boolean
    amount?: boolean
    fioAddressSelect?: boolean
  }
  infoTiles?: Array<{ label: string; value: string }>
}

class SendComponent extends React.PureComponent<Props, State> {
  addressTile: AddressTileRef | null = null
  pinInput = React.createRef<TextInput>()

  constructor(props: Props) {
    super(props)
    const { route } = props
    const { selectedWalletId, selectedCurrencyCode, guiMakeSpendInfo } = route.params
    const fioPendingRequest = guiMakeSpendInfo?.fioPendingRequest
    this.state = {
      recipientAddress: '',
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
    const { account, defaultSelectedWalletId, defaultSelectedWalletCurrencyCode, currencyWallets } = this.props
    const walletId = selectedWalletId || defaultSelectedWalletId
    const currencyCode = selectedCurrencyCode || defaultSelectedWalletCurrencyCode
    return {
      selectedWalletId: walletId,
      selectedCurrencyCode: currencyCode,
      wallet: currencyWallets[walletId],
      coreWallet: account && account.currencyWallets ? account.currencyWallets[walletId] : undefined
    }
  }

  componentDidMount(): void {
    const { route } = this.props
    const { guiMakeSpendInfo } = route.params

    this.props
      .checkAndShowGetCryptoModal(this.props.navigation, this.props.route.params.selectedWalletId, this.props.route.params.selectedCurrencyCode)
      .catch(err => showError(err))

    if (guiMakeSpendInfo != null) {
      this.updateSendConfirmationTx(guiMakeSpendInfo, true).catch(err => showError(err))
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
    if (prevProps.route.params.guiMakeSpendInfo == null && this.props.route.params.guiMakeSpendInfo != null) {
      this.updateSendConfirmationTx(this.props.route.params.guiMakeSpendInfo).catch(err => showError(err))
    }
  }

  updateSendConfirmationTx = async (guiMakeSpendInfo: GuiMakeSpendInfo, isOnMount?: boolean) => {
    const { navigation } = this.props
    await this.props.sendConfirmationUpdateTx(navigation, guiMakeSpendInfo, this.state.selectedWalletId, this.state.selectedCurrencyCode)
    const recipientAddress =
      guiMakeSpendInfo && guiMakeSpendInfo.publicAddress
        ? guiMakeSpendInfo.publicAddress
        : guiMakeSpendInfo.spendTargets && guiMakeSpendInfo.spendTargets[0].publicAddress
        ? guiMakeSpendInfo.spendTargets[0].publicAddress
        : ''

    if (isOnMount && recipientAddress !== '') {
      // Show a scam warning for the first time this scene was mounted with a
      // pre-populated address.
      // A SendScene with the above initialization hides the scam warning that
      // is visible only when accessing the SendScene without a pre-populated
      // address
      await triggerScamWarningModal(this.props.account.disklet)
    }
    this.setState({ recipientAddress })
  }

  resetSendTransaction = () => {
    this.props.reset()
    this.setState({ recipientAddress: '' })
  }

  handleWalletPress = () => {
    const { account, navigation, selectWalletToken } = this.props
    const prevCurrencyCode = this.state.selectedCurrencyCode

    Airship.show<WalletListResult>(bridge => <WalletListModal bridge={bridge} navigation={navigation} headerTitle={lstrings.fio_src_wallet} />)
      .then(async ({ walletId, currencyCode }: WalletListResult) => {
        if (walletId == null || currencyCode == null) return
        const wallet = account.currencyWallets[walletId]
        const tokenId = getTokenId(account, wallet.currencyInfo.pluginId, currencyCode)

        await selectWalletToken(navigation, walletId, tokenId)
        this.setState({
          ...this.state,
          ...this.setWallets(this.props, walletId, currencyCode),
          recipientAddress: ''
        })

        if (this.addressTile == null) return
        if (currencyCode !== prevCurrencyCode) return this.resetSendTransaction()
        await this.addressTile.onChangeAddress(this.state.recipientAddress)
      })
      .catch(err => showError(err))
  }

  handleChangeAddressFromScan = async (newGuiMakeSpendInfo: GuiMakeSpendInfo, parsedUri?: EdgeParsedUri) => {
    const { navigation, sendConfirmationUpdateTx, route } = this.props
    const { guiMakeSpendInfo } = route.params
    const { spendTargets } = newGuiMakeSpendInfo
    const recipientAddress = parsedUri ? parsedUri.publicAddress : spendTargets && spendTargets[0].publicAddress ? spendTargets[0].publicAddress : ''

    if (parsedUri) {
      const nativeAmount = parsedUri.nativeAmount || ''
      const otherParams: JsonObject = {}
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
    await sendConfirmationUpdateTx(navigation, newGuiMakeSpendInfo, this.state.selectedWalletId, this.state.selectedCurrencyCode)

    // In this use case, the address is not populated on the SendScene and the
    // scam warning card is **technically** visible, but only for a split second
    // before the QR scanner appears.
    // Ensure the user sees the scam warning, if necessary.
    await triggerScamWarningModal(this.props.account.disklet)
    this.setState({ recipientAddress: recipientAddress ?? '' })
  }

  handleFlipInputModal = () => {
    const { navigation } = this.props
    Airship.show<FlipInputModalResult>(bridge => (
      <FlipInputModal
        bridge={bridge}
        navigation={navigation}
        onFeesChange={this.handleFeesChange}
        walletId={this.state.selectedWalletId}
        currencyCode={this.state.selectedCurrencyCode}
      />
    )).catch(error => console.log(error))
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
          navigation,
          { ...guiMakeSpendInfo, customNetworkFee, networkFeeOption },
          this.state.selectedWalletId,
          this.state.selectedCurrencyCode,
          true
        ).catch(err => showError(err))
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

  submitFio = async (isFioPendingRequest: boolean, resetSlider: () => void) => {
    const { fioSender } = this.state
    const { navigation, signBroadcastAndSave } = this.props
    const { selectedWalletId, selectedCurrencyCode } = this.state

    try {
      if (fioSender?.fioWallet != null && fioSender?.fioAddress != null && !isFioPendingRequest) {
        await checkRecordSendFee(fioSender.fioWallet, fioSender.fioAddress)
      }
      await signBroadcastAndSave(navigation, fioSender, selectedWalletId, selectedCurrencyCode, resetSlider)
    } catch (e: any) {
      if (e.code && e.code === FIO_NO_BUNDLED_ERR_CODE && selectedCurrencyCode !== FIO_STR) {
        const answer = await Airship.show<'ok' | 'cancel' | undefined>(bridge => (
          <ButtonsModal
            bridge={bridge}
            title={lstrings.fio_no_bundled_err_msg}
            message={`${lstrings.fio_no_bundled_non_fio_err_msg} ${lstrings.fio_no_bundled_add_err_msg}`}
            buttons={{
              ok: { label: lstrings.legacy_address_modal_continue },
              cancel: { label: lstrings.string_cancel_cap }
            }}
          />
        ))
        if (answer === 'ok') {
          fioSender.skipRecord = true
          await signBroadcastAndSave(navigation, fioSender, selectedWalletId, selectedCurrencyCode, resetSlider)
        }
      } else {
        showError(e)
      }
    }
  }

  submit = async (resetSlider: () => void) => {
    const { isSendUsingFioAddress, navigation, signBroadcastAndSave, route } = this.props
    const { guiMakeSpendInfo } = route.params
    const { selectedWalletId, selectedCurrencyCode } = this.state

    const isFioPendingRequest = !!guiMakeSpendInfo?.fioPendingRequest

    if (isSendUsingFioAddress || isFioPendingRequest) {
      await this.submitFio(isFioPendingRequest, resetSlider)
    } else {
      await signBroadcastAndSave(navigation, undefined, selectedWalletId, selectedCurrencyCode, resetSlider)
    }
  }

  renderSelectedWallet() {
    const {
      guiMakeSpendInfo: { lockInputs },
      route
    } = this.props
    const { lockTilesMap = {} } = route.params

    const { wallet, selectedCurrencyCode } = this.state
    const name = wallet == null ? '' : getWalletName(wallet)

    return (
      <Tile
        type={lockInputs || lockTilesMap.wallet ? 'static' : 'editable'}
        title={lstrings.send_scene_send_from_wallet}
        onPress={lockInputs || lockTilesMap.wallet ? undefined : this.handleWalletPress}
        body={`${name} (${selectedCurrencyCode})`}
      />
    )
  }

  renderAddressTile() {
    const {
      route,
      guiMakeSpendInfo: { lockInputs },
      navigation
    } = this.props
    const { isCameraOpen, lockTilesMap = {}, hiddenFeaturesMap = {} } = route.params
    const { recipientAddress, coreWallet, selectedCurrencyCode } = this.state

    if (coreWallet && !hiddenFeaturesMap.address) {
      return (
        <AddressTile
          title={lstrings.send_scene_send_to_address}
          recipientAddress={recipientAddress}
          coreWallet={coreWallet}
          currencyCode={selectedCurrencyCode}
          onChangeAddress={this.handleChangeAddressFromScan}
          resetSendTransaction={this.resetSendTransaction}
          lockInputs={lockInputs || lockTilesMap.address}
          isCameraOpen={!!isCameraOpen}
          ref={ref => (this.addressTile = ref)}
          navigation={navigation}
        />
      )
    }

    return null
  }

  renderScamWarning() {
    const { recipientAddress } = this.state
    if (recipientAddress === '') {
      const scamMessage = sprintf(lstrings.warning_scam_message_financial_advice_s, config.appName)
      const scamFooter = sprintf(lstrings.warning_scam_footer_s, config.supportEmail)

      return (
        <WarningCard
          title={lstrings.warning_scam_title}
          points={[scamMessage, lstrings.warning_scam_message_irreversibility, lstrings.warning_scam_message_unknown_recipients]}
          footer={scamFooter}
          marginRem={[1.5, 1]}
        />
      )
    }
    return null
  }

  renderAmount() {
    const {
      exchangeRates,
      guiMakeSpendInfo: { lockInputs },
      nativeAmount,
      route,
      currencyWallets,
      getExchangeDenomination,
      getDisplayDenomination
    } = this.props
    const { lockTilesMap = {}, hiddenFeaturesMap = {} } = route.params
    const { selectedCurrencyCode, recipientAddress } = this.state

    if (recipientAddress && !hiddenFeaturesMap.amount) {
      const cryptoDisplayDenomination = getDisplayDenomination(currencyWallets[this.state.selectedWalletId].currencyInfo.pluginId, selectedCurrencyCode)
      const cryptoExchangeDenomination = getExchangeDenomination(currencyWallets[this.state.selectedWalletId].currencyInfo.pluginId, selectedCurrencyCode)

      return (
        <EditableAmountTile
          title={lstrings.fio_request_amount}
          exchangeRates={exchangeRates}
          nativeAmount={nativeAmount ?? '0'}
          wallet={currencyWallets[this.state.selectedWalletId]}
          currencyCode={selectedCurrencyCode}
          exchangeDenomination={cryptoExchangeDenomination}
          displayDenomination={cryptoDisplayDenomination}
          lockInputs={lockInputs || (lockTilesMap.amount ?? false)}
          onPress={this.handleFlipInputModal}
        />
      )
    }

    return null
  }

  renderError() {
    const { error } = this.props
    if (error && asMaybeNoAmountSpecifiedError(error) == null) {
      return <ErrorTile message={error.message} />
    }
    return null
  }

  renderFees() {
    const { exchangeRates, transaction, theme, currencyWallets, getDisplayDenomination, getExchangeDenomination } = this.props
    const { selectedWalletId, recipientAddress } = this.state

    if (recipientAddress) {
      const wallet = currencyWallets[selectedWalletId]
      const { noChangeMiningFee } = getSpecialCurrencyInfo(wallet.currencyInfo.pluginId)
      const feeDisplayDenomination = getDisplayDenomination(wallet.currencyInfo.pluginId, wallet.currencyInfo.currencyCode)
      const feeDefaultDenomination = getExchangeDenomination(wallet.currencyInfo.pluginId, wallet.currencyInfo.currencyCode)
      const transactionFee = convertTransactionFeeToDisplayFee(wallet, exchangeRates, transaction, feeDisplayDenomination, feeDefaultDenomination)

      const fiatAmount = transactionFee.fiatAmount === '0' ? '0' : ` ${transactionFee.fiatAmount}`
      const feeSyntax = `${transactionFee.cryptoSymbol ?? ''} ${transactionFee.cryptoAmount} (${transactionFee.fiatSymbol ?? ''}${fiatAmount})`
      const feeSyntaxStyle = transactionFee.fiatStyle

      return (
        <Tile type={noChangeMiningFee ? 'static' : 'touchable'} title={`${lstrings.string_fee}:`} onPress={this.handleFeesChange}>
          <EdgeText
            style={{
              // @ts-expect-error
              color: feeSyntaxStyle ? theme[feeSyntaxStyle] : theme.primaryText
            }}
          >
            {feeSyntax}
          </EdgeText>
        </Tile>
      )
    }

    return null
  }

  renderMetadataNotes() {
    const { transactionMetadata } = this.props

    if (transactionMetadata && transactionMetadata.notes) {
      return (
        <Tile type="static" title={lstrings.send_scene_metadata_name_title}>
          <EdgeText>{transactionMetadata.notes}</EdgeText>
        </Tile>
      )
    }

    return null
  }

  renderSelectFioAddress() {
    const { navigation, isSendUsingFioAddress, route } = this.props
    const { fioSender } = this.state
    const { hiddenFeaturesMap = {}, guiMakeSpendInfo } = route.params
    const fioPendingRequest = guiMakeSpendInfo?.fioPendingRequest

    if (hiddenFeaturesMap.fioAddressSelect) return null
    return (
      <View>
        <SelectFioAddress
          navigation={navigation}
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
    const {
      navigation,
      guiMakeSpendInfo: { uniqueIdentifier },
      currencyWallets
    } = this.props
    const { recipientAddress, selectedWalletId } = this.state
    const edgeWallet = currencyWallets[selectedWalletId]

    const memoOptions = edgeWallet?.currencyInfo.memoOptions ?? []
    const [memoOption] = memoOptions.filter(option => option.hidden !== true)
    if (recipientAddress && memoOption != null) {
      const memoLabel = getMemoLabel(memoOption.memoName)
      const memoTitle = getMemoTitle(memoOption.memoName)
      const addButtonText = sprintf(lstrings.memo_dropdown_option_s, memoLabel)

      let maxLength: number | undefined
      if (memoOption.type === 'text') {
        maxLength = memoOption.maxLength
      } else if (memoOption.type === 'number') {
        maxLength = memoOption.maxValue?.length
      } else if (memoOption.type === 'hex' && memoOption.maxBytes != null) {
        maxLength = 2 * memoOption.maxBytes
      }

      const handleUniqueIdentifier = () => {
        Airship.show<string | undefined>(bridge => (
          <TextInputModal
            bridge={bridge}
            inputLabel={memoTitle}
            keyboardType={memoOption.type === 'number' ? 'numeric' : 'default'}
            maxLength={maxLength}
            message={sprintf(lstrings.unique_identifier_modal_description, memoLabel)}
            submitLabel={lstrings.unique_identifier_modal_confirm}
            title={memoTitle}
            onSubmit={async text =>
              getMemoError(
                {
                  type: memoOption.type,
                  memoName: memoOption.memoName,
                  value: text
                },
                memoOption
              ) ?? true
            }
          />
        ))
          .then(uniqueIdentifier => {
            if (uniqueIdentifier == null) return
            return this.props.sendConfirmationUpdateTx(navigation, { uniqueIdentifier })
          })
          .catch(err => showError(err))
      }

      return (
        <Tile type="touchable" title={memoTitle} onPress={handleUniqueIdentifier}>
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
        <Tile type="touchable" title={lstrings.four_digit_pin} onPress={this.handleFocusPin}>
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
    const { sliderDisabled, theme } = this.props
    const { recipientAddress } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="theme">
        <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
          {this.renderSelectedWallet()}
          {this.renderAddressTile()}
          {this.renderAmount()}
          {this.renderError()}
          {this.renderFees()}
          {this.renderMetadataNotes()}
          {this.renderSelectFioAddress()}
          {this.renderUniqueIdentifier()}
          {this.renderInfoTiles()}
          {this.renderAuthentication()}
          {this.renderScamWarning()}
          <View style={styles.footer}>{!!recipientAddress && <SafeSlider onSlidingComplete={this.submit} disabled={sliderDisabled} />}</View>
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

  amountText: {
    fontSize: theme.rem(2)
  },
  amountTextMuted: {
    color: theme.deactivatedText
  }
}))

export const SendScene = connect<StateProps, DispatchProps, OwnProps>(
  state => {
    const { nativeAmount, transaction, transactionMetadata, error, guiMakeSpendInfo, isSendUsingFioAddress } = state.ui.sendConfirmation

    return {
      account: state.core.account,
      authRequired: state.ui.sendConfirmation.authRequired,
      defaultSelectedWalletId: state.ui.wallets.selectedWalletId,
      defaultSelectedWalletCurrencyCode: state.ui.wallets.selectedCurrencyCode,
      error,
      exchangeRates: state.exchangeRates,
      nativeAmount,
      pin: state.ui.sendConfirmation.pin,
      sliderDisabled: !transaction,
      transaction,
      transactionMetadata,
      isSendUsingFioAddress,
      guiMakeSpendInfo,
      maxSpendSet: state.ui.sendConfirmation.maxSpendSet,
      currencyWallets: state.core.account.currencyWallets
    }
  },
  dispatch => ({
    reset() {
      dispatch({ type: 'UI/SEND_CONFIRMATION/RESET' })
    },
    async sendConfirmationUpdateTx(
      navigation: NavigationBase,
      guiMakeSpendInfo: GuiMakeSpendInfo,
      selectedWalletId?: string,
      selectedCurrencyCode?: string,
      isFeeChanged = false
    ) {
      await dispatch(sendConfirmationUpdateTx(navigation, guiMakeSpendInfo, true, selectedWalletId, selectedCurrencyCode, isFeeChanged))
    },
    async signBroadcastAndSave(
      navigation: NavigationBase,
      fioSender: FioSenderInfo | undefined,
      selectedWalletId: string | undefined,
      selectedCurrencyCode: string | undefined,
      resetSlider: () => void
    ) {
      await dispatch(signBroadcastAndSave(navigation, fioSender, selectedWalletId, selectedCurrencyCode, resetSlider))
    },
    onChangePin(pin: string) {
      dispatch({ type: 'UI/SEND_CONFIRMATION/NEW_PIN', data: { pin } })
    },
    async selectWalletToken(navigation: NavigationBase, walletId: string, tokenId?: string) {
      await dispatch(selectWalletToken({ navigation, walletId, tokenId }))
    },
    getExchangeDenomination(pluginId: string, currencyCode: string) {
      return dispatch(getExchangeDenominationFromState(pluginId, currencyCode))
    },
    getDisplayDenomination(pluginId: string, currencyCode: string) {
      return dispatch(getDisplayDenominationFromState(pluginId, currencyCode))
    },
    async checkAndShowGetCryptoModal(navigation: NavigationBase, selectedWalletId?: string, selectedCurrencyCode?: string) {
      await dispatch(checkAndShowGetCryptoModal(navigation, selectedWalletId, selectedCurrencyCode))
    }
  })
)(withTheme(SendComponent))
