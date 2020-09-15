// @flow

import { type EdgeCurrencyConfig, type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import fioAddressIcon from '../../assets/images/list_fioAddress.png'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { DomainListModal } from '../../modules/FioAddress/components/DomainListModal'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { TextAndIconButton, TextAndIconButtonStyle } from '../../modules/UI/components/Buttons/TextAndIconButton.ui.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'
import type { FioDomain, FioPublicDomain } from '../../types/types'
import { scale } from '../../util/scaling.js'
import { openLink } from '../../util/utils'
import { FormField, MaterialInputOnWhite } from '../common/FormField.js'
import type { WalletListResult } from '../modals/WalletListModal'
import { WalletListModal } from '../modals/WalletListModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'

export type State = {
  selectedWallet: EdgeCurrencyWallet | null,
  selectedDomain: FioDomain,
  publicDomains: FioDomain[],
  fioAddress: string,
  isValid: boolean,
  touched: boolean,
  loading: boolean,
  walletLoading: boolean,
  domainsLoading: boolean,
  isAvailable: boolean | null,
  fieldPos: number,
  inputWidth: number,
  showFreeAddressLink: boolean
}

export type StateProps = {
  fioWallets: EdgeCurrencyWallet[],
  fioPlugin: EdgeCurrencyConfig,
  isConnected: boolean
}

export type DispatchProps = {
  createFioWallet: () => Promise<EdgeCurrencyWallet>
}

type Props = StateProps & DispatchProps

export class FioAddressRegisterScene extends React.Component<Props, State> {
  fioCheckQueue: number = 0
  clearButtonMode = 'while-editing'
  returnKeyType = 'next'

  state = {
    selectedWallet: null,
    selectedDomain: Constants.FIO_DOMAIN_DEFAULT,
    publicDomains: [],
    fioAddress: '',
    isValid: true,
    touched: false,
    isAvailable: false,
    loading: false,
    walletLoading: false,
    domainsLoading: true,
    fieldPos: 200,
    inputWidth: scale(200),
    showFreeAddressLink: false
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
        .sort(publicDomain => (publicDomain.domain === Constants.FIO_DOMAIN_DEFAULT.name ? -1 : 1))
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

  handleNextButton = () => {
    const { isConnected } = this.props
    const { fioAddress, selectedWallet, selectedDomain, isValid, isAvailable, loading, walletLoading } = this.state
    if (isValid && isAvailable && !loading && !walletLoading) {
      if (isConnected) {
        if (!selectedWallet) return showError(s.strings.create_wallet_failed_message)
        const fullAddress = `${fioAddress}${Constants.FIO_ADDRESS_DELIMITER}${selectedDomain.name}`
        if (selectedDomain.isFree) {
          Actions[Constants.FIO_ADDRESS_CONFIRM]({
            fioAddressName: fullAddress,
            paymentWallet: selectedWallet,
            fee: 0,
            ownerPublicKey: selectedWallet.publicWalletInfo.keys.publicKey
          })
        } else {
          Actions[Constants.FIO_ADDRESS_REGISTER_SELECT_WALLET]({
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

  checkFioAddress(fioAddress: string, domain: string) {
    this.setState({
      loading: true
    })
    this.fioCheckQueue++
    setTimeout(async () => {
      // do not check if user continue typing fio address
      if (this.fioCheckQueue > 1) {
        return --this.fioCheckQueue
      }
      this.fioCheckQueue = 0
      try {
        const { fioPlugin } = this.props
        const fullAddress = `${fioAddress}${Constants.FIO_ADDRESS_DELIMITER}${domain}`
        const isAvailable = fioPlugin.otherMethods ? await fioPlugin.otherMethods.validateAccount(fullAddress) : false
        this.setState({
          isAvailable,
          loading: false
        })
      } catch (e) {
        this.setState({
          loading: false
        })
      }
    }, 1000)
  }

  handleFioAddressChange = (fioAddressChanged: string) => {
    if (!this.props.isConnected) {
      return this.setState({
        fioAddress: fioAddressChanged,
        touched: true,
        isAvailable: null,
        loading: false
      })
    }
    this.checkFioAddress(fioAddressChanged, this.state.selectedDomain.name)

    this.setState({
      fioAddress: fioAddressChanged.toLowerCase(),
      touched: true,
      isAvailable: null
    })
  }

  handleFioAddressFocus = () => {
    this.refs._scrollView.scrollTo({ x: 0, y: this.state.fieldPos, animated: true })
  }

  fieldViewOnLayout = () => {
    this.refs._fieldView.measure((x, y) => {
      this.setState({ fieldPos: y })
    })
  }

  handleFioWalletChange = (walletId: string) => {
    this.setState({
      selectedWallet: this.props.fioWallets.find(fioWallet => fioWallet.id === walletId)
    })
  }

  selectFioWallet = () => {
    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={[Constants.FIO_STR]} />).then(
      ({ walletId, currencyCode }: WalletListResult) => {
        if (walletId && currencyCode) {
          if (currencyCode === Constants.FIO_STR) {
            this.handleFioWalletChange(walletId)
          } else {
            showError(`${s.strings.create_wallet_select_valid_crypto}: ${Constants.FIO_STR}`)
          }
        }
      }
    )
  }

  selectFioDomain = () => {
    Airship.show(bridge => <DomainListModal bridge={bridge} publicDomains={this.state.publicDomains} />).then((response: FioDomain | null) => {
      if (response) {
        this.setState({ selectedDomain: response })
        this.checkFioAddress(this.state.fioAddress, response.name)
      }
    })
  }

  domainOnLayout = (event: { nativeEvent: { layout: { x: number, y: number, width: number, height: number } } }) => {
    this.setState({ inputWidth: calcInputWidth(event.nativeEvent.layout.width) })
  }

  renderButton() {
    const { isValid, isAvailable, loading, walletLoading } = this.state

    if (isValid && isAvailable && !loading) {
      return (
        <View style={styles.buttons}>
          <PrimaryButton style={styles.next} onPress={this.handleNextButton} disabled={!isAvailable || walletLoading}>
            {walletLoading ? <ActivityIndicator size="small" /> : <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>}
          </PrimaryButton>
        </View>
      )
    }

    return null
  }

  renderLoader() {
    const { isValid, touched, isAvailable, loading } = this.state

    let icon = null
    if ((!isValid || isAvailable === false) && touched) {
      icon = <Icon style={[styles.statusIcon, styles.statusIconError]} type={Constants.MATERIAL_COMMUNITY} name={Constants.CLOSE_CIRCLE_ICON} size={25} />
    }
    if (isValid && isAvailable && touched) {
      icon = <Icon style={[styles.statusIcon, styles.statusIconOk]} type={Constants.MATERIAL_COMMUNITY} name={Constants.CHECK_CIRCLE_ICON} size={25} />
    }

    return <View style={styles.statusIconContainer}>{loading ? <ActivityIndicator style={styles.statusIcon} size="small" /> : icon}</View>
  }

  renderFioWallets() {
    const { fioWallets } = this.props
    const { selectedWallet } = this.state
    if (fioWallets && fioWallets.length > 1) {
      const title = `${s.strings.title_fio_connect_to_wallet}: ${
        selectedWallet && selectedWallet.name ? selectedWallet.name : s.strings.fio_address_register_no_wallet_name
      }`
      return (
        <TextAndIconButton
          style={{ ...TextAndIconButtonStyle, container: styles.selectWalletBtn }}
          onPress={this.selectFioWallet}
          icon={Constants.KEYBOARD_ARROW_DOWN}
          title={title}
        />
      )
    }
  }

  render() {
    const { fioAddress, selectedDomain, touched, isAvailable, domainsLoading, walletLoading, showFreeAddressLink } = this.state
    let chooseHandleErrorMessage = ''
    if (touched && !this.props.isConnected) {
      chooseHandleErrorMessage = s.strings.fio_address_register_screen_cant_check
    }
    if (touched && isAvailable === false) {
      chooseHandleErrorMessage = s.strings.fio_address_register_screen_not_available
    }

    const materialInputOnWhiteStyle = {
      ...MaterialInputOnWhite,
      container: {
        ...MaterialInputOnWhite.container,
        ...styles.inputContainer,
        width: this.state.inputWidth
      }
    }

    return (
      <SafeAreaView>
        <Gradient style={styles.scrollableGradient} />
        <ScrollView ref="_scrollView">
          <View style={styles.scrollableView}>
            <Image source={fioAddressIcon} style={styles.image} resizeMode="cover" />
            <View style={[styles.createWalletPromptArea, styles.paddings, styles.title]}>
              <T style={styles.instructionalText}>{s.strings.fio_address_first_screen_title}</T>
            </View>
            <View style={[styles.createWalletPromptArea, styles.paddings]}>
              <T style={styles.handleRequirementsText}>{s.strings.fio_address_features}</T>
            </View>
            <View style={[styles.createWalletPromptArea, styles.paddings]}>
              <T style={styles.handleRequirementsText}>{s.strings.fio_address_first_screen_end}</T>
            </View>

            <View style={styles.formFieldView} ref="_fieldView" onLayout={this.fieldViewOnLayout}>
              <View style={styles.formFieldViewContainer}>
                <FormField
                  style={materialInputOnWhiteStyle}
                  clearButtonMode={this.clearButtonMode}
                  autoCorrect={false}
                  autoCapitalize="none"
                  placeholder={s.strings.fio_address_confirm_screen_label}
                  caretHidden
                  onFocus={this.handleFioAddressFocus}
                  onChangeText={this.handleFioAddressChange}
                  onSubmitEditing={this.handleNextButton}
                  selectionColor={THEME.COLORS.ACCENT_MINT}
                  label={s.strings.fio_address_choose_label}
                  value={fioAddress}
                  returnKeyType={this.returnKeyType}
                  error={chooseHandleErrorMessage}
                  disabled={walletLoading || domainsLoading}
                />
                <TouchableOpacity style={styles.domain} onPress={this.selectFioDomain} disabled={domainsLoading}>
                  <View onLayout={this.domainOnLayout}>
                    {domainsLoading ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <T style={styles.domainText}>
                        {Constants.FIO_ADDRESS_DELIMITER}
                        {selectedDomain.name}
                      </T>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
              {this.renderLoader()}
            </View>

            {this.renderFioWallets()}
            {this.renderButton()}
            {this.props.fioWallets.length && showFreeAddressLink ? (
              <View style={[styles.createWalletPromptArea, styles.paddings]}>
                <TouchableOpacity onPress={this.registerFreeAddress} underlayColor={`${THEME.COLORS.PRIMARY}${THEME.ALPHA.LOW}`}>
                  <View>
                    <T style={styles.link}>{s.strings.fio_address_reg_free}</T>
                  </View>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={styles.bottomSpace} />
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const calcInputWidth = (domainWidth: number) => styles.formFieldViewContainer.width - scale(33) - domainWidth

const rawStyles = {
  scrollableGradient: {
    height: THEME.HEADER
  },
  scrollableView: {
    position: 'relative',
    paddingHorizontal: 20
  },
  createWalletPromptArea: {
    paddingTop: scale(16),
    paddingBottom: scale(8)
  },
  instructionalText: {
    fontSize: scale(16),
    textAlign: 'center',
    color: THEME.COLORS.GRAY_1
  },
  handleRequirementsText: {
    fontSize: scale(16),
    textAlign: 'left',
    color: THEME.COLORS.GRAY_1
  },
  buttons: {
    marginTop: scale(24),
    flexDirection: 'row'
  },
  next: {
    marginLeft: scale(1),
    flex: 1
  },

  image: {
    alignSelf: 'center',
    marginTop: scale(24),
    height: scale(50),
    width: scale(55)
  },
  title: {
    paddingTop: scale(24)
  },
  paddings: {
    paddingVertical: scale(8)
  },
  inputContainer: {
    width: 'auto',
    marginTop: 0,
    marginBottom: 0
  },
  statusIconError: {
    color: THEME.COLORS.ACCENT_RED
  },
  statusIconOk: {
    color: THEME.COLORS.ACCENT_MINT
  },
  formFieldView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scale(14),
    marginBottom: scale(12)
  },
  formFieldViewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: PLATFORM.deviceWidth - scale(30) - scale(40)
  },
  statusIconContainer: {
    width: scale(25),
    height: scale(25)
  },
  statusIcon: {
    alignSelf: 'flex-end',
    marginTop: scale(29),
    width: scale(25),
    height: scale(25)
  },
  bottomSpace: {
    paddingBottom: scale(500)
  },
  selectWalletBlock: {
    marginTop: scale(48),
    paddingHorizontal: scale(18),
    paddingBottom: scale(10),
    backgroundColor: THEME.COLORS.GRAY_3
  },
  selectWalletBtn: {
    marginTop: scale(15),
    paddingVertical: scale(10),
    paddingHorizontal: scale(5),
    backgroundColor: THEME.COLORS.BLUE_3
  },
  domain: {
    marginTop: scale(24),
    marginLeft: scale(5),
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(5),
    borderColor: THEME.COLORS.BLUE_3,
    borderWidth: scale(2)
  },
  domainText: {
    color: THEME.COLORS.BLUE_3,
    fontSize: scale(16)
  },
  domainListRowName: {
    flex: 1,
    fontSize: THEME.rem(1),
    color: THEME.COLORS.SECONDARY
  },
  domainListRowContainerTop: {
    height: 'auto',
    paddingLeft: THEME.rem(0.75),
    paddingRight: THEME.rem(0.75),
    paddingVertical: THEME.rem(0.75)
  },
  link: {
    padding: THEME.rem(0.125),
    color: THEME.COLORS.ACCENT_BLUE,
    textAlign: 'center'
  }
}
export const styles: typeof rawStyles = StyleSheet.create(rawStyles)
