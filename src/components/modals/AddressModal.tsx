import { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, FlatList, Image, Text, TouchableWithoutFeedback, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions'
import ENS_LOGO from '../../assets/images/ens_logo.png'
import FIO_LOGO from '../../assets/images/fio/fio_logo.png'
import { ENS_DOMAINS, UNSTOPPABLE_DOMAINS } from '../../constants/WalletAndCurrencyConstants'
import { lstrings } from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { ResolutionError } from '../../types/ResolutionError'
import { FioAddress, FlatListItem } from '../../types/types'
import { checkPubAddress, FioAddresses, getFioAddressCache } from '../../util/FioAddressUtils'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { FilledTextInput } from '../themed/FilledTextInput'
import { ButtonUi4 } from '../ui4/ButtonUi4'
import { ModalUi4 } from '../ui4/ModalUi4'

interface OwnProps {
  bridge: AirshipBridge<string | undefined>
  // eslint-disable-next-line react/no-unused-prop-types
  walletId: string
  currencyCode: string
  title?: string
  isFioOnly?: boolean
  useUserFioAddressesOnly?: boolean
  checkAddressConnected?: boolean
}

interface StateProps {
  account: EdgeAccount
  userFioAddresses: FioAddress[]
  userFioAddressesLoading: boolean
  coreWallet: EdgeCurrencyWallet
  fioPlugin?: EdgeCurrencyConfig
}

interface DispatchProps {
  refreshAllFioAddresses: () => Promise<void>
}

interface State {
  uri: string
  validLabel: string | undefined
  errorLabel: string | undefined
  cryptoAddress?: string
  fioAddresses: FioAddresses
  filteredFioAddresses: string[]
  showSpinner: boolean
}

type Props = StateProps & OwnProps & DispatchProps & ThemeProps

export class AddressModalComponent extends React.Component<Props, State> {
  fioCheckQueue: number = 0

  constructor(props: Props) {
    super(props)
    this.fioCheckQueue = 0
    this.state = {
      uri: '',
      validLabel: undefined,
      cryptoAddress: undefined,
      errorLabel: undefined,
      fioAddresses: { addresses: {} },
      filteredFioAddresses: [],
      showSpinner: false
    }
  }

  componentDidMount() {
    this.getFioAddresses().catch(err => showError(err))
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.useUserFioAddressesOnly && prevProps.userFioAddresses !== this.props.userFioAddresses) {
      this.filterFioAddresses(this.state.uri)
    }
    if (!this.props.account) {
      this.handleClose()
    }
  }

  getFioAddresses = async () => {
    const { useUserFioAddressesOnly, refreshAllFioAddresses, account } = this.props
    if (useUserFioAddressesOnly) {
      await refreshAllFioAddresses()
    } else {
      this.setState({ fioAddresses: await getFioAddressCache(account) })
      this.filterFioAddresses('')
    }
  }

  filterFioAddresses = (uri: string): void => {
    const { useUserFioAddressesOnly, userFioAddresses, isFioOnly } = this.props
    const { fioAddresses } = this.state
    const fioAddressesArray: string[] = []

    if (useUserFioAddressesOnly) {
      for (const address of userFioAddresses) {
        const addressLowerCase = address.name.toLowerCase()
        if (uri !== '' && !addressLowerCase.includes(uri.toLowerCase())) continue // Autocomplete/Filter Check
        fioAddressesArray.push(address.name)
      }
    }

    if (!useUserFioAddressesOnly) {
      for (const address of Object.keys(fioAddresses.addresses)) {
        if (!fioAddresses.addresses[address]) continue // Ignore when address is not active (boolean false)
        const addressLowerCase = address.toLowerCase()
        if (uri !== '' && !addressLowerCase.includes(uri.toLowerCase())) continue // Autocomplete/Filter check
        if (isFioOnly && (this.checkIfDomain(address) || !address.includes('@'))) continue // if isFioOnly is true. Ignore address if not a valid FIO address
        fioAddressesArray.push(address)
      }
    }

    this.setState({ filteredFioAddresses: fioAddressesArray.sort() })
  }

  onChangeTextDelayed = async (domain: string) => {
    this.setState({ errorLabel: undefined, validLabel: undefined })
    try {
      const { currencyCode } = this.props
      if (this.checkIfDomain(domain)) {
        await this.resolveAddress(domain, currencyCode)
      }
      this.updateUri(domain)
      await this.checkIfFioAddress(domain)
    } catch (error) {
      showError(error)
    }
  }

  checkIfDomain = (domain: string): boolean => {
    return this.checkIfUnstoppableDomain(domain) || this.checkIfEnsDomain(domain)
  }

  checkIfUnstoppableDomain = (name: string): boolean => UNSTOPPABLE_DOMAINS.some(domain => name.endsWith(domain))

  checkIfEnsDomain = (name: string): boolean => ENS_DOMAINS.some(domain => name.endsWith(domain))

  fetchUnstoppableDomainAddress = async (domain: string, currencyTicker: string): Promise<string> => {
    domain = domain.trim().toLowerCase()
    if (!this.checkIfUnstoppableDomain(domain)) {
      throw new ResolutionError('UnsupportedDomain', { domain })
    }
    const baseurl = `https://unstoppabledomains.com/api/v1`
    const url = `${baseurl}/${domain}`
    const response = await global.fetch(url).then(async res => await res.json())
    const { addresses, meta } = response
    if (!meta || !meta.owner) {
      throw new ResolutionError('UnregisteredDomain', { domain })
    }
    const ticker = currencyTicker.toUpperCase()
    if (!addresses || !addresses[ticker]) {
      throw new ResolutionError('UnspecifiedCurrency', { domain, currencyTicker })
    }
    return addresses[ticker]
  }

  fetchEnsAddress = async (domain: string): Promise<string> => {
    const ethPlugin: EdgeCurrencyConfig = this.props.account.currencyConfig.ethereum
    const address = await ethPlugin.otherMethods.resolveEnsName(domain)
    if (address == null) throw new ResolutionError('UnregisteredDomain', { domain })
    return address
  }

  resolveAddress = async (domain: string, currencyTicker: string) => {
    this.setState({ errorLabel: undefined })
    if (!domain) return
    this.setState({ showSpinner: true })
    try {
      this.setState({ errorLabel: undefined, validLabel: lstrings.resolving })
      let addr: string
      if (this.checkIfUnstoppableDomain(domain)) addr = await this.fetchUnstoppableDomainAddress(domain, currencyTicker)
      else if (this.checkIfEnsDomain(domain)) addr = await this.fetchEnsAddress(domain)
      else {
        throw new ResolutionError('UnsupportedDomain', { domain })
      }
      this.setState({ cryptoAddress: addr, validLabel: addr })
    } catch (err: any) {
      this.setState({ cryptoAddress: undefined, validLabel: undefined })

      if (err instanceof ResolutionError) {
        const message = sprintf(lstrings[err.code], domain, currencyTicker)
        this.setState({ errorLabel: message })
      }
    }
    this.setState({ showSpinner: false })
  }

  checkFioPubAddressQueue(uri: string) {
    this.setState({ validLabel: lstrings.resolving })
    this.fioCheckQueue++
    setTimeout(async () => {
      // do not check if user continue typing fio address
      if (this.fioCheckQueue > 1) {
        return --this.fioCheckQueue
      }
      this.fioCheckQueue = 0
      try {
        const { currencyCode, coreWallet, fioPlugin } = this.props
        if (!fioPlugin) return
        await checkPubAddress(fioPlugin, uri.toLowerCase(), coreWallet.currencyInfo.currencyCode, currencyCode)
        this.setState({ validLabel: undefined })
      } catch (e: any) {
        this.setState({ validLabel: undefined, errorLabel: e.message })
      }
    }, 1000)
  }

  checkFioAddressExistQueue = (fioAddress: string) => {
    this.setState({ validLabel: lstrings.resolving })
    this.fioCheckQueue++
    setTimeout(async () => {
      // do not check if user continue typing fio address
      if (this.fioCheckQueue > 1) {
        return --this.fioCheckQueue
      }
      this.fioCheckQueue = 0
      try {
        const { fioPlugin } = this.props
        if (!fioPlugin) return
        const doesAccountExist = await fioPlugin.otherMethods.doesAccountExist(fioAddress)
        this.setState({ validLabel: undefined })
        if (!doesAccountExist) {
          this.setState({ errorLabel: lstrings.err_no_address_title })
        }
      } catch (e: any) {
        this.setState({ validLabel: undefined, errorLabel: e.message })
      }
    }, 1000)
  }

  checkIfFioAddress = async (uri: string) => {
    const { useUserFioAddressesOnly, checkAddressConnected } = this.props
    if (await this.isFioAddressValid(uri)) {
      if (useUserFioAddressesOnly) return
      if (checkAddressConnected) {
        return this.checkFioPubAddressQueue(uri)
      }
      this.checkFioAddressExistQueue(uri)
    }
  }

  isFioAddressValid = (fioAddress: string) => {
    const { fioPlugin } = this.props
    return fioPlugin && fioPlugin.otherMethods.isFioAddressValid(fioAddress)
  }

  updateUri = (uri: string) => {
    this.setState({ uri })
    this.filterFioAddresses(uri)
  }

  onPressFioAddress = (address: string) => {
    this.setState({ uri: address }, async () => {
      if (await this.isFioAddressValid(address)) {
        await this.checkIfFioAddress(address)
      }
      this.handleSubmit()
    })
  }

  renderFioAddressRow = ({ item }: FlatListItem<string>) => {
    const styles = getStyles(this.props.theme)
    let addressType
    if (this.checkIfDomain(item)) {
      addressType = ENS_LOGO
    } else if (item.includes('@')) {
      addressType = FIO_LOGO
    } else {
      return null
    }
    return (
      <TouchableWithoutFeedback onPress={() => this.onPressFioAddress(item)}>
        <View style={styles.rowContainer}>
          <Image source={addressType} style={styles.fioAddressAvatarContainer} resizeMode="cover" />
          <Text style={styles.fioAddressText}>{item}</Text>
        </View>
      </TouchableWithoutFeedback>
    )
  }

  handleSubmit = () => {
    const { uri, cryptoAddress, errorLabel } = this.state
    const submitData = cryptoAddress || uri
    if (errorLabel != null) return
    this.props.bridge.resolve(submitData)
  }

  handleClose = () => this.props.bridge.resolve(undefined)
  keyExtractor = (item: string, index: number) => index.toString()

  render() {
    const { uri, validLabel, errorLabel, showSpinner, filteredFioAddresses } = this.state
    const { title, userFioAddressesLoading, theme } = this.props
    const styles = getStyles(theme)

    return (
      <ModalUi4 bridge={this.props.bridge} onCancel={this.handleClose} title={title ?? lstrings.address_modal_default_header}>
        <FilledTextInput
          around={0.5}
          bottom={1}
          autoCorrect={false}
          returnKeyType="search"
          autoCapitalize="none"
          placeholder={lstrings.fragment_send_address}
          onChangeText={this.onChangeTextDelayed}
          onSubmitEditing={this.handleSubmit}
          value={uri}
          error={errorLabel}
          valid={validLabel}
          showSpinner={showSpinner}
        />
        {!userFioAddressesLoading ? (
          <FlatList
            style={styles.listContainer}
            data={filteredFioAddresses}
            keyboardShouldPersistTaps="handled"
            keyExtractor={this.keyExtractor}
            renderItem={this.renderFioAddressRow}
          />
        ) : (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color={this.props.theme.iconTappable} />
          </View>
        )}
        {/* TODO: Sync between LoginUi <-> Gui
          <ButtonsViewUi4 sceneMargin primary={{ label: lstrings.string_next_capitalized, onPress: this.handleSubmit }} />
        */}
        <ButtonUi4 marginRem={[1, 0, 2]} label={lstrings.string_next_capitalized} onPress={this.handleSubmit} />
      </ModalUi4>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: theme.rem(0.5)
  },
  fioAddressAvatarContainer: {
    width: theme.rem(1.25),
    height: theme.rem(2.2),
    justifyContent: 'center',
    alignItems: 'center'
  },
  fioAddressText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    paddingLeft: theme.rem(0.75)
  },
  loaderContainer: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContainer: {
    flexGrow: 0,
    flexShrink: 1
  }
}))

export const AddressModal = connect<StateProps, DispatchProps, OwnProps>(
  (state, ownProps) => ({
    account: state.core.account,
    coreWallet: state.core.account.currencyWallets[ownProps.walletId],
    userFioAddresses: state.ui.fioAddress.fioAddresses,
    userFioAddressesLoading: state.ui.fioAddress.fioAddressesLoading,
    fioPlugin: state.core.account.currencyConfig.fio
  }),
  dispatch => ({
    async refreshAllFioAddresses() {
      await dispatch(refreshAllFioAddresses())
    }
  })
)(withTheme(AddressModalComponent))
