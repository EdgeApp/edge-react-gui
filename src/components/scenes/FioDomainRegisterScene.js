// @flow

import { type EdgeCurrencyConfig, type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { createFioWallet } from '../../actions/FioAddressActions.js'
import { FIO_STR } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { TextInputModal } from '../modals/TextInputModal.js'
import type { WalletListResult } from '../modals/WalletListModal'
import { WalletListModal } from '../modals/WalletListModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import type { Theme, ThemeProps } from '../services/ThemeContext'
import { cacheStyles, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { FormError } from '../themed/FormError'
import { MainButton } from '../themed/MainButton.js'
import { SceneHeader } from '../themed/SceneHeader'
import { Tile } from '../themed/Tile'

type LocalState = {
  selectedWallet: EdgeCurrencyWallet | null,
  fioDomain: string,
  isValid: boolean,
  loading: boolean,
  walletLoading: boolean,
  isAvailable: boolean | null,
  fieldPos: number,
  errorMessage: string
}

type OwnProps = {
  navigation: NavigationProp<'fioDomainRegister'>
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

class FioDomainRegister extends React.PureComponent<Props, LocalState> {
  fioCheckQueue: number = 0

  state = {
    selectedWallet: null,
    fioDomain: '',
    errorMessage: '',
    isValid: true,
    isAvailable: false,
    loading: false,
    walletLoading: false,
    fieldPos: 200
  }

  componentDidMount() {
    const { fioWallets } = this.props
    if (fioWallets.length > 0) {
      this.setState({
        selectedWallet: fioWallets[0]
      })
    } else {
      this.createFioWallet()
    }
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

  handleNextButton = (): void => {
    const { isConnected, navigation } = this.props
    const { fioDomain, selectedWallet, isValid, isAvailable, loading, walletLoading } = this.state
    if (isValid && isAvailable && !loading && !walletLoading) {
      if (isConnected) {
        if (!selectedWallet) return showError(s.strings.create_wallet_failed_message)
        navigation.navigate('fioDomainRegisterSelectWallet', {
          fioDomain,
          selectedWallet
        })
      }
    } else {
      showError(s.strings.fio_network_alert_text)
    }
  }

  onDomainPress = () => {
    this.setDomain()
  }

  onWalletPress = () => {
    this.selectFioWallet()
  }

  checkFioDomain(fioDomain: string) {
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

      if (/[^\p{L}\p{N}]+/gu.test(fioDomain)) {
        this.setState({
          loading: false,
          isValid: false,
          errorMessage: s.strings.warning_alphanumeric
        })
        return
      }

      try {
        const { fioPlugin } = this.props
        const isAvailable = fioPlugin.otherMethods ? await fioPlugin.otherMethods.validateAccount(fioDomain, true) : false
        this.setState({
          isAvailable,
          isValid: true,
          loading: false,
          errorMessage: ''
        })
      } catch (e) {
        this.setState({
          loading: false
        })
      }
    }, 1000)
  }

  handleFioDomainChange = (fioDomainChanged: string) => {
    if (!this.props.isConnected) {
      return this.setState({
        fioDomain: fioDomainChanged,
        isAvailable: null,
        loading: false
      })
    }
    this.checkFioDomain(fioDomainChanged)

    this.setState({
      fioDomain: fioDomainChanged.toLowerCase(),
      isAvailable: null
    })
  }

  handleFioDomainFocus = () => {
    // eslint-disable-next-line react/no-string-refs
    this.refs._scrollView.scrollTo({ x: 0, y: this.state.fieldPos, animated: true })
  }

  fieldViewOnLayout = ({ nativeEvent: { layout: { y } } = { layout: { y: this.state.fieldPos } } }) => {
    this.setState({ fieldPos: y })
  }

  handleFioWalletChange = (walletId: string) => {
    this.setState({
      selectedWallet: this.props.fioWallets.find(fioWallet => fioWallet.id === walletId)
    })
  }

  selectFioWallet = async () => {
    const { walletId, currencyCode }: WalletListResult = await Airship.show(bridge => (
      <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={[FIO_STR]} />
    ))
    if (walletId && currencyCode) {
      if (currencyCode === FIO_STR) {
        this.handleFioWalletChange(walletId)
      } else {
        showError(`${s.strings.create_wallet_select_valid_crypto}: ${FIO_STR}`)
      }
    }
  }

  setDomain = async () => {
    this.handleFioDomainFocus()

    const fioDomain = await Airship.show(bridge => (
      <TextInputModal bridge={bridge} initialValue={this.state.fioDomain} inputLabel={s.strings.fio_domain_label} title={s.strings.fio_domain_choose_label} />
    ))
    if (fioDomain) this.handleFioDomainChange(fioDomain)
  }

  renderButton() {
    const { isValid, isAvailable, loading, walletLoading } = this.state

    if (isValid && isAvailable && !loading) {
      return (
        <MainButton
          marginRem={1}
          label={walletLoading ? '' : s.strings.string_next_capitalized}
          disabled={!isAvailable || walletLoading}
          spinner={walletLoading}
          onPress={this.handleNextButton}
          type="secondary"
        />
      )
    }

    return null
  }

  renderFioWallets() {
    const { fioWallets } = this.props
    const { selectedWallet } = this.state
    if (fioWallets && fioWallets.length > 1) {
      return (
        <Tile
          type="touchable"
          title={s.strings.title_fio_connect_to_wallet}
          onPress={this.onWalletPress}
          body={selectedWallet && selectedWallet.name ? selectedWallet.name : s.strings.fio_address_register_no_wallet_name}
        />
      )
    }
  }

  render() {
    const { theme } = this.props
    const { fioDomain, isAvailable, loading, errorMessage, isValid } = this.state
    const styles = getStyles(theme)
    let chooseHandleErrorMessage = ''
    if (fioDomain && !this.props.isConnected) {
      chooseHandleErrorMessage = s.strings.fio_address_register_screen_cant_check
    }
    if (fioDomain && isAvailable === false) {
      chooseHandleErrorMessage = s.strings.fio_address_register_screen_not_available
    }

    if (fioDomain && !isValid && errorMessage) {
      chooseHandleErrorMessage = errorMessage
    }

    return (
      <SceneWrapper background="theme" bodySplit={theme.rem(1.5)}>
        <SceneHeader style={styles.header} title={s.strings.title_register_fio_domain}>
          <IonIcon name="ios-at" style={styles.iconIon} color={theme.icon} size={theme.rem(1.5)} />
        </SceneHeader>
        {/* eslint-disable-next-line react/no-string-refs */}
        <ScrollView ref="_scrollView">
          <EdgeText style={[styles.paddings, styles.instructionalText, styles.title]} numberOfLines={3}>
            {s.strings.fio_domain_reg_text}
          </EdgeText>
          <EdgeText style={[styles.paddings, styles.instructionalText]} numberOfLines={8}>
            {s.strings.fio_domain_reg_descr}
          </EdgeText>

          <View onLayout={this.fieldViewOnLayout}>
            <Tile type="editable" title={s.strings.fio_domain_choose_label} onPress={this.onDomainPress}>
              <View style={styles.domainView}>
                <EdgeText style={styles.domainText}>{fioDomain}</EdgeText>
                <EdgeText style={styles.loadingText}>{loading ? `(${s.strings.loading})` : ''}</EdgeText>
              </View>
            </Tile>
          </View>

          <FormError style={styles.error} isVisible={!!chooseHandleErrorMessage}>
            {chooseHandleErrorMessage}
          </FormError>
          {this.renderFioWallets()}
          {this.renderButton()}
          <View style={styles.bottomSpace} />
        </ScrollView>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  paddings: {
    paddingBottom: theme.rem(1),
    paddingHorizontal: theme.rem(1.25)
  },
  instructionalText: {
    fontSize: theme.rem(1),
    color: theme.secondaryText
  },
  title: {
    paddingTop: theme.rem(1.5)
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    marginRight: theme.rem(1),
    marginTop: theme.rem(0.5)
  },
  bottomSpace: {
    paddingBottom: theme.rem(30)
  },
  domainView: {
    flexDirection: 'row'
  },
  domainText: {
    color: theme.primaryText,
    marginRight: theme.rem(0.5)
  },
  error: {
    flex: 1,
    margin: theme.rem(1)
  },
  loadingText: {
    color: theme.deactivatedText
  },
  iconIon: {
    marginRight: theme.rem(0.5)
  }
}))

const typeHack: any = {}

export const FioDomainRegisterScene = connect<StateProps, DispatchProps, OwnProps>(
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
)(withTheme(FioDomainRegister))
