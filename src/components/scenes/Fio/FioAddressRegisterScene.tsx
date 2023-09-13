import { EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Image, LayoutChangeEvent, ScrollView, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { createFioWallet } from '../../../actions/FioAddressActions'
import { Fontello } from '../../../assets/vector'
import { FIO_ADDRESS_DELIMITER, FIO_DOMAIN_DEFAULT } from '../../../constants/WalletAndCurrencyConstants'
import { lstrings } from '../../../locales/strings'
import { connect } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { FioDomain, FioPublicDomain } from '../../../types/types'
import { getWalletName } from '../../../util/CurrencyWalletHelpers'
import { checkIsDomainPublic } from '../../../util/FioAddressUtils'
import { openLink } from '../../../util/utils'
import { SceneWrapper } from '../../common/SceneWrapper'
import { DomainListModal } from '../../FioAddress/DomainListModal'
import { TextInputModal } from '../../modals/TextInputModal'
import { WalletListModal, WalletListResult } from '../../modals/WalletListModal'
import { Airship, showError, showToast } from '../../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../services/ThemeContext'
import { ClickableText } from '../../themed/ClickableText'
import { EdgeText } from '../../themed/EdgeText'
import { FormError } from '../../themed/FormError'
import { MainButton } from '../../themed/MainButton'
import { SceneHeader } from '../../themed/SceneHeader'
import { Tile } from '../../tiles/Tile'

interface State {
  selectedWallet: EdgeCurrencyWallet | null
  selectedDomain: FioDomain
  publicDomains: FioDomain[]
  fioAddress: string
  isValid: boolean
  loading: boolean
  walletLoading: boolean
  domainsLoading: boolean
  isAvailable: boolean
  fieldPos: number
  inputWidth: number
  showFreeAddressLink: boolean
  errorMessage: string
}

interface OwnProps extends EdgeSceneProps<'fioAddressRegister'> {}

interface StateProps {
  fioWallets: EdgeCurrencyWallet[]
  fioPlugin: EdgeCurrencyConfig
  isConnected: boolean
}

interface DispatchProps {
  createFioWallet: () => Promise<EdgeCurrencyWallet>
}

type Props = StateProps & DispatchProps & OwnProps & ThemeProps

export class FioAddressRegister extends React.Component<Props, State> {
  fioCheckQueue: number = 0

  state: State = {
    selectedWallet: null,
    selectedDomain: FIO_DOMAIN_DEFAULT,
    publicDomains: [],
    fioAddress: '',
    isValid: true,
    isAvailable: false,
    loading: false,
    walletLoading: false,
    domainsLoading: true,
    fieldPos: 200,
    inputWidth: 0,
    showFreeAddressLink: false,
    errorMessage: ''
  }

  componentDidMount() {
    const { fioWallets } = this.props
    this.getPublicDomains().catch(err => showError(err))
    this.checkFreeAddress().catch(err => showError(err))
    if (fioWallets.length > 0) {
      this.setState({
        selectedWallet: fioWallets[0]
      })
    } else {
      this.createFioWallet().catch(err => showError(err))
    }
    this.setState({ inputWidth: this.props.theme.rem(12.5) })
  }

  checkFreeAddress = async () => {
    try {
      const { fioPlugin } = this.props
      const publicDomains = await fioPlugin.otherMethods.getDomains(fioPlugin.currencyInfo.defaultSettings.freeAddressRef)
      if (publicDomains.findIndex((publicDomain: FioPublicDomain) => publicDomain.free) > -1) {
        this.setState({ showFreeAddressLink: true })
      }
    } catch (e: any) {
      //
      console.log(e)
    }
  }

  getPublicDomains = async () => {
    const { fioPlugin } = this.props
    try {
      const publicDomains = await fioPlugin.otherMethods.getDomains(fioPlugin.currencyInfo.defaultSettings.fallbackRef)
      const publicDomainsConverted = publicDomains
        // @ts-expect-error
        .sort(publicDomain => (publicDomain.domain === FIO_DOMAIN_DEFAULT.name ? -1 : 1))
        .map((publicDomain: FioPublicDomain) => ({
          name: publicDomain.domain,
          expiration: new Date().toDateString(),
          isPublic: true,
          walletId: '',
          isFree: publicDomain.free
        }))
      this.setState({
        publicDomains: publicDomainsConverted,
        selectedDomain: publicDomainsConverted[0]
      })
    } catch (e: any) {
      //
    }
    this.setState({ domainsLoading: false })
  }

  createFioWallet = async (): Promise<void> => {
    const { createFioWallet } = this.props
    showToast(lstrings.preparing_fio_wallet)
    this.setState({ walletLoading: true })
    try {
      const wallet = await createFioWallet()
      this.setState({
        selectedWallet: wallet,
        walletLoading: false
      })
    } catch (e: any) {
      this.setState({ walletLoading: false })
      showError(lstrings.create_wallet_failed_message)
    }
  }

  registerFreeAddress = async () => {
    const { fioPlugin, fioWallets } = this.props
    const { selectedWallet } = this.state
    if (!fioPlugin) return
    if (!fioWallets.length) return
    if (!selectedWallet) return
    const publicKey = selectedWallet.publicWalletInfo.keys.publicKey
    const url = `${fioPlugin.currencyInfo.defaultSettings.fioAddressRegUrl}${fioPlugin.currencyInfo.defaultSettings.freeAddressRef}?publicKey=${publicKey}`
    try {
      await openLink(url)
    } catch (e: any) {
      showError(sprintf(lstrings.open_url_err, url))
    }
  }

  handleNextButton = (): void => {
    const { isConnected, navigation } = this.props
    const { fioAddress, selectedWallet, selectedDomain, isValid, isAvailable, loading, walletLoading } = this.state
    if (isValid && isAvailable && !loading && !walletLoading) {
      if (isConnected) {
        if (!selectedWallet) return showError(lstrings.create_wallet_failed_message)
        const fullAddress = `${fioAddress}${FIO_ADDRESS_DELIMITER}${selectedDomain.name}`
        if (selectedDomain.isFree) {
          navigation.navigate('fioNameConfirm', {
            fioName: fullAddress,
            paymentWallet: selectedWallet,
            fee: 0,
            ownerPublicKey: selectedWallet.publicWalletInfo.keys.publicKey
          })
        } else {
          navigation.navigate('fioAddressRegisterSelectWallet', {
            fioAddress: fullAddress,
            selectedWallet,
            selectedDomain
          })
        }
      } else {
        showError(lstrings.fio_network_alert_text)
      }
    }
  }

  checkFioAddress(fioAddress: string, domain: string, isCustomDomain: boolean = false) {
    this.setState({
      loading: true,
      errorMessage: ''
    })
    this.fioCheckQueue++
    setTimeout(async () => {
      // do not check if user continue typing fio address
      if (this.fioCheckQueue > 1) {
        return --this.fioCheckQueue
      }
      this.fioCheckQueue = 0
      const { fioPlugin } = this.props
      if (isCustomDomain) {
        try {
          await checkIsDomainPublic(fioPlugin, domain)
        } catch (e: any) {
          showError(e.message)
          return this.setState({
            isAvailable: false,
            loading: false
          })
        }
      }

      // regexp from edge-currency-accountbased
      if (!/^[a-zA-Z0-9]{1}((?!-{2,})[a-zA-Z0-9-]*[a-zA-Z0-9]+){0,1}$/.test(fioAddress)) {
        this.setState({
          loading: false,
          isValid: false,
          errorMessage: lstrings.warning_alphanumeric
        })
        return
      }

      try {
        const fullAddress = `${fioAddress}${FIO_ADDRESS_DELIMITER}${domain}`
        const isAvailable = fioPlugin.otherMethods ? await fioPlugin.otherMethods.validateAccount(fullAddress) : false
        this.setState({
          isValid: true,
          isAvailable,
          loading: false,
          errorMessage: ''
        })
      } catch (e: any) {
        console.log(e.json)
        console.log(e.message)
        this.setState({
          isValid: false,
          isAvailable: false,
          loading: false
        })
      }
    }, 1000)
  }

  handleFioAddressChange = (fioAddressChanged: string) => {
    if (!this.props.isConnected) {
      return this.setState({
        fioAddress: fioAddressChanged.toLowerCase(),
        loading: false
      })
    }
    this.checkFioAddress(fioAddressChanged, this.state.selectedDomain.name, !this.state.selectedDomain.walletId)

    this.setState({
      fioAddress: fioAddressChanged.toLowerCase()
    })
  }

  handleFioAddressFocus = () => {
    // @ts-expect-error
    // eslint-disable-next-line react/no-string-refs
    this.refs._scrollView.scrollTo({ x: 0, y: this.state.fieldPos, animated: true })
  }

  fieldViewOnLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    if (nativeEvent) {
      const {
        layout: { y }
      } = nativeEvent
      this.setState({ fieldPos: y })
    }
  }

  editAddressPressed = async () => {
    this.handleFioAddressFocus()
    await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={this.state.fioAddress}
        inputLabel={lstrings.fio_address_register_form_field_label}
        title={lstrings.fio_address_choose_label}
      />
    )).then((response: string | undefined) => {
      if (response) {
        this.handleFioAddressChange(response)
      }
    })
  }

  handleFioWalletChange = (walletId: string) => {
    this.setState({
      // @ts-expect-error
      selectedWallet: this.props.fioWallets.find(fioWallet => fioWallet.id === walletId)
    })
  }

  selectFioWallet = async () => {
    await Airship.show<WalletListResult>(bridge => (
      <WalletListModal bridge={bridge} navigation={this.props.navigation} headerTitle={lstrings.select_wallet} allowedAssets={[{ pluginId: 'fio' }]} />
    )).then(({ walletId, currencyCode }: WalletListResult) => {
      if (walletId && currencyCode) {
        this.handleFioWalletChange(walletId)
      }
    })
  }

  selectFioDomain = async () => {
    const { navigation } = this.props
    const { domainsLoading } = this.state
    if (domainsLoading) return
    const response = await Airship.show<FioDomain | undefined>(bridge => (
      <DomainListModal bridge={bridge} navigation={navigation} publicDomains={this.state.publicDomains} />
    ))
    if (response) {
      this.setState({ selectedDomain: response })
      this.checkFioAddress(this.state.fioAddress, response.name, !response.walletId)
    }
  }

  renderButton() {
    const { isValid, isAvailable, loading, walletLoading } = this.state
    const styles = getStyles(this.props.theme)

    if (isValid && isAvailable && !loading) {
      return (
        <View style={styles.buttons}>
          <MainButton
            disabled={!isAvailable || walletLoading}
            label={walletLoading ? '' : lstrings.string_next_capitalized}
            spinner={walletLoading}
            onPress={this.handleNextButton}
            type="secondary"
          />
        </View>
      )
    }

    return null
  }

  renderLoader() {
    const { theme } = this.props
    const { loading } = this.state
    const styles = getStyles(theme)

    const label = `(${lstrings.validating})`
    return loading ? <EdgeText style={styles.muted}>{label}</EdgeText> : null
  }

  renderFioWallets() {
    const { fioWallets } = this.props
    const { selectedWallet } = this.state

    if (fioWallets && fioWallets.length > 1) {
      const title = `${selectedWallet == null ? lstrings.fio_address_register_no_wallet_name : getWalletName(selectedWallet)}`
      return <Tile type="touchable" title={`${lstrings.title_fio_connect_to_wallet}`} onPress={this.selectFioWallet} body={title} />
    }
  }

  renderErrorMessage() {
    const { fioAddress, isAvailable, isValid, loading, errorMessage } = this.state
    const styles = getStyles(this.props.theme)
    let chooseHandleErrorMessage = ''

    if (loading) return null

    if (fioAddress && !this.props.isConnected) {
      chooseHandleErrorMessage = lstrings.fio_address_register_screen_cant_check
    }
    if (fioAddress && !isAvailable) {
      chooseHandleErrorMessage = lstrings.fio_address_register_screen_not_available
    }

    if (fioAddress && !isValid) {
      chooseHandleErrorMessage = lstrings.fio_error_invalid_address
    }

    if (fioAddress && !isValid && errorMessage) {
      chooseHandleErrorMessage = errorMessage
    }

    return (
      <FormError style={styles.error} isVisible={!!chooseHandleErrorMessage}>
        {chooseHandleErrorMessage}
      </FormError>
    )
  }

  render() {
    const { theme } = this.props
    const { fioAddress, selectedDomain, domainsLoading, showFreeAddressLink } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="theme">
        <SceneHeader style={styles.header} title={lstrings.title_fio_address_confirmation}>
          <Image source={theme.fioAddressLogo} style={styles.image} resizeMode="cover" />
        </SceneHeader>
        {/* eslint-disable-next-line react/no-string-refs */}
        <ScrollView ref="_scrollView" contentContainerStyle={styles.container}>
          <View style={styles.view}>
            <View style={[styles.createWalletPromptArea, styles.title]}>
              <EdgeText style={styles.instructionalText} numberOfLines={2}>
                {lstrings.fio_address_first_screen_title}
              </EdgeText>
            </View>
            <View style={styles.createWalletPromptArea}>
              <EdgeText style={styles.handleRequirementsText} numberOfLines={3}>
                {lstrings.fio_address_features}
              </EdgeText>
            </View>
            <View style={styles.createWalletPromptArea}>
              <EdgeText style={styles.handleRequirementsText} numberOfLines={5}>
                {lstrings.fio_address_first_screen_end}
              </EdgeText>
            </View>

            <View onLayout={this.fieldViewOnLayout}>
              <Tile type="editable" title={lstrings.fio_address_choose_label} onPress={this.editAddressPressed}>
                <View style={styles.addressTileBody}>
                  {fioAddress ? (
                    <EdgeText style={styles.fioAddressName}>{fioAddress}</EdgeText>
                  ) : (
                    <EdgeText style={styles.muted}>{lstrings.fio_address_register_placeholder}</EdgeText>
                  )}
                  {this.renderLoader()}
                </View>
              </Tile>
              <Tile
                type="touchable"
                title={lstrings.fio_address_choose_domain_label}
                onPress={this.selectFioDomain}
                body={domainsLoading ? lstrings.loading : `${FIO_ADDRESS_DELIMITER}${selectedDomain.name}`}
              />
              {this.renderFioWallets()}
            </View>
            {this.renderButton()}
            {this.props.fioWallets.length && showFreeAddressLink ? (
              <ClickableText
                onPress={this.registerFreeAddress}
                icon={<Fontello name="register-new-fio-icon" color={theme.iconTappable} size={theme.rem(1)} />}
                label={lstrings.fio_address_reg_free}
              />
            ) : null}
            {this.renderErrorMessage()}
            <View style={styles.bottomSpace} />
          </View>
        </ScrollView>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    paddingTop: theme.rem(0.5)
  },
  view: {
    position: 'relative'
  },
  createWalletPromptArea: {
    paddingHorizontal: theme.rem(1),
    paddingBottom: theme.rem(1)
  },
  instructionalText: {
    fontSize: theme.rem(1),
    color: theme.primaryText
  },
  handleRequirementsText: {
    fontSize: theme.rem(1),
    textAlign: 'left',
    color: theme.secondaryText
  },
  buttons: {
    marginTop: theme.rem(1.5),
    paddingHorizontal: theme.rem(1)
  },
  error: {
    flex: 1,
    margin: theme.rem(1)
  },
  addressTileBody: {
    flexDirection: 'row'
  },
  fioAddressName: {
    marginRight: theme.rem(1)
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    marginRight: theme.rem(1),
    marginTop: theme.rem(0.5)
  },
  image: {
    height: theme.rem(1.5),
    width: theme.rem(1.65),
    marginRight: theme.rem(0.5)
  },
  title: {
    paddingTop: theme.rem(1.5)
  },
  bottomSpace: {
    paddingBottom: theme.rem(30)
  },
  selectWalletBlock: {
    marginTop: theme.rem(3),
    paddingHorizontal: theme.rem(1.25),
    paddingBottom: theme.rem(0.75),
    backgroundColor: theme.tileBackground
  },
  selectWalletBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.rem(1),
    paddingVertical: theme.rem(0.5),
    paddingHorizontal: theme.rem(0.25),
    backgroundColor: theme.primaryButton[0]
  },
  domain: {
    marginTop: theme.rem(1.5),
    marginLeft: theme.rem(0.25),
    paddingHorizontal: theme.rem(0.75),
    paddingVertical: theme.rem(0.25),
    borderRadius: theme.rem(0.25),
    borderColor: theme.primaryButton[0],
    borderWidth: theme.rem(0.125)
  },
  domainText: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  domainListRowName: {
    flex: 1,
    fontSize: theme.rem(1),
    color: theme.secondaryText
  },
  domainListRowContainerTop: {
    height: 'auto',
    paddingLeft: theme.rem(0.75),
    paddingRight: theme.rem(0.75),
    paddingVertical: theme.rem(0.75)
  },
  errorMessage: {
    color: theme.dangerText
  },
  muted: {
    color: theme.deactivatedText
  }
}))

const typeHack: any = {}

export const FioAddressRegisterScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    fioWallets: state.ui.wallets.fioWallets,
    fioPlugin: state.core.account.currencyConfig.fio ?? typeHack,
    isConnected: state.network.isConnected
  }),
  dispatch => ({
    async createFioWallet() {
      return await dispatch(createFioWallet())
    }
  })
)(withTheme(FioAddressRegister))
