import Resolver from '@unstoppabledomains/resolution'
import type {
  EdgeAccount,
  EdgeCurrencyConfig,
  EdgeCurrencyWallet
} from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, FlatList, Image, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions'
import ENS_LOGO from '../../assets/images/ens_logo.png'
import FIO_LOGO from '../../assets/images/fio/fio_logo.png'
import {
  ENS_DOMAINS,
  SPECIAL_CURRENCY_INFO,
  UNSTOPPABLE_DOMAINS
} from '../../constants/WalletAndCurrencyConstants'
import { ENV } from '../../env'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { Dispatch } from '../../types/reduxTypes'
import { ResolutionError } from '../../types/ResolutionError'
import type { FioAddress, FlatListItem } from '../../types/types'
import {
  checkPubAddress,
  type FioAddresses,
  getFioAddressCache
} from '../../util/FioAddressUtils'
import { resolveName } from '../../util/resolveName'
import { EdgeButton } from '../buttons/EdgeButton'
import { EdgeTouchableWithoutFeedback } from '../common/EdgeTouchableWithoutFeedback'
import { showDevError, showError } from '../services/AirshipInstance'
import {
  cacheStyles,
  type Theme,
  type ThemeProps,
  useTheme
} from '../services/ThemeContext'
import { UnscaledText } from '../text/UnscaledText'
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

  componentDidMount(): void {
    this.getFioAddresses().catch((err: unknown) => {
      showError(err)
    })
  }

  componentDidUpdate(prevProps: Props): void {
    if (
      this.props.useUserFioAddressesOnly === true &&
      prevProps.userFioAddresses !== this.props.userFioAddresses
    ) {
      this.filterFioAddresses(this.state.uri)
    }
    if (this.props.account == null) {
      this.handleClose()
    }
  }

  getFioAddresses = async (): Promise<void> => {
    const { account, dispatch, useUserFioAddressesOnly } = this.props
    if (useUserFioAddressesOnly === true) {
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

    if (useUserFioAddressesOnly === true) {
      for (const address of userFioAddresses) {
        const addressLowerCase = address.name.toLowerCase()
        if (uri !== '' && !addressLowerCase.includes(uri.toLowerCase()))
          continue // Autocomplete/Filter Check
        fioAddressesArray.push(address.name)
      }
    }

    if (useUserFioAddressesOnly !== true) {
      for (const address of Object.keys(fioAddresses.addresses)) {
        if (!fioAddresses.addresses[address]) continue // Ignore when address is not active (boolean false)
        const addressLowerCase = address.toLowerCase()
        if (uri !== '' && !addressLowerCase.includes(uri.toLowerCase()))
          continue // Autocomplete/Filter check
        if (
          isFioOnly === true &&
          (this.checkIfDomain(address) || !address.includes('@'))
        )
          continue // if isFioOnly is true. Ignore address if not a valid FIO address
        fioAddressesArray.push(address)
      }
    }

    this.setState({ filteredFioAddresses: fioAddressesArray.sort() })
  }

  onChangeTextDelayed = async (domain: string): Promise<void> => {
    this.setState({ errorLabel: undefined, validLabel: undefined })
    this.updateUri(domain)
    try {
      const { currencyCode } = this.props
      if (this.checkIfDomain(domain)) {
        await this.resolveName(domain, currencyCode)
      }
      await this.checkIfFioAddress(domain)
    } catch (error: unknown) {
      showDevError(error)
    }
  }

  // Non-async wrapper to satisfy handler-name and no-misused-promises rules
  handleChangeText = (domain: string): void => {
    this.onChangeTextDelayed(domain).catch((e: unknown) => {
      showDevError(e)
    })
  }

  checkIfAlias = (domain: string): boolean => {
    return domain.startsWith('@')
  }

  checkIfDomain = (domain: string): boolean => {
    return (
      this.checkIfUnstoppableDomain(domain) ||
      this.checkIfEnsDomain(domain) ||
      this.checkIfAlias(domain)
    )
  }

  checkIfUnstoppableDomain = (name: string): boolean =>
    UNSTOPPABLE_DOMAINS.some(domain => name.endsWith(domain))

  checkIfEnsDomain = (name: string): boolean =>
    ENS_DOMAINS.some(domain => name.endsWith(domain))

  fetchUnstoppableDomainAddress = async (
    resolver: Resolver,
    domain: string,
    currencyTicker: string
  ): Promise<string> => {
    domain = domain.trim().toLowerCase()
    if (!this.checkIfUnstoppableDomain(domain)) {
      throw new ResolutionError('UnsupportedDomain', { domain })
    }

    if (currencyTicker == null) {
      throw new ResolutionError('UnsupportedCurrency', {
        currencyTicker: this.props.coreWallet.currencyInfo.displayName,
        domain
      })
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
    const ethPlugin: EdgeCurrencyConfig =
      this.props.account.currencyConfig.ethereum
    const address = await ethPlugin.otherMethods.resolveEnsName(domain)
    if (address == null)
      throw new ResolutionError('UnregisteredDomain', { domain })
    return address
  }

  resolveName = async (name: string, currencyTicker: string): Promise<void> => {
    this.setState({ errorLabel: undefined })
    if (name === '') return
    this.setState({ showSpinner: true })
    try {
      this.setState({ errorLabel: undefined, validLabel: lstrings.resolving })
      let address: string | undefined = await resolveName(
        this.props.coreWallet,
        name
      ).catch(() => undefined)
      if (
        this.checkIfUnstoppableDomain(name) &&
        ENV.UNSTOPPABLE_DOMAINS_API_KEY != null
      ) {
        address = await this.fetchUnstoppableDomainAddress(
          new Resolver({ apiKey: ENV.UNSTOPPABLE_DOMAINS_API_KEY }),
          name,
          unstoppableDomainsPluginIds[
            this.props.coreWallet.currencyInfo.pluginId
          ]
        )
      } else if (this.checkIfEnsDomain(name)) {
        address = await this.fetchEnsAddress(name)
      }
      if (address == null) {
        throw new ResolutionError('UnsupportedDomain', { domain: name })
      }
      this.setState({ cryptoAddress: address, validLabel: address })
    } catch (err: unknown) {
      this.setState({ cryptoAddress: undefined, validLabel: undefined })

      if (err instanceof ResolutionError) {
        const message = sprintf(lstrings[err.code], name, currencyTicker)
        this.setState({ errorLabel: message })
      }
    }
    this.setState({ showSpinner: false })
  }

  checkFioPubAddressQueue(uri: string): void {
    this.setState({ validLabel: lstrings.resolving })
    this.fioCheckQueue++
    setTimeout(() => {
      // do not check if user continue typing fio address
      if (this.fioCheckQueue > 1) {
        this.fioCheckQueue--
        return
      }
      this.fioCheckQueue = 0
      const { currencyCode, coreWallet, fioPlugin } = this.props
      if (fioPlugin == null) return
      checkPubAddress(
        fioPlugin,
        uri.toLowerCase(),
        coreWallet.currencyInfo.currencyCode,
        currencyCode
      )
        .then(() => {
          this.setState({ validLabel: undefined })
        })
        .catch((e: unknown) => {
          const message = e instanceof Error ? e.message : String(e)
          this.setState({ validLabel: undefined, errorLabel: message })
        })
    }, 1000)
  }

  checkFioAddressExistQueue = (fioAddress: string): void => {
    this.setState({ validLabel: lstrings.resolving })
    this.fioCheckQueue++
    setTimeout(() => {
      // do not check if user continue typing fio address
      if (this.fioCheckQueue > 1) {
        this.fioCheckQueue--
        return
      }
      this.fioCheckQueue = 0
      const { fioPlugin } = this.props
      if (fioPlugin == null) return
      fioPlugin.otherMethods
        .doesAccountExist(fioAddress)
        .then((doesAccountExist: boolean) => {
          this.setState({ validLabel: undefined })
          if (!doesAccountExist) {
            this.setState({ errorLabel: lstrings.err_no_address_title })
          }
        })
        .catch((e: unknown) => {
          const message = e instanceof Error ? e.message : String(e)
          this.setState({ validLabel: undefined, errorLabel: message })
        })
    }, 1000)
  }

  checkIfFioAddress = async (uri: string): Promise<void> => {
    const { useUserFioAddressesOnly, checkAddressConnected } = this.props
    if ((await this.isFioAddressValid(uri)) === true) {
      if (useUserFioAddressesOnly === true) return
      if (checkAddressConnected === true) {
        this.checkFioPubAddressQueue(uri)
        return
      }
      this.checkFioAddressExistQueue(uri)
    }
  }

  isFioAddressValid = (
    fioAddress: string
  ): Promise<boolean> | boolean | undefined => {
    const { fioPlugin } = this.props
    return fioPlugin?.otherMethods.isFioAddressValid(fioAddress)
  }

  updateUri = (uri: string): void => {
    this.setState({ uri })
    this.filterFioAddresses(uri)
  }

  onPressFioAddress = (address: string): void => {
    this.setState({ uri: address }, () => {
      const result = this.isFioAddressValid(address)
      Promise.resolve(result)
        .then(async valid => {
          if (valid === true) {
            await this.checkIfFioAddress(address)
          }
        })
        .catch((e: unknown) => {
          showDevError(e)
        })
        .finally(() => {
          this.handleSubmit()
        })
    })
  }

  renderFioAddressRow = ({
    item
  }: FlatListItem<string>): React.ReactElement | null => {
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
      <EdgeTouchableWithoutFeedback
        onPress={() => {
          this.onPressFioAddress(item)
        }}
      >
        <View style={styles.rowContainer}>
          <Image
            source={addressType}
            style={styles.fioAddressAvatarContainer}
            resizeMode="cover"
          />
          <UnscaledText style={styles.fioAddressText}>{item}</UnscaledText>
        </View>
      </EdgeTouchableWithoutFeedback>
    )
  }

  handleSubmit = (): void => {
    const { uri, cryptoAddress, errorLabel } = this.state
    const { coreWallet } = this.props

    let submitData = cryptoAddress ?? uri
    // Preserve Zano alias inputs (e.g., "@alias") so the caller can capture
    // and persist the alias in transaction metadata while still resolving it
    // before parsing the URI.
    if (
      coreWallet.currencyInfo.pluginId === 'zano' &&
      typeof uri === 'string' &&
      uri.startsWith('@')
    ) {
      submitData = uri
    }
    if (errorLabel != null) return
    this.props.bridge.resolve(submitData)
  }

  handleClose = (): void => {
    this.props.bridge.resolve(undefined)
  }

  keyExtractor = (item: string, index: number): string => index.toString()

  render(): React.ReactElement {
    const { uri, validLabel, errorLabel, showSpinner, filteredFioAddresses } =
      this.state
    const { title, userFioAddressesLoading, theme } = this.props
    const styles = getStyles(theme)

    return (
      <EdgeModal
        bridge={this.props.bridge}
        onCancel={this.handleClose}
        title={title ?? lstrings.address_modal_default_header}
      >
        <ModalFilledTextInput
          autoCorrect={false}
          returnKeyType="search"
          autoCapitalize="none"
          placeholder={lstrings.fragment_send_address}
          onChangeText={this.handleChangeText}
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
        <EdgeButton
          marginRem={[1, 0, 2]}
          label={lstrings.string_next_capitalized}
          onPress={this.handleSubmit}
        />
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

export function AddressModal(props: OwnProps): React.ReactElement {
  const theme = useTheme()
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const coreWallet = useSelector(
    state => state.core.account.currencyWallets[props.walletId]
  )
  const fioPlugin = useSelector(state => state.core.account.currencyConfig.fio)
  const userFioAddresses = useSelector(
    state => state.ui.fioAddress.fioAddresses
  )
  const userFioAddressesLoading = useSelector(
    state => state.ui.fioAddress.fioAddressesLoading
  )

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

const unstoppableDomainsPluginIds = Object.entries(
  SPECIAL_CURRENCY_INFO
).reduce((map: Record<string, string>, [pluginId, info]) => {
  if (info.unstoppableDomainsTicker != null) {
    map[pluginId] = info.unstoppableDomainsTicker
  }
  return map
}, {})
