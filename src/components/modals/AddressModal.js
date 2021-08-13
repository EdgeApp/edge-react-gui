// @flow

import type { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, FlatList, Image, TouchableWithoutFeedback, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions.js'
import ENS_LOGO from '../../assets/images/ens_logo.png'
import FIO_LOGO from '../../assets/images/fio/fio_logo.png'
import { CURRENCY_PLUGIN_NAMES } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { type FioAddresses, checkExpiredFioAddress, checkPubAddress, getFioAddressCache } from '../../modules/FioAddress/util.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { connect } from '../../types/reactRedux.js'
import { ResolutionError, ResolutionErrorCode } from '../../types/ResolutionError.js'
import type { FioAddress, FlatListItem } from '../../types/types.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeTextFieldOutlined } from '../themed/EdgeOutlinedField'
import { MainButton } from '../themed/MainButton.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type OwnProps = {
  bridge: AirshipBridge<string | null>,
  // eslint-disable-next-line react/no-unused-prop-types
  walletId: string,
  currencyCode: string,
  title?: string,
  isFioOnly?: boolean,
  useUserFioAddressesOnly?: boolean,
  checkAddressConnected?: boolean,
  showSearchIcon?: boolean
}

type StateProps = {
  account: EdgeAccount,
  userFioAddresses: FioAddress[],
  userFioAddressesLoading: boolean,
  coreWallet: EdgeCurrencyWallet,
  fioPlugin?: EdgeCurrencyConfig,
  fioWallets: EdgeCurrencyWallet[]
}

type DispatchProps = {
  refreshAllFioAddresses: () => void
}

type State = {
  uri: string,
  statusLabel: string,
  fieldError: string,
  cryptoAddress?: string,
  fioAddresses: FioAddresses,
  filteredFioAddresses: string[],
  isFocused: boolean
}

type Props = StateProps & OwnProps & DispatchProps & ThemeProps

class AddressModalComponent extends React.Component<Props, State> {
  fioCheckQueue: number = 0
  textInput = React.createRef()

  constructor(props: Props) {
    super(props)
    this.fioCheckQueue = 0
    this.state = {
      uri: '',
      statusLabel: s.strings.fragment_send_address,
      cryptoAddress: undefined,
      fieldError: '',
      fioAddresses: { addresses: {} },
      filteredFioAddresses: [],
      isFocused: false
    }
  }

  componentDidMount() {
    this.getFioAddresses()

    if (this.textInput.current) {
      this.textInput.current.focus()
    }
  }

  componentDidUpdate(prevProps) {
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
      refreshAllFioAddresses()
    } else {
      this.setState({ fioAddresses: await getFioAddressCache(account) })
      this.filterFioAddresses('')
    }
  }

  setStatusLabel = (status: string) => {
    this.setState({ statusLabel: status })
  }

  setCryptoAddress = (address?: string) => {
    this.setState({ cryptoAddress: address })
  }

  filterFioAddresses = (uri: string): void => {
    const { useUserFioAddressesOnly, userFioAddresses, isFioOnly } = this.props
    const { fioAddresses } = this.state
    const fioAddressesArray = []

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

  clearText = () => {
    this.setState({ uri: '' })
    if (this.textInput.current) {
      this.textInput.current.blur()
    }
  }

  fieldOnFocus = () => {
    this.setState({ isFocused: true })
  }

  fieldOnBlur = () => {
    this.setState({ isFocused: false })
  }

  onChangeTextDelayed = (domain: string) => {
    const { currencyCode } = this.props
    if (this.checkIfDomain(domain)) {
      this.resolveAddress(domain, currencyCode)
    }
    this.checkIfFioAddress(domain)
    this.updateUri(domain)
  }

  checkIfDomain = (domain: string): boolean => {
    return this.checkIfUnstoppableDomain(domain) || this.checkIfEnsDomain(domain)
  }

  checkIfUnstoppableDomain = (domain: string): boolean => {
    return domain.endsWith('.zil') || domain.endsWith('.crypto')
  }

  checkIfEnsDomain = (domain: string): boolean => {
    return domain.endsWith('.eth') || domain.endsWith('.luxe') || domain.endsWith('.kred') || domain.endsWith('.xyz')
  }

  fetchDomain = async (domain: string, currencyTicker: string): Promise<string> => {
    domain = domain.trim().toLowerCase()
    if (!this.checkIfDomain(domain)) {
      throw new ResolutionError(ResolutionErrorCode.UnsupportedDomain, { domain })
    }
    const baseurl = `https://unstoppabledomains.com/api/v1`
    const url = this.checkIfEnsDomain(domain) ? `${baseurl}/${domain}/${currencyTicker}` : `${baseurl}/${domain}`
    const response = await global.fetch(url).then(res => res.json())
    const { addresses, meta } = response
    if (!meta || !meta.owner) {
      throw new ResolutionError(ResolutionErrorCode.UnregisteredDomain, { domain })
    }
    const ticker = currencyTicker.toUpperCase()
    if (!addresses || !addresses[ticker]) {
      throw new ResolutionError(ResolutionErrorCode.UnspecifiedCurrency, { domain, currencyTicker })
    }
    return addresses[ticker]
  }

  resolveAddress = async (domain: string, currencyTicker: string) => {
    if (!domain) return
    try {
      this.setStatusLabel(s.strings.resolving)
      const addr = await this.fetchDomain(domain, currencyTicker)
      this.setStatusLabel(addr)
      this.setCryptoAddress(addr)
    } catch (err) {
      if (err instanceof ResolutionError) {
        const message = sprintf(s.strings[err.code], domain, currencyTicker)
        if (domain === '') this.setStatusLabel(s.strings.fragment_send_address)
        else {
          this.setStatusLabel(message)
          this.setCryptoAddress(undefined)
        }
      }
    }
  }

  checkFioPubAddressQueue(uri: string) {
    this.setStatusLabel(s.strings.resolving)
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
        this.setStatusLabel(s.strings.fragment_send_address)
      } catch (e) {
        this.setStatusLabel(s.strings.fragment_send_address)
        return this.setState({ fieldError: e.message })
      }
    }, 1000)
  }

  checkFioAddressExistQueue = (fioAddress: string) => {
    this.setStatusLabel(s.strings.resolving)
    this.fioCheckQueue++
    setTimeout(async () => {
      // do not check if user continue typing fio address
      if (this.fioCheckQueue > 1) {
        return --this.fioCheckQueue
      }
      this.fioCheckQueue = 0
      try {
        const { fioPlugin, fioWallets } = this.props
        if (!fioPlugin) return
        if (await checkExpiredFioAddress(fioWallets[0], fioAddress)) {
          return this.setState({ fieldError: s.strings.fio_address_expired })
        }
        const doesAccountExist = await fioPlugin.otherMethods.doesAccountExist(fioAddress)
        this.setStatusLabel(s.strings.fragment_send_address)
        if (!doesAccountExist) {
          return this.setState({ fieldError: s.strings.err_no_address_title })
        }
      } catch (e) {
        this.setStatusLabel(s.strings.fragment_send_address)
        return this.setState({ fieldError: e.message })
      }
    }, 1000)
  }

  checkIfFioAddress = async (uri: string) => {
    const { useUserFioAddressesOnly, checkAddressConnected } = this.props
    this.setState({ fieldError: '' })

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
    const { uri, cryptoAddress, fieldError } = this.state
    const submitData = cryptoAddress || uri
    if (fieldError) return
    this.props.bridge.resolve(submitData)
  }

  handleClose = () => this.props.bridge.resolve(null)
  keyExtractor = (item: string, index: number) => index.toString()

  render() {
    const { uri, statusLabel, fieldError, filteredFioAddresses, isFocused } = this.state
    const { title, userFioAddressesLoading, showSearchIcon = true } = this.props
    const styles = getStyles(this.props.theme)

    return (
      <ThemedModal bridge={this.props.bridge} onCancel={this.handleClose} paddingRem={1}>
        <ModalTitle center paddingRem={[0, 2, 1]}>
          {title || s.strings.address_modal_default_header}
        </ModalTitle>
        <View style={styles.container}>
          <EdgeTextFieldOutlined
            size="small"
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            autoCapitalize="none"
            label={statusLabel}
            onChangeText={this.onChangeTextDelayed}
            onSubmitEditing={this.handleSubmit}
            onFocus={this.fieldOnFocus}
            onBlur={this.fieldOnBlur}
            value={uri}
            onClear={this.clearText}
            isClearable={isFocused}
            marginRem={[0, 1]}
            ref={this.textInput}
            error={fieldError}
            blurOnSubmit
            showSearchIcon={showSearchIcon}
          />
          {!userFioAddressesLoading ? (
            <FlatList
              data={filteredFioAddresses}
              initialNumToRender={24}
              keyboardShouldPersistTaps="handled"
              keyExtractor={this.keyExtractor}
              renderItem={this.renderFioAddressRow}
            />
          ) : (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color={this.props.theme.iconTappable} />
            </View>
          )}
          <MainButton label={s.strings.submit} marginRem={[0, 4]} type="secondary" onPress={this.handleSubmit} />
        </View>
        <ModalCloseArrow onPress={this.handleClose} />
      </ThemedModal>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    width: '100%',
    flexDirection: 'column'
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.rem(0.5)
  },
  fioAddressAvatarContainer: {
    width: theme.rem(1.25),
    height: theme.rem(2.2),
    justifyContent: 'center',
    alignItems: 'center'
  },
  fioAddressText: {
    fontSize: theme.rem(1),
    paddingLeft: theme.rem(0.75),
    color: theme.primaryText
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
}))

export const AddressModal = connect<StateProps, DispatchProps, OwnProps>(
  (state, ownProps) => ({
    account: state.core.account,
    coreWallet: state.core.account.currencyWallets[ownProps.walletId],
    userFioAddresses: state.ui.scenes.fioAddress.fioAddresses,
    userFioAddressesLoading: state.ui.scenes.fioAddress.fioAddressesLoading,
    fioPlugin: state.core.account.currencyConfig[CURRENCY_PLUGIN_NAMES.FIO],
    fioWallets: state.ui.wallets.fioWallets
  }),
  dispatch => ({
    refreshAllFioAddresses() {
      dispatch(refreshAllFioAddresses())
    }
  })
)(withTheme(AddressModalComponent))
