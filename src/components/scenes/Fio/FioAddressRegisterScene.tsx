import type { EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Image, type LayoutChangeEvent, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { createFioWallet } from '../../../actions/FioAddressActions'
import {
  FIO_ADDRESS_DELIMITER,
  FIO_DOMAIN_DEFAULT
} from '../../../constants/WalletAndCurrencyConstants'
import { lstrings } from '../../../locales/strings'
import { connect } from '../../../types/reactRedux'
import type {
  EdgeAppSceneProps,
  NavigationBase
} from '../../../types/routerTypes'
import type { FioDomain, FioPublicDomain } from '../../../types/types'
import { getWalletName } from '../../../util/CurrencyWalletHelpers'
import { checkIsDomainPublic } from '../../../util/FioAddressUtils'
import { openLink } from '../../../util/utils'
import { ButtonsView } from '../../buttons/ButtonsView'
import { AlertCardUi4 } from '../../cards/AlertCard'
import { EdgeCard } from '../../cards/EdgeCard'
import { EdgeAnim, fadeIn, fadeOut } from '../../common/EdgeAnim'
import { SceneWrapper } from '../../common/SceneWrapper'
import { DomainListModal } from '../../FioAddress/DomainListModal'
import { TextInputModal } from '../../modals/TextInputModal'
import {
  WalletListModal,
  type WalletListResult
} from '../../modals/WalletListModal'
import { EdgeRow } from '../../rows/EdgeRow'
import {
  Airship,
  showError,
  showToast,
  showWarning
} from '../../services/AirshipInstance'
import {
  cacheStyles,
  type Theme,
  type ThemeProps,
  withTheme
} from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

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

interface OwnProps extends EdgeAppSceneProps<'fioAddressRegister'> {}

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

  componentDidMount(): void {
    const { fioWallets } = this.props
    this.getPublicDomains().catch((error: unknown) => {
      showError(error)
    })
    this.checkFreeAddress().catch((error: unknown) => {
      showError(error)
    })
    if (fioWallets.length > 0) {
      this.setState({
        selectedWallet: fioWallets[0]
      })
    } else {
      this.createFioWallet().catch((error: unknown) => {
        showError(error)
      })
    }
    this.setState({ inputWidth: this.props.theme.rem(12.5) })
  }

  checkFreeAddress = async (): Promise<void> => {
    try {
      const { fioPlugin } = this.props
      const publicDomains = await fioPlugin.otherMethods.getDomains(
        fioPlugin.currencyInfo.defaultSettings?.freeAddressRef
      )
      if (
        publicDomains.findIndex(
          (publicDomain: FioPublicDomain) => publicDomain.free
        ) > -1
      ) {
        this.setState({ showFreeAddressLink: true })
      }
    } catch (error: unknown) {
      //
      console.log(error)
    }
  }

  getPublicDomains = async (): Promise<void> => {
    const { fioPlugin } = this.props
    try {
      const publicDomains = await fioPlugin.otherMethods.getDomains(
        fioPlugin.currencyInfo.defaultSettings?.fallbackRef
      )
      const publicDomainsConverted = publicDomains
        // @ts-expect-error getDomains returns untyped public domain records
        .sort(publicDomain =>
          publicDomain.domain === FIO_DOMAIN_DEFAULT.name ? -1 : 1
        )
        .map((publicDomain: FioPublicDomain) => ({
          name: publicDomain.domain,
          expiration: new Date().toDateString(),
          isPublic: true,
          walletId: '',
          isFree: publicDomain.free
        }))
      this.setState({
        publicDomains: publicDomainsConverted,
        selectedDomain: publicDomainsConverted[0] ?? FIO_DOMAIN_DEFAULT
      })
    } catch (error: unknown) {
      console.warn(error)
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
    } catch (_error: unknown) {
      this.setState({ walletLoading: false })
      showError(lstrings.create_wallet_failed_message)
    }
  }

  registerFreeAddress = async (): Promise<void> => {
    const { fioPlugin, fioWallets } = this.props
    const { selectedWallet } = this.state
    if (fioWallets.length === 0) return
    if (selectedWallet == null) return
    const publicKey = selectedWallet.publicWalletInfo.keys.publicKey
    const url = `${fioPlugin.currencyInfo.defaultSettings?.fioAddressRegUrl}${fioPlugin.currencyInfo.defaultSettings?.freeAddressRef}?publicKey=${publicKey}`
    try {
      await openLink(url)
    } catch (_error: unknown) {
      showError(sprintf(lstrings.open_url_err, url))
    }
  }

  handleNextButton = (): void => {
    const { isConnected, navigation } = this.props
    const {
      fioAddress,
      selectedWallet,
      selectedDomain,
      isValid,
      isAvailable,
      loading,
      walletLoading
    } = this.state
    if (isValid && isAvailable && !loading && !walletLoading) {
      if (isConnected) {
        if (selectedWallet == null) {
          showError(lstrings.create_wallet_failed_message)
          return
        }
        const fullAddress = `${fioAddress}${FIO_ADDRESS_DELIMITER}${selectedDomain.name}`
        if (selectedDomain.isFree === true) {
          navigation.navigate('fioNameConfirm', {
            fioName: fullAddress,
            walletId: selectedWallet.id,
            fee: 0,
            ownerPublicKey: selectedWallet.publicWalletInfo.keys.publicKey
          })
        } else {
          navigation.navigate('fioAddressRegisterSelectWallet', {
            fioAddress: fullAddress,
            walletId: selectedWallet.id,
            selectedDomain
          })
        }
      } else {
        showError(lstrings.fio_network_alert_text)
      }
    }
  }

  checkFioAddress(
    fioAddress: string,
    domain: string,
    isCustomDomain: boolean = false
  ): void {
    this.setState({
      loading: true,
      errorMessage: ''
    })
    this.fioCheckQueue++
    const checkFioAddressInner = async (): Promise<void> => {
      // do not check if user continue typing fio address
      if (this.fioCheckQueue > 1) {
        --this.fioCheckQueue
        return
      }
      this.fioCheckQueue = 0
      const { fioPlugin } = this.props
      if (isCustomDomain) {
        const result = await checkIsDomainPublic(fioPlugin, domain)
        if (result !== true) {
          showWarning(result, { trackError: false })
          this.setState({
            isAvailable: false,
            loading: false
          })
          return
        }
      }

      // regexp from edge-currency-accountbased
      if (
        !/^[a-zA-Z0-9]{1}((?!-{2,})[a-zA-Z0-9-]*[a-zA-Z0-9]+){0,1}$/.test(
          fioAddress
        )
      ) {
        this.setState({
          loading: false,
          isValid: false,
          errorMessage: lstrings.warning_alphanumeric
        })
        return
      }

      try {
        const fullAddress = `${fioAddress}${FIO_ADDRESS_DELIMITER}${domain}`
        const isAvailable = await fioPlugin.otherMethods.validateAccount(
          fullAddress
        )
        this.setState({
          isValid: true,
          isAvailable,
          loading: false,
          errorMessage: ''
        })
      } catch (error: unknown) {
        console.log(error)
        this.setState({
          isValid: false,
          isAvailable: false,
          loading: false
        })
      }
    }
    setTimeout(() => {
      checkFioAddressInner().catch((error: unknown) => {
        showError(error)
      })
    }, 1000)
  }

  handleFioAddressChange = (fioAddressChanged: string): void => {
    if (!this.props.isConnected) {
      this.setState({
        fioAddress: fioAddressChanged.toLowerCase(),
        loading: false
      })
      return
    }
    this.checkFioAddress(
      fioAddressChanged,
      this.state.selectedDomain.name,
      this.state.selectedDomain.walletId === ''
    )

    this.setState({
      fioAddress: fioAddressChanged.toLowerCase()
    })
  }

  fieldViewOnLayout = ({ nativeEvent }: LayoutChangeEvent): void => {
    const {
      layout: { y }
    } = nativeEvent
    this.setState({ fieldPos: y })
  }

  editAddressPressed = async (): Promise<void> => {
    await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={this.state.fioAddress}
        inputLabel={lstrings.fio_address_register_form_field_label}
        title={lstrings.fio_address_choose_label}
        autoCorrect={false}
      />
    )).then((response: string | undefined) => {
      if (response != null && response !== '') {
        this.handleFioAddressChange(response)
      }
    })
  }

  handleFioWalletChange = (walletId: string): void => {
    this.setState({
      selectedWallet:
        this.props.fioWallets.find(fioWallet => fioWallet.id === walletId) ??
        null
    })
  }

  selectFioWallet = async (): Promise<void> => {
    await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={this.props.navigation as NavigationBase}
        headerTitle={lstrings.select_wallet}
        allowedAssets={[{ pluginId: 'fio', tokenId: null }]}
      />
    )).then(result => {
      if (result != null && result.type === 'wallet') {
        const { walletId } = result
        this.handleFioWalletChange(walletId)
      }
    })
  }

  selectFioDomain = async (): Promise<void> => {
    const { navigation } = this.props
    const { domainsLoading } = this.state
    if (domainsLoading) return
    const response = await Airship.show<FioDomain | undefined>(bridge => (
      <DomainListModal
        bridge={bridge}
        navigation={navigation as NavigationBase}
        publicDomains={this.state.publicDomains}
      />
    ))
    if (response != null) {
      this.setState({ selectedDomain: response })
      this.checkFioAddress(
        this.state.fioAddress,
        response.name,
        response.walletId === ''
      )
    }
  }

  renderButton(): React.ReactElement {
    const {
      isValid,
      isAvailable,
      loading,
      showFreeAddressLink,
      walletLoading
    } = this.state
    const styles = getStyles(this.props.theme)

    const primary = {
      disabled: !isValid || !isAvailable || loading,
      label: walletLoading ? '' : lstrings.string_next_capitalized,
      onPress: this.handleNextButton,
      type: 'primary'
    }
    const tertiary =
      this.props.fioWallets.length > 0 && showFreeAddressLink
        ? {
            label: lstrings.fio_address_reg_free,
            onPress: this.registerFreeAddress,
            type: 'tertiary'
          }
        : undefined

    return (
      <View style={styles.buttons}>
        <ButtonsView primary={primary} tertiary={tertiary} />
      </View>
    )
  }

  renderLoader(): React.ReactElement | null {
    const { theme } = this.props
    const { loading } = this.state
    const styles = getStyles(theme)

    const label = `(${lstrings.validating})`
    return loading ? <EdgeText style={styles.muted}>{label}</EdgeText> : null
  }

  renderFioWallets(): React.ReactElement | null {
    const { fioWallets } = this.props
    const { selectedWallet } = this.state

    if (fioWallets.length > 1) {
      const title =
        selectedWallet == null
          ? lstrings.fio_address_register_no_wallet_name
          : getWalletName(selectedWallet)
      return (
        <EdgeRow
          rightButtonType="touchable"
          title={lstrings.title_fio_connect_to_wallet}
          onPress={this.selectFioWallet}
          body={title}
        />
      )
    }
    return null
  }

  renderErrorMessage(): React.ReactElement | null {
    const { fioAddress, isAvailable, isValid, loading, errorMessage } =
      this.state
    let chooseHandleErrorMessage = ''

    if (loading) return null

    if (fioAddress !== '' && !this.props.isConnected) {
      chooseHandleErrorMessage = lstrings.fio_address_register_screen_cant_check
    }
    if (fioAddress !== '' && !isAvailable) {
      chooseHandleErrorMessage =
        lstrings.fio_address_register_screen_not_available
    }

    if (fioAddress !== '' && !isValid) {
      chooseHandleErrorMessage = lstrings.fio_error_invalid_address
    }

    if (fioAddress !== '' && !isValid && errorMessage !== '') {
      chooseHandleErrorMessage = errorMessage
    }

    return (
      <EdgeAnim
        visible={chooseHandleErrorMessage !== ''}
        enter={fadeIn}
        exit={fadeOut}
      >
        <AlertCardUi4 title={chooseHandleErrorMessage} type="error" />
      </EdgeAnim>
    )
  }

  render(): React.ReactElement {
    const { theme } = this.props
    const { fioAddress, selectedDomain, domainsLoading } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper scroll>
        <SceneHeader
          style={styles.header}
          title={lstrings.title_fio_address_confirmation}
          underline
          withTopMargin
        >
          <Image
            source={theme.fioAddressLogo}
            style={styles.image}
            resizeMode="cover"
          />
        </SceneHeader>
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
            <EdgeCard sections>
              <EdgeRow
                rightButtonType="editable"
                title={lstrings.fio_address_choose_label}
                onPress={this.editAddressPressed}
              >
                <View style={styles.addressTileBody}>
                  {fioAddress !== '' ? (
                    <EdgeText style={styles.fioAddressName}>
                      {fioAddress}
                    </EdgeText>
                  ) : (
                    <EdgeText style={styles.muted}>
                      {lstrings.fio_address_register_placeholder}
                    </EdgeText>
                  )}
                  {this.renderLoader()}
                </View>
              </EdgeRow>
              <EdgeRow
                rightButtonType="touchable"
                title={lstrings.fio_address_choose_domain_label}
                onPress={this.selectFioDomain}
                body={
                  domainsLoading
                    ? lstrings.loading
                    : `${FIO_ADDRESS_DELIMITER}${selectedDomain.name}`
                }
              />
              {this.renderFioWallets()}
            </EdgeCard>
          </View>
          {this.renderButton()}
          {this.renderErrorMessage()}
          <View style={styles.bottomSpace} />
        </View>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  view: {
    marginHorizontal: theme.rem(0.5)
  },
  createWalletPromptArea: {
    paddingHorizontal: theme.rem(0.5),
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
    marginTop: theme.rem(1.5)
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

export const FioAddressRegisterScene = connect<
  StateProps,
  DispatchProps,
  OwnProps
>(
  state => ({
    fioWallets: state.ui.fio.fioWallets,
    fioPlugin: state.core.account.currencyConfig.fio ?? typeHack,
    isConnected: state.network.isConnected
  }),
  dispatch => ({
    async createFioWallet() {
      return await dispatch(createFioWallet())
    }
  })
)(withTheme(FioAddressRegister))
