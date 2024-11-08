import Resolver from '@unstoppabledomains/resolution'
import { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, FlatList, Image, Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions'
import ENS_LOGO from '../../assets/images/ens_logo.png'
import FIO_LOGO from '../../assets/images/fio/fio_logo.png'
import { ENS_DOMAINS, SPECIAL_CURRENCY_INFO, UNSTOPPABLE_DOMAINS } from '../../constants/WalletAndCurrencyConstants'
import { ENV } from '../../env'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { Dispatch } from '../../types/reduxTypes'
import { ResolutionError } from '../../types/ResolutionError'
import { FioAddress, FlatListItem } from '../../types/types'
import { checkPubAddress, FioAddresses, getFioAddressCache } from '../../util/FioAddressUtils'
import { EdgeButton } from '../buttons/EdgeButton'
import { EdgeTouchableWithoutFeedback } from '../common/EdgeTouchableWithoutFeedback'
import { showDevError, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, useTheme } from '../services/ThemeContext'
import { ModalFilledTextInput } from '../themed/FilledTextInput'
import { EdgeModal } from './EdgeModal'

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
  dispatch: Dispatch
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
    const { account, dispatch, useUserFioAddressesOnly } = this.props
    if (useUserFioAddressesOnly) {
      await dispatch(refreshAllFioAddresses())
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
      showDevError(error)
    }
  }

  checkIfDomain = (domain: string): boolean => {
    return this.checkIfUnstoppableDomain(domain) || this.checkIfEnsDomain(domain)
  }

  checkIfUnstoppableDomain = (name: string): boolean => UNSTOPPABLE_DOMAINS.some(domain => name.endsWith(domain))

  checkIfEnsDomain = (name: string): boolean => ENS_DOMAINS.some(domain => name.endsWith(domain))

  fetchUnstoppableDomainAddress = async (resolver: Resolver, domain: string, currencyTicker: string): Promise<string> => {
    domain = domain.trim().toLowerCase()
    if (!this.checkIfUnstoppableDomain(domain)) {
      throw new ResolutionError('UnsupportedDomain', { domain })
    }

    if (currencyTicker == null) {
      throw new ResolutionError('UnsupportedCurrency', { currencyTicker: this.props.coreWallet.currencyInfo.displayName, domain })
    }

    const isValid = await resolver.isSupportedDomain(domain)
    if (!isValid) {
      throw new ResolutionError('UnsupportedDomain', { domain })
    }

    const address = await resolver.addr(domain, currencyTicker)
    if (address == null) {
      throw new ResolutionError('RecordNotFound', { domain })
    }

    return address
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
      if (this.checkIfUnstoppableDomain(domain) && ENV.UNSTOPPABLE_DOMAINS_API_KEY != null) {
        addr = await this.fetchUnstoppableDomainAddress(
          new Resolver({ apiKey: ENV.UNSTOPPABLE_DOMAINS_API_KEY }),
          domain,
          unstoppableDomainsPluginIds[this.props.coreWallet.currencyInfo.pluginId]
        )
      } else if (this.checkIfEnsDomain(domain)) addr = await this.fetchEnsAddress(domain)
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
      <EdgeTouchableWithoutFeedback onPress={() => this.onPressFioAddress(item)}>
        <View style={styles.rowContainer}>
          <Image source={addressType} style={styles.fioAddressAvatarContainer} resizeMode="cover" />
          <Text style={styles.fioAddressText}>{item}</Text>
        </View>
      </EdgeTouchableWithoutFeedback>
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
      <EdgeModal bridge={this.props.bridge} onCancel={this.handleClose} title={title ?? lstrings.address_modal_default_header}>
        <ModalFilledTextInput
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
        <EdgeButton marginRem={[1, 0, 2]} label={lstrings.string_next_capitalized} onPress={this.handleSubmit} />
      </EdgeModal>
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
    flexShrink: 1,
    marginTop: theme.rem(0.5)
  }
}))

export function AddressModal(props: OwnProps): JSX.Element {
  const theme = useTheme()
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const coreWallet = useSelector(state => state.core.account.currencyWallets[props.walletId])
  const fioPlugin = useSelector(state => state.core.account.currencyConfig.fio)
  const userFioAddresses = useSelector(state => state.ui.fioAddress.fioAddresses)
  const userFioAddressesLoading = useSelector(state => state.ui.fioAddress.fioAddressesLoading)

  return (
    <AddressModalComponent
      {...props}
      account={account}
      coreWallet={coreWallet}
      dispatch={dispatch}
      fioPlugin={fioPlugin}
      theme={theme}
      userFioAddresses={userFioAddresses}
      userFioAddressesLoading={userFioAddressesLoading}
    />
  )
}

const unstoppableDomainsPluginIds = Object.entries(SPECIAL_CURRENCY_INFO).reduce((map: Record<string, string>, [pluginId, info]) => {
  if (info.unstoppableDomainsTicker != null) {
    map[pluginId] = info.unstoppableDomainsTicker
  }
  return map
}, {})
