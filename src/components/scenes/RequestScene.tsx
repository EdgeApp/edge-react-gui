import Clipboard from '@react-native-clipboard/clipboard'
import { lt } from 'biggystring'
import { EdgeCurrencyWallet, EdgeDenomination, EdgeEncodeUri, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Linking, Platform, Text, View } from 'react-native'
import Share, { ShareOptions } from 'react-native-share'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions'
import { toggleAccountBalanceVisibility } from '../../actions/LocalSettingsActions'
import { selectWalletToken } from '../../actions/WalletActions'
import { Fontello } from '../../assets/vector'
import { getSpecialCurrencyInfo, SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useIconColor } from '../../hooks/useIconColor'
import { lstrings } from '../../locales/strings'
import { selectDisplayDenom } from '../../selectors/DenominationSelectors'
import { getExchangeRate } from '../../selectors/WalletSelectors'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps, NavigationBase } from '../../types/routerTypes'
import { getCurrencyCode, isKeysOnlyPlugin } from '../../util/CurrencyInfoHelpers'
import { getAvailableBalance, getWalletName } from '../../util/CurrencyWalletHelpers'
import { triggerHaptic } from '../../util/haptic'
import { convertNativeToDenomination, darkenHexColor, truncateDecimals, zeroString } from '../../util/utils'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeCard } from '../cards/EdgeCard'
import { AccentColors } from '../common/DotsBackground'
import { EdgeAnim, fadeInDown50, fadeInDown75, fadeInUp25, fadeInUp50, fadeInUp80 } from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { AddressModal } from '../modals/AddressModal'
import { ButtonsModal } from '../modals/ButtonsModal'
import { QrModal } from '../modals/QrModal'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { showWebViewModal } from '../modals/WebViewModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, useTheme } from '../services/ThemeContext'
import { FiatText } from '../text/FiatText'
import { AddressQr } from '../themed/AddressQr'
import { Carousel } from '../themed/Carousel'
import { EdgeText } from '../themed/EdgeText'
import { ExchangedFlipInput2, ExchangedFlipInputAmounts, ExchangedFlipInputRef } from '../themed/ExchangedFlipInput2'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'
import { ShareButtons } from '../themed/ShareButtons'

export interface RequestParams {
  tokenId: EdgeTokenId
  walletId: string
}

interface OwnProps extends EdgeAppSceneProps<'request'> {
  wallet: EdgeCurrencyWallet
}

interface StateProps {
  currencyCode: string
  displayDenomination: EdgeDenomination
  exchangeSecondaryToPrimaryRatio: string
  fioAddressesExist: boolean
  isConnected: boolean
  isLightAccount: boolean
  showBalance: boolean
  wallet: EdgeCurrencyWallet
}

interface DispatchProps {
  refreshAllFioAddresses: () => Promise<void>
  onSelectWallet: (walletId: string, tokenId: EdgeTokenId) => Promise<void>
  toggleAccountBalanceVisibility: () => void
}
type ModalState = 'NOT_YET_SHOWN' | 'VISIBLE' | 'SHOWN'
interface CurrencyMinimumPopupState {
  [pluginId: string]: ModalState
}

interface HookProps {
  iconColor?: string
}

type Props = StateProps & DispatchProps & OwnProps & ThemeProps

interface State {
  addresses: AddressInfo[]
  selectedAddress?: AddressInfo
  amounts?: ExchangedFlipInputAmounts
  minimumPopupModalState: CurrencyMinimumPopupState
  isFioMode: boolean
  errorMessage?: string
}

interface AddressInfo {
  addressString: string
  label: string
}

const inputAccessoryViewID: string = 'cancelHeaderId'

export class RequestSceneComponent extends React.Component<Props & HookProps, State> {
  flipInputRef: React.RefObject<ExchangedFlipInputRef>
  unsubscribeAddressChanged: (() => void) | undefined

  constructor(props: Props) {
    super(props)
    this.flipInputRef = React.createRef<ExchangedFlipInputRef>()
    const minimumPopupModalState: CurrencyMinimumPopupState = {}
    Object.keys(SPECIAL_CURRENCY_INFO).forEach(pluginId => {
      if (getSpecialCurrencyInfo(pluginId).minimumPopupModals) {
        minimumPopupModalState[pluginId] = 'NOT_YET_SHOWN'
      }
    })
    this.state = {
      addresses: [],
      minimumPopupModalState,
      isFioMode: false
    }
    if (this.shouldShowMinimumModal(props)) {
      const { wallet } = props
      if (wallet == null) return
      this.state.minimumPopupModalState[wallet.currencyInfo.pluginId] = 'VISIBLE'
      console.log('stop, in constructor')
      this.enqueueMinimumAmountModal().catch(err => showError(err))
    }
  }

  componentDidMount() {
    this.getAddressItems().catch(err => showError(err))
    this.props.refreshAllFioAddresses().catch(err => showError(err))
    if (this.props.wallet != null) {
      this.unsubscribeAddressChanged = this.props.wallet.on('addressChanged', async () => await this.getAddressItems())
    }
  }

  componentWillUnmount() {
    if (this.unsubscribeAddressChanged != null) this.unsubscribeAddressChanged()
  }

  async getAddressItems() {
    const { wallet, currencyCode } = this.props
    if (currencyCode == null) return
    if (wallet == null) return
    if (isKeysOnlyPlugin(wallet.currencyInfo.pluginId)) return

    const receiveAddress = await wallet.getReceiveAddress({ tokenId: null })
    const addresses: AddressInfo[] = []

    // Handle segwitAddress
    if (receiveAddress.segwitAddress != null) {
      addresses.push({
        addressString: receiveAddress.segwitAddress,
        label: lstrings.request_qr_your_segwit_address
      })
    }
    // Handle publicAddress
    addresses.push({
      addressString: receiveAddress.publicAddress,
      label: receiveAddress.segwitAddress != null ? lstrings.request_qr_your_wrapped_segwit_address : lstrings.request_qr_your_wallet_address
    })
    // Handle legacyAddress
    if (receiveAddress.legacyAddress != null) {
      addresses.push({
        addressString: receiveAddress.legacyAddress,
        label: lstrings.request_qr_your_legacy_address
      })
    }

    this.setState({ addresses, selectedAddress: addresses[0] })
  }

  async getEncodedUri(): Promise<string | undefined> {
    const { wallet, currencyCode } = this.props
    const { amounts, selectedAddress } = this.state

    if (wallet == null || currencyCode == null || selectedAddress == null) return

    return await wallet.encodeUri({ currencyCode, publicAddress: selectedAddress.addressString, nativeAmount: amounts?.nativeAmount })
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { currencyCode, wallet } = this.props
    if (wallet == null || currencyCode == null) return

    const { pluginId } = wallet.currencyInfo

    const didAddressChange = prevState.selectedAddress !== this.state.selectedAddress
    const didWalletChange = prevProps.wallet && wallet.id !== prevProps.wallet.id

    if (didWalletChange) {
      this.getAddressItems().catch(err => showError(err))
    }

    // old blank address to new
    // include 'didAddressChange' because didWalletChange returns false upon initial request scene load
    if (didWalletChange || didAddressChange) {
      if (this.shouldShowMinimumModal(this.props)) {
        const minimumPopupModalState: CurrencyMinimumPopupState = Object.assign({}, this.state.minimumPopupModalState)
        if (minimumPopupModalState[pluginId] === 'NOT_YET_SHOWN') {
          this.enqueueMinimumAmountModal().catch(err => showError(err))
        }
        minimumPopupModalState[pluginId] = 'VISIBLE'
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({ minimumPopupModalState })
      }
    }
  }

  enqueueMinimumAmountModal = async () => {
    const { wallet } = this.props
    if (wallet == null) return
    const { pluginId } = wallet.currencyInfo
    const { minimumPopupModals } = getSpecialCurrencyInfo(pluginId)
    if (minimumPopupModals == null) return

    await Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.request_minimum_notification_title}
        message={minimumPopupModals.modalMessage}
        buttons={{ ok: { label: lstrings.string_ok } }}
      />
    ))

    // resolve value doesn't really matter here
    this.setState(state => ({
      minimumPopupModalState: {
        ...state.minimumPopupModalState,
        [pluginId]: 'SHOWN'
      }
    }))
  }

  handleAddressBlockExplorer = () => {
    const { wallet } = this.props
    const addressExplorer = wallet != null ? wallet.currencyInfo.addressExplorer : null
    if (this.state.selectedAddress == null) return
    const requestAddress = this.state.selectedAddress.addressString

    Airship.show<'confirm' | 'cancel' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.modal_addressexplorer_message}
        message={requestAddress}
        buttons={{
          confirm: { label: lstrings.string_ok_cap },
          cancel: { label: lstrings.string_cancel_cap }
        }}
      />
    ))
      .then(async (result?: string) => {
        if (result === 'confirm' && addressExplorer != null) {
          const url = sprintf(addressExplorer, requestAddress)
          await Linking.openURL(url).catch(error => showError(error))
        }
      })
      .catch(error => showError(error))
  }

  handleOpenWalletListModal = async () => {
    const { navigation } = this.props
    const result = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal bridge={bridge} headerTitle={lstrings.select_wallet} navigation={this.props.navigation as NavigationBase} />
    ))
    if (result?.type === 'wallet') {
      const { walletId, tokenId } = result
      navigation.setParams({ tokenId, walletId })
      await this.props.onSelectWallet(walletId, tokenId)

      if (this.flipInputRef.current != null) {
        this.flipInputRef.current.setAmount('fiat', this.state.amounts?.fiatAmount ?? '0')
      }
    }
  }

  onError = (errorMessage?: string) => this.setState({ errorMessage })

  handleKeysOnlyModePress = async () => await showWebViewModal(lstrings.help_support, config.supportSite)
  renderKeysOnlyMode = () => {
    const styles = getStyles(this.props.theme)
    return (
      <SceneWrapper>
        <SceneHeader title={sprintf(lstrings.request_deprecated_header, this.props.wallet?.currencyInfo.displayName)} underline withTopMargin />
        <Text style={styles.keysOnlyModeText}>{sprintf(lstrings.request_deprecated_currency_code, this.props.currencyCode)}</Text>
        <MainButton onPress={this.handleKeysOnlyModePress} label={lstrings.help_support} marginRem={[4, 0, 2]} type="secondary">
          <Fontello name="help_headset" color={this.props.theme.iconTappable} size={this.props.theme.rem(1.5)} />
        </MainButton>
      </SceneWrapper>
    )
  }

  handleBackupPress = () => this.props.navigation.navigate('upgradeUsername')
  renderLightAccountMode = () => {
    const styles = getStyles(this.props.theme)
    return (
      <SceneWrapper>
        <SceneHeader title={lstrings.fragment_request_subtitle} underline withTopMargin />
        <View style={styles.container}>
          <EdgeText numberOfLines={0} style={styles.backupText}>
            {sprintf(lstrings.backup_for_transfer_message, config.appName)}
          </EdgeText>
          <ButtonsView parentType="scene" primary={{ label: lstrings.backup_account, onPress: this.handleBackupPress }} />
        </View>
      </SceneWrapper>
    )
  }

  handleChangeAddressItem = (item: AddressInfo) => {
    this.setState({ selectedAddress: item })
  }

  handlePressAddressItem = async (encodedUri?: string) => {
    const { route, wallet } = this.props
    const { tokenId } = route.params
    Airship.show(bridge => <QrModal bridge={bridge} tokenId={tokenId} wallet={wallet} data={encodedUri} />).catch(err => showError(err))
  }

  toggleBalanceVisibility = () => {
    triggerHaptic('impactLight')
    this.props.toggleAccountBalanceVisibility()
  }

  render() {
    const { currencyCode, exchangeSecondaryToPrimaryRatio, iconColor, isLightAccount, wallet, displayDenomination, theme, route } = this.props
    const { tokenId } = route.params
    const styles = getStyles(theme)

    if (currencyCode == null || exchangeSecondaryToPrimaryRatio == null || wallet == null) {
      return <ActivityIndicator color={theme.primaryText} style={styles.loader} size="large" />
    }

    const selectedAddress = this.state.selectedAddress
    const requestAddress = selectedAddress?.addressString ?? lstrings.loading
    const flipInputHeaderText = sprintf(lstrings.send_to_wallet, getWalletName(wallet))
    const keysOnlyMode = isKeysOnlyPlugin(wallet.currencyInfo.pluginId)
    const addressExplorerDisabled = wallet.currencyInfo.addressExplorer === ''

    // Balance
    const nativeBalance = getAvailableBalance(wallet, tokenId)
    const displayBalanceAmount = convertNativeToDenomination(displayDenomination.multiplier)(nativeBalance)
    const displayBalanceString = sprintf(lstrings.request_balance, `${truncateDecimals(displayBalanceAmount)} ${displayDenomination.name}`)

    // Selected denomination
    const denomString = `1 ${displayDenomination.name}`

    const accentColors: AccentColors = {
      // Transparent fallback for while iconColor is loading
      iconAccentColor: iconColor ?? '#00000000'
    }

    const backgroundColors = [...theme.assetBackgroundGradientColors]
    if (iconColor != null) {
      const scaledColor = darkenHexColor(iconColor, theme.assetBackgroundColorScale)
      backgroundColors[0] = scaledColor
    }

    return isLightAccount ? (
      this.renderLightAccountMode()
    ) : keysOnlyMode ? (
      this.renderKeysOnlyMode()
    ) : (
      <SceneWrapper
        accentColors={accentColors}
        backgroundGradientColors={backgroundColors}
        backgroundGradientEnd={theme.assetBackgroundGradientEnd}
        backgroundGradientStart={theme.assetBackgroundGradientStart}
        overrideDots={theme.backgroundDots.assetOverrideDots}
      >
        <View style={styles.container}>
          <EdgeAnim style={styles.requestContainer} enter={fadeInUp80}>
            <EdgeText style={styles.title}>{lstrings.fragment_request_subtitle}</EdgeText>
            <EdgeText style={styles.exchangeRate}>{denomString}</EdgeText>
          </EdgeAnim>
          <EdgeAnim style={styles.balanceContainer} enter={fadeInUp50}>
            <EdgeTouchableOpacity onPress={this.toggleBalanceVisibility} style={styles.balanceAmountContainer}>
              {this.props.showBalance ? <EdgeText>{displayBalanceString}</EdgeText> : <EdgeText>{lstrings.string_show_balance}</EdgeText>}
            </EdgeTouchableOpacity>
            <EdgeText style={styles.exchangeRate}>
              <FiatText appendFiatCurrencyCode nativeCryptoAmount={displayDenomination.multiplier} tokenId={tokenId} wallet={wallet} />
            </EdgeText>
          </EdgeAnim>
          {this.state.errorMessage != null ? <EdgeText style={styles.errorText}>{this.state.errorMessage}</EdgeText> : null}

          <EdgeAnim enter={fadeInUp25}>
            <EdgeCard marginRem={0}>
              <ExchangedFlipInput2
                forceField="crypto"
                headerCallback={this.handleOpenWalletListModal}
                headerText={flipInputHeaderText}
                inputAccessoryViewID={this.state.isFioMode ? inputAccessoryViewID : undefined}
                keyboardVisible={false}
                onAmountChanged={this.onExchangeAmountChanged}
                ref={this.flipInputRef}
                returnKeyType={this.state.isFioMode ? 'next' : 'done'}
                tokenId={tokenId}
                wallet={wallet}
              />
            </EdgeCard>
          </EdgeAnim>

          {this.state.addresses.length === 1 ? (
            <View style={styles.qrContainer}>
              <AddressQr
                address={this.state.addresses[0].addressString}
                wallet={wallet}
                tokenId={tokenId}
                nativeAmount={this.state.amounts?.nativeAmount}
                onPress={this.handlePressAddressItem}
              />
            </View>
          ) : (
            <Carousel
              items={this.state.addresses}
              keyExtractor={item => item.addressString}
              onChangeItem={this.handleChangeAddressItem}
              renderItem={item => (
                <AddressQr
                  address={item.addressString}
                  wallet={wallet}
                  tokenId={tokenId}
                  nativeAmount={this.state.amounts?.nativeAmount}
                  onPress={this.handlePressAddressItem}
                />
              )}
            />
          )}

          <EdgeAnim enter={fadeInDown50}>
            <EdgeTouchableOpacity accessible={false} disabled={addressExplorerDisabled} onPress={this.handleAddressBlockExplorer}>
              <View style={styles.rightChevronContainer}>
                <EdgeText>{selectedAddress?.label ?? lstrings.request_qr_your_wallet_address}</EdgeText>
                {addressExplorerDisabled ? null : <IonIcon name="chevron-forward" size={theme.rem(1.5)} color={theme.iconTappable} />}
              </View>
              <EdgeText style={styles.publicAddressText}>{requestAddress}</EdgeText>
            </EdgeTouchableOpacity>
          </EdgeAnim>
        </View>

        <EdgeAnim enter={fadeInDown75}>
          <ShareButtons openShareModal={this.openShareModal} copyToClipboard={this.copyToClipboard} openFioAddressModal={this.openFioAddressModal} />
        </EdgeAnim>
      </SceneWrapper>
    )
  }

  onExchangeAmountChanged = async (amounts: ExchangedFlipInputAmounts) => {
    this.setState({ amounts })
  }

  copyToClipboard = async (): Promise<void> => {
    try {
      const encodedUri = await this.getEncodedUri()
      if (encodedUri != null) {
        Clipboard.setString(encodedUri)
        showToast(lstrings.fragment_request_address_uri_copied)
      }
    } catch (error) {
      showError(error)
    }
  }

  shouldShowMinimumModal = (props: Props): boolean => {
    const { currencyCode, wallet } = props
    if (currencyCode == null || wallet == null) return false

    // No minimums for tokens
    if (currencyCode !== wallet.currencyInfo.currencyCode) return false
    const { pluginId } = wallet.currencyInfo

    if (this.state.minimumPopupModalState[pluginId]) {
      if (this.state.minimumPopupModalState[pluginId] === 'NOT_YET_SHOWN') {
        const { minimumPopupModals } = getSpecialCurrencyInfo(pluginId)
        const minBalance = minimumPopupModals != null ? minimumPopupModals.minimumNativeBalance : '0'
        if (lt(wallet.balanceMap.get(null) ?? '0', minBalance)) {
          return true
        }
      }
    }
    return false
  }

  openShareModal = async (): Promise<void> => {
    const { currencyCode, wallet } = this.props
    const { selectedAddress } = this.state
    if (currencyCode == null || wallet == null || selectedAddress == null) {
      throw new Error('Wallet still loading. Please wait and try again.')
    }
    const publicAddress = selectedAddress.addressString
    let sharedAddress = (await this.getEncodedUri()) ?? publicAddress
    let edgePayUri = 'https://deep.edge.app/'
    let addOnMessage = ''
    // if encoded (like XTZ), only share the public address
    if (getSpecialCurrencyInfo(wallet.currencyInfo.pluginId).isUriEncodedStructure) {
      sharedAddress = publicAddress
    } else {
      // Rebuild uri to preserve uriPrefix if amount is 0
      if (sharedAddress != null && !sharedAddress.includes('amount')) {
        const edgeEncodeUri: EdgeEncodeUri = { publicAddress, currencyCode, nativeAmount: '0' }
        const newUri = await wallet.encodeUri(edgeEncodeUri)
        sharedAddress = newUri.substring(0, newUri.indexOf('?'))
      }
      edgePayUri = edgePayUri + `pay/${sharedAddress.replace(':', '/')}`
      addOnMessage = `\n\n${sprintf(lstrings.request_qr_email_title, config.appName)}\n\n`
    }

    const subject = wallet != null ? sprintf(lstrings.request_email_subject, config.appName, wallet.currencyInfo.displayName) : ''
    const message = `${sharedAddress}${addOnMessage}`

    const shareOptions: ShareOptions = {
      subject,
      message: Platform.OS === 'ios' ? message : message + edgePayUri,
      url: Platform.OS === 'ios' ? edgePayUri : '',
      failOnCancel: false
    }

    await Share.open(shareOptions).catch(error => showError(error))
  }

  openFioAddressModal = async (): Promise<void> => {
    const { navigation, wallet, currencyCode, route } = this.props
    const { walletId, tokenId } = route.params
    if (wallet?.id == null || currencyCode == null) return

    if (!this.props.isConnected) {
      showError(lstrings.fio_network_alert_text, { trackError: false })
      return
    }
    if (!this.props.fioAddressesExist) {
      showToast(`${lstrings.title_register_fio_address}. ${lstrings.fio_request_by_fio_address_error_no_address}`)
      return
    }
    if (this.state.amounts == null || zeroString(this.state.amounts?.nativeAmount)) {
      showToast(`${lstrings.fio_request_by_fio_address_error_invalid_amount}`)
      return
    }

    const fioAddressTo = await Airship.show<string | undefined>(bridge => (
      <AddressModal bridge={bridge} walletId={wallet.id} currencyCode={currencyCode} title={lstrings.fio_confirm_request_fio_title} />
    ))
    if (fioAddressTo != null) {
      navigation.navigate('fioRequestConfirmation', {
        amounts: this.state.amounts,
        fioAddressTo,
        tokenId,
        walletId
      })
    }
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  keysOnlyModeText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    padding: theme.rem(1),
    paddingTop: theme.rem(0.5)
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: theme.rem(1)
  },
  requestContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row'
  },
  backupText: {
    marginTop: theme.rem(1),
    flexGrow: 1,
    flexShrink: 0
  },
  balanceContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginBottom: theme.rem(0.5)
  },
  balanceAmountContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: theme.rem(0.25)
  },
  exchangeRate: {
    textAlign: 'right',
    alignSelf: 'flex-end',
    fontFamily: theme.fontFaceBold
  },
  qrContainer: {
    margin: theme.rem(1),
    alignSelf: 'center',
    flex: 1,
    flexDirection: 'column'
  },
  title: {
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(2)
  },
  rightChevronContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  accessoryText: {
    color: theme.inputAccessoryText
  },
  publicAddressText: {
    fontSize: theme.rem(0.75)
  },
  loader: {
    flex: 1,
    alignSelf: 'center'
  },
  errorText: {
    marginBottom: theme.rem(0.75),
    color: theme.dangerText
  }
}))

export const RequestScene = withWallet((props: OwnProps) => {
  const { route, wallet, navigation } = props
  const { tokenId } = route.params
  const currencyCode = getCurrencyCode(wallet, tokenId)

  const theme = useTheme()
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const exchangeSecondaryToPrimaryRatio = useSelector(state => getExchangeRate(state, currencyCode, isoFiatCurrencyCode))
  const fioAddresses = useSelector(state => state.ui.fioAddress.fioAddresses)
  const isConnected = useSelector(state => state.network.isConnected)
  const isoFiatCurrencyCode = useSelector(state => state.ui.settings.defaultIsoFiat)
  const primaryDisplayDenomination = useSelector(state => selectDisplayDenom(state, wallet.currencyConfig, tokenId))
  const showBalance = useSelector(state => state.ui.settings.isAccountBalanceVisible)

  const { pluginId } = wallet.currencyInfo
  const iconColor = useIconColor({ pluginId, tokenId })

  return (
    <RequestSceneComponent
      currencyCode={currencyCode}
      displayDenomination={primaryDisplayDenomination}
      exchangeSecondaryToPrimaryRatio={exchangeSecondaryToPrimaryRatio}
      fioAddressesExist={fioAddresses.length > 0}
      iconColor={iconColor}
      isConnected={isConnected}
      isLightAccount={account.username == null}
      navigation={navigation}
      route={route}
      showBalance={showBalance}
      theme={theme}
      wallet={wallet}
      refreshAllFioAddresses={async () => await dispatch(refreshAllFioAddresses())}
      onSelectWallet={async (walletId: string, tokenId: EdgeTokenId) => {
        await dispatch(selectWalletToken({ navigation: navigation as NavigationBase, walletId, tokenId }))
      }}
      toggleAccountBalanceVisibility={() => dispatch(toggleAccountBalanceVisibility())}
    />
  )
})
