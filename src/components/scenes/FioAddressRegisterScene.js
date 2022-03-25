// @flow

import { type EdgeCurrencyConfig, type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Image, ScrollView, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { createFioWallet } from '../../actions/FioAddressActions.js'
import { Fontello } from '../../assets/vector'
import { FIO_ADDRESS_DELIMITER, FIO_DOMAIN_DEFAULT, FIO_STR } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { DomainListModal } from '../../modules/FioAddress/components/DomainListModal'
import { checkIsDomainPublic } from '../../modules/FioAddress/util'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import type { FioDomain, FioPublicDomain } from '../../types/types'
import { openLink } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { TextInputModal } from '../modals/TextInputModal.js'
import type { WalletListResult } from '../modals/WalletListModal'
import { WalletListModal } from '../modals/WalletListModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ClickableText } from '../themed/ClickableText.js'
import { EdgeText } from '../themed/EdgeText'
import { FormError } from '../themed/FormError'
import { MainButton } from '../themed/MainButton.js'
import { SceneHeader } from '../themed/SceneHeader'
import { Tile } from '../themed/Tile'

type State = {
  selectedWallet: EdgeCurrencyWallet | null,
  selectedDomain: FioDomain,
  publicDomains: FioDomain[],
  fioAddress: string,
  isValid: boolean,
  loading: boolean,
  walletLoading: boolean,
  domainsLoading: boolean,
  isAvailable: boolean,
  fieldPos: number,
  inputWidth: number,
  showFreeAddressLink: boolean,
  errorMessage: string
}

type OwnProps = {
  navigation: NavigationProp<'fioAddressRegister'>
}
type StateProps = {
  fioWallets: EdgeCurrencyWallet[],
  fioPlugin: EdgeCurrencyConfig,
  isConnected: boolean
}

type DispatchProps = {
  createFioWallet: () => Promise<EdgeCurrencyWallet>
}

type Props = StateProps & DispatchProps & OwnProps & ThemeProps

class FioAddressRegister extends React.Component<Props, State> {
  fioCheckQueue: number = 0

  state = {
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
    this.getPublicDomains()
    this.checkFreeAddress()
    if (fioWallets.length > 0) {
      this.setState({
        selectedWallet: fioWallets[0]
      })
    } else {
      this.createFioWallet()
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
    } catch (e) {
      //
      console.log(e)
    }
  }

  getPublicDomains = async () => {
    const { fioPlugin } = this.props
    try {
      const publicDomains = await fioPlugin.otherMethods.getDomains(fioPlugin.currencyInfo.defaultSettings.fallbackRef)
      const publicDomainsConverted = publicDomains
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
    } catch (e) {
      //
    }
    this.setState({ domainsLoading: false })
  }

  createFioWallet = async (): Promise<void> => {
    const { createFioWallet } = this.props
    showToast(s.strings.preparing_fio_wallet)
    this.setState({ walletLoading: true })
    try {
      const wallet = await createFioWallet()
      this.setState({
        selectedWallet: wallet,
        walletLoading: false
      })
    } catch (e) {
      this.setState({ walletLoading: false })
      showError(s.strings.create_wallet_failed_message)
    }
  }

  registerFreeAddress = () => {
    const { fioPlugin, fioWallets } = this.props
    const { selectedWallet } = this.state
    if (!fioPlugin) return
    if (!fioWallets.length) return
    if (!selectedWallet) return
    const publicKey = selectedWallet.publicWalletInfo.keys.publicKey
    const url = `${fioPlugin.currencyInfo.defaultSettings.fioAddressRegUrl}${fioPlugin.currencyInfo.defaultSettings.freeAddressRef}?publicKey=${publicKey}`
    try {
      openLink(url)
    } catch (e) {
      showError(sprintf(s.strings.open_url_err, url))
    }
  }

  handleNextButton = (): void => {
    const { isConnected, navigation } = this.props
    const { fioAddress, selectedWallet, selectedDomain, isValid, isAvailable, loading, walletLoading } = this.state
    if (isValid && isAvailable && !loading && !walletLoading) {
      if (isConnected) {
        if (!selectedWallet) return showError(s.strings.create_wallet_failed_message)
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
        showError(s.strings.fio_network_alert_text)
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
        } catch (e) {
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
          errorMessage: s.strings.warning_alphanumeric
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
      } catch (e) {
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
    // eslint-disable-next-line react/no-string-refs
    this.refs._scrollView.scrollTo({ x: 0, y: this.state.fieldPos, animated: true })
  }

  fieldViewOnLayout = ({ nativeEvent }) => {
    if (nativeEvent) {
      const {
        layout: { y }
      } = nativeEvent
      this.setState({ fieldPos: y })
    }
  }

  editAddressPressed = () => {
    this.handleFioAddressFocus()
    Airship.show(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={this.state.fioAddress}
        inputLabel={s.strings.fio_address_register_form_field_label}
        title={s.strings.fio_address_choose_label}
      />
    )).then((response: string | void) => {
      if (response) {
        this.handleFioAddressChange(response)
      }
    })
  }

  handleFioWalletChange = (walletId: string) => {
    this.setState({
      selectedWallet: this.props.fioWallets.find(fioWallet => fioWallet.id === walletId)
    })
  }

  selectFioWallet = () => {
    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={[FIO_STR]} />).then(
      ({ walletId, currencyCode }: WalletListResult) => {
        if (walletId && currencyCode) {
          if (currencyCode === FIO_STR) {
            this.handleFioWalletChange(walletId)
          } else {
            showError(`${s.strings.create_wallet_select_valid_crypto}: ${FIO_STR}`)
          }
        }
      }
    )
  }

  selectFioDomain = () => {
    const { domainsLoading } = this.state
    if (domainsLoading) return
    Airship.show(bridge => <DomainListModal bridge={bridge} publicDomains={this.state.publicDomains} />).then((response: FioDomain | null) => {
      if (response) {
        this.setState({ selectedDomain: response })
        this.checkFioAddress(this.state.fioAddress, response.name, !response.walletId)
      }
    })
  }

  renderButton() {
    const { isValid, isAvailable, loading, walletLoading } = this.state
    const styles = getStyles(this.props.theme)

    if (isValid && isAvailable && !loading) {
      return (
        <View style={styles.buttons}>
          <MainButton
            disabled={!isAvailable || walletLoading}
            label={walletLoading ? '' : s.strings.string_next_capitalized}
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

    const label = `(${s.strings.validating})`
    return loading ? <EdgeText style={styles.muted}>{label}</EdgeText> : null
  }

  renderFioWallets() {
    const { fioWallets } = this.props
    const { selectedWallet } = this.state

    if (fioWallets && fioWallets.length > 1) {
      const title = `${selectedWallet && selectedWallet.name ? selectedWallet.name : s.strings.fio_address_register_no_wallet_name}`
      return <Tile type="touchable" title={`${s.strings.title_fio_connect_to_wallet}`} onPress={this.selectFioWallet} body={title} />
    }
  }

  renderErrorMessage() {
    const { fioAddress, isAvailable, isValid, loading, errorMessage } = this.state
    const styles = getStyles(this.props.theme)
    let chooseHandleErrorMessage = ''

    if (loading) return null

    if (fioAddress && !this.props.isConnected) {
      chooseHandleErrorMessage = s.strings.fio_address_register_screen_cant_check
    }
    if (fioAddress && !isAvailable) {
      chooseHandleErrorMessage = s.strings.fio_address_register_screen_not_available
    }

    if (fioAddress && !isValid) {
      chooseHandleErrorMessage = s.strings.fio_error_invalid_address
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
        <SceneHeader style={styles.header} title={s.strings.title_fio_address_confirmation}>
          <Image source={theme.fioAddressLogo} style={styles.image} resizeMode="cover" />
        </SceneHeader>
        {/* eslint-disable-next-line react/no-string-refs */}
        <ScrollView ref="_scrollView">
          <View style={styles.view}>
            <View style={[styles.createWalletPromptArea, styles.title]}>
              <EdgeText style={styles.instructionalText} numberOfLines={2}>
                {s.strings.fio_address_first_screen_title}
              </EdgeText>
            </View>
            <View style={styles.createWalletPromptArea}>
              <EdgeText style={styles.handleRequirementsText} numberOfLines={3}>
                {s.strings.fio_address_features}
              </EdgeText>
            </View>
            <View style={styles.createWalletPromptArea}>
              <EdgeText style={styles.handleRequirementsText} numberOfLines={5}>
                {s.strings.fio_address_first_screen_end}
              </EdgeText>
            </View>

            <View onLayout={this.fieldViewOnLayout}>
              <Tile type="editable" title={s.strings.fio_address_choose_label} onPress={this.editAddressPressed}>
                <View style={styles.addressTileBody}>
                  {fioAddress ? (
                    <EdgeText style={styles.fioAddressName}>{fioAddress}</EdgeText>
                  ) : (
                    <EdgeText style={styles.muted}>{s.strings.fio_address_register_placeholder}</EdgeText>
                  )}
                  {this.renderLoader()}
                </View>
              </Tile>
              <Tile
                type="touchable"
                title={s.strings.fio_address_choose_domain_label}
                onPress={this.selectFioDomain}
                body={domainsLoading ? s.strings.loading : `${FIO_ADDRESS_DELIMITER}${selectedDomain.name}`}
              />
              {this.renderFioWallets()}
            </View>
            {this.renderButton()}
            {this.props.fioWallets.length && showFreeAddressLink ? (
              <ClickableText
                onPress={this.registerFreeAddress}
                icon={<Fontello name="register-new-fio-icon" color={theme.iconTappable} size={theme.rem(1)} />}
                label={s.strings.fio_address_reg_free}
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
    backgroundColor: theme.primaryButton
  },
  domain: {
    marginTop: theme.rem(1.5),
    marginLeft: theme.rem(0.25),
    paddingHorizontal: theme.rem(0.75),
    paddingVertical: theme.rem(0.25),
    borderRadius: theme.rem(0.25),
    borderColor: theme.primaryButton,
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
