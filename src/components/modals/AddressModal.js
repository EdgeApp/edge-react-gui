// @flow

import { FormField, MaterialInputStyle, TertiaryButton } from 'edge-components'
import type { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import {
  ActivityIndicator,
  Clipboard,
  FlatList,
  Image,
  InputAccessoryView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import ENS_LOGO from '../../assets/images/ens_logo.png'
import FIO_LOGO from '../../assets/images/fio_logo.png'
import { CURRENCY_PLUGIN_NAMES } from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { refreshAllFioAddresses } from '../../modules/FioAddress/action'
import { type FioAddresses, checkPubAddress, getFioAddressCache } from '../../modules/FioAddress/util.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import THEME from '../../theme/variables/airbitz.js'
import type { Dispatch, State as StateType } from '../../types/reduxTypes.js'
import type { FioAddress, FlatListItem } from '../../types/types.js'
import { KeyboardTracker } from '../common/KeyboardTracker.js'
import ResolutionError, { ResolutionErrorCode } from '../common/ResolutionError.js'
import { type AirshipBridge, AirshipModal, dayText, IconCircle } from './modalParts.js'

const MODAL_ICON = 'address-book-o'
const inputAccessoryViewID: string = 'inputAccessoryViewID'

type OwnProps = {
  bridge: AirshipBridge<string | null>,
  walletId: string,
  currencyCode: string,
  title?: string,
  subtitle?: string,
  showPasteButton?: boolean,
  isFioOnly?: boolean,
  useUserFioAddressesOnly?: boolean,
  checkAddressConnected?: boolean
}

type StateProps = {
  account: EdgeAccount,
  userFioAddresses: FioAddress[],
  userFioAddressesLoading: boolean,
  coreWallet: EdgeCurrencyWallet,
  fioPlugin: EdgeCurrencyConfig
}

type DispatchProps = {
  refreshAllFioAddresses: () => Promise<void>
}

type State = {
  clipboard: string,
  uri: string,
  statusLabel: string,
  fieldError: string,
  cryptoAddress?: string,
  fioAddresses: FioAddresses,
  filteredFioAddresses: string[]
}

type Props = StateProps & OwnProps & DispatchProps

class AddressModalConnected extends React.Component<Props, State> {
  fioCheckQueue: number = 0

  constructor(props: Props) {
    super(props)
    this.fioCheckQueue = 0
    this.state = {
      clipboard: '',
      uri: '',
      statusLabel: s.strings.fragment_send_address,
      cryptoAddress: undefined,
      fieldError: '',
      fioAddresses: { addresses: {} },
      filteredFioAddresses: []
    }
  }

  componentDidMount() {
    this._setClipboard(this.props)
    this.getFioAddresses()
  }

  componentDidUpdate(prevProps) {
    if (this.props.useUserFioAddressesOnly && prevProps.userFioAddresses !== this.props.userFioAddresses) {
      this.filterFioAddresses(this.state.uri)
    }
  }

  _setClipboard = async props => {
    const coreWallet = props.coreWallet

    try {
      const uri = await Clipboard.getString()

      // Will throw in case uri is invalid
      await coreWallet.parseUri(uri)

      this.setState({
        clipboard: uri
      })
    } catch (e) {
      // Failure is acceptable
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
      for (const address in fioAddresses.addresses) {
        if (!fioAddresses.addresses[address]) continue // Ignore when address is not active (boolean false)
        const addressLowerCase = address.toLowerCase()
        if (uri !== '' && !addressLowerCase.includes(uri.toLowerCase())) continue // Autocomplete/Filter check
        if (isFioOnly && (this.checkIfDomain(address) || !address.includes('@'))) continue // if isFioOnly is true. Ignore address if not a valid FIO address
        fioAddressesArray.push(address)
      }
    }

    this.setState({ filteredFioAddresses: fioAddressesArray.sort() })
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
        const { fioPlugin } = this.props
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
    return fioPlugin.otherMethods.isFioAddressValid(fioAddress)
  }

  updateUri = (uri: string) => {
    this.setState({ uri })
    this.filterFioAddresses(uri)
  }

  onPasteFromClipboard = () => {
    const { clipboard } = this.state
    this.setState({ uri: clipboard }, async () => {
      if (await this.isFioAddressValid(clipboard)) {
        await this.checkIfFioAddress(clipboard)
      }
      this.handleSubmit()
    })
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
        <View style={styles.tileContainer}>
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
    const copyMessage = this.state.clipboard ? sprintf(s.strings.string_paste_address, this.state.clipboard) : null
    const { uri, statusLabel, fieldError, filteredFioAddresses } = this.state
    const { title, subtitle, showPasteButton, userFioAddressesLoading } = this.props
    return (
      <AirshipModal bridge={this.props.bridge} onCancel={this.handleClose} icon>
        {gap => (
          <>
            <IconCircle>
              <FontAwesomeIcon name={MODAL_ICON} size={iconStyles.size} color={iconStyles.color} />
            </IconCircle>
            <View style={styles.container}>
              <View style={styles.tileContainerHeader}>
                <Text style={dayText('title')}>{title || s.strings.address_modal_default_header}</Text>
                {subtitle && <Text style={dayText('autoCenter')}>{subtitle}</Text>}
              </View>
              <KeyboardTracker>
                {(keyboardAnimation, keyboardLayout) => {
                  if (keyboardLayout === 0 && showPasteButton && copyMessage) {
                    return (
                      <View style={styles.tileContainerButtons}>
                        <TertiaryButton ellipsizeMode="middle" onPress={this.onPasteFromClipboard} numberOfLines={1} style={styles.addressModalButton}>
                          <TertiaryButton.Text>{copyMessage}</TertiaryButton.Text>
                        </TertiaryButton>
                      </View>
                    )
                  }
                  return null
                }}
              </KeyboardTracker>
              <View style={styles.tileContainerInput}>
                {Platform.OS === 'ios' ? (
                  <InputAccessoryView nativeID={inputAccessoryViewID}>
                    <View style={styles.accessoryView}>
                      <TouchableOpacity style={styles.accessoryButton} onPress={this.handleClose}>
                        <Text style={styles.accessoryText}>{s.strings.string_cancel_cap}</Text>
                      </TouchableOpacity>
                    </View>
                  </InputAccessoryView>
                ) : null}
                <FormField
                  blurOnSubmit
                  returnKeyType="done"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={addressInputStyles}
                  value={uri}
                  onChangeText={this.onChangeTextDelayed}
                  error={fieldError}
                  label={statusLabel}
                  onSubmitEditing={this.handleSubmit}
                  inputAccessoryViewID={inputAccessoryViewID}
                />
              </View>
              {!userFioAddressesLoading ? (
                <FlatList
                  style={{ flex: 1, marginBottom: -gap.bottom }}
                  contentContainerStyle={{ paddingBottom: gap.bottom }}
                  data={filteredFioAddresses}
                  initialNumToRender={24}
                  keyboardShouldPersistTaps="handled"
                  keyExtractor={this.keyExtractor}
                  renderItem={this.renderFioAddressRow}
                />
              ) : (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator />
                </View>
              )}
            </View>
          </>
        )}
      </AirshipModal>
    )
  }
}

const AddressModal = connect(
  (state: StateType, ownProps: OwnProps): StateProps => {
    const { account } = state.core
    const { currencyWallets = {} } = account
    return {
      account,
      coreWallet: currencyWallets[ownProps.walletId],
      userFioAddresses: state.ui.scenes.fioAddress.fioAddresses,
      userFioAddressesLoading: state.ui.scenes.fioAddress.fioAddressesLoading,
      fioPlugin: account.currencyConfig[CURRENCY_PLUGIN_NAMES.FIO]
    }
  },
  (dispatch: Dispatch): DispatchProps => ({ refreshAllFioAddresses: () => dispatch(refreshAllFioAddresses()) })
)(AddressModalConnected)
export { AddressModal }

const { rem } = THEME

const addressInputStyles = {
  ...MaterialInputStyle,
  container: {
    ...MaterialInputStyle.container,
    paddingTop: 0
  }
}

const iconStyles = {
  size: rem(1.5),
  color: THEME.COLORS.SECONDARY
}

const tileStyles = {
  width: '100%',
  backgroundColor: THEME.COLORS.WHITE,
  borderBottomWidth: 1,
  borderBottomColor: THEME.COLORS.GRAY_3,
  padding: rem(0.75)
}

const rawStyles = {
  container: {
    flex: 1,
    width: '100%',
    flexDirection: 'column'
  },
  tileContainerHeader: {
    ...tileStyles,
    borderBottomWidth: 0,
    paddingTop: rem(0.75),
    paddingBottom: rem(0.375)
  },
  tileContainerButtons: {
    ...tileStyles,
    paddingTop: rem(0.375),
    paddingBottom: 0,
    borderBottomWidth: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tileContainerInput: {
    ...tileStyles,
    paddingVertical: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tileContainer: {
    ...tileStyles,
    flexDirection: 'row',
    alignItems: 'center'
  },
  fioAddressAvatarContainer: {
    width: rem(2.2),
    height: rem(2.2),
    borderRadius: rem(1.1),
    justifyContent: 'center',
    alignItems: 'center'
  },
  fioAddressText: {
    fontSize: rem(1),
    paddingLeft: rem(0.75)
  },
  addressModalButton: {
    width: '100%'
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  // Accessory Input
  accessoryView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.COLORS.WHITE
  },
  accessoryButton: {
    padding: rem(0.5)
  },
  accessoryText: {
    color: THEME.COLORS.ACCENT_BLUE,
    fontSize: rem(1)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
