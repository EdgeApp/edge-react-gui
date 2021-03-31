// @flow

import { type EdgeCurrencyConfig, type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { EditNameModal } from '../../modules/FioAddress/components/EditNameModal'
import { getFioWallets } from '../../modules/UI/selectors'
import { type RootState } from '../../types/reduxTypes'
import { SceneWrapper } from '../common/SceneWrapper.js'
import type { WalletListResult } from '../modals/WalletListModal'
import { WalletListModal } from '../modals/WalletListModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import type { Theme, ThemeProps } from '../services/ThemeContext'
import { cacheStyles, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { PrimaryButton } from '../themed/ThemedButtons'
import { Tile } from '../themed/Tile'

type LocalState = {
  selectedWallet: EdgeCurrencyWallet | null,
  fioDomain: string,
  isValid: boolean,
  loading: boolean,
  walletLoading: boolean,
  isAvailable: boolean | null,
  fieldPos: number
}

type StateProps = {
  fioWallets: EdgeCurrencyWallet[],
  fioPlugin: EdgeCurrencyConfig,
  isConnected: boolean
}

type DispatchProps = {
  createFioWallet: () => Promise<EdgeCurrencyWallet>
}

type Props = StateProps & DispatchProps & ThemeProps

class FioDomainRegister extends React.PureComponent<Props, LocalState> {
  fioCheckQueue: number = 0

  state = {
    selectedWallet: null,
    fioDomain: '',
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
    const { isConnected } = this.props
    const { fioDomain, selectedWallet, isValid, isAvailable, loading, walletLoading } = this.state
    if (isValid && isAvailable && !loading && !walletLoading) {
      if (isConnected) {
        if (!selectedWallet) return showError(s.strings.create_wallet_failed_message)
        Actions[Constants.FIO_DOMAIN_REGISTER_SELECT_WALLET]({
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
      try {
        const { fioPlugin } = this.props
        const isAvailable = fioPlugin.otherMethods ? await fioPlugin.otherMethods.validateAccount(fioDomain, true) : false
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
      <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={[Constants.FIO_STR]} />
    ))
    if (walletId && currencyCode) {
      if (currencyCode === Constants.FIO_STR) {
        this.handleFioWalletChange(walletId)
      } else {
        showError(`${s.strings.create_wallet_select_valid_crypto}: ${Constants.FIO_STR}`)
      }
    }
  }

  setDomain = async () => {
    this.handleFioDomainFocus()

    const fioDomain = await Airship.show(bridge => <EditNameModal bridge={bridge} title={s.strings.fio_domain_choose_label} value={this.state.fioDomain} />)
    if (fioDomain) this.handleFioDomainChange(fioDomain)
  }

  renderButton() {
    const { isValid, isAvailable, loading, walletLoading } = this.state

    if (isValid && isAvailable && !loading) {
      return (
        <PrimaryButton
          marginRem={1}
          onPress={this.handleNextButton}
          label={walletLoading ? '' : s.strings.string_next_capitalized}
          disabled={!isAvailable || walletLoading}
        >
          {walletLoading ? <ActivityIndicator color={this.props.theme.iconTappable} /> : null}
        </PrimaryButton>
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
    const { fioDomain, isAvailable, loading } = this.state
    const styles = getStyles(theme)
    let chooseHandleErrorMessage = ''
    if (fioDomain && !this.props.isConnected) {
      chooseHandleErrorMessage = s.strings.fio_address_register_screen_cant_check
    }
    if (fioDomain && isAvailable === false) {
      chooseHandleErrorMessage = s.strings.fio_address_register_screen_not_available
    }

    return (
      <SceneWrapper background="theme" bodySplit={theme.rem(1.5)}>
        <ScrollView ref="_scrollView">
          <IonIcon name="ios-at" style={styles.iconIon} color={theme.icon} size={theme.rem(4)} />
          <EdgeText style={[styles.paddings, styles.instructionalText, styles.title]} numberOfLines={3}>
            {s.strings.fio_domain_reg_text}
          </EdgeText>
          <EdgeText style={[styles.paddings, styles.instructionalText]} numberOfLines={8}>
            {s.strings.fio_domain_reg_descr}
          </EdgeText>

          <View ref="_fieldView" onLayout={this.fieldViewOnLayout}>
            <Tile type="editable" title={s.strings.fio_domain_choose_label} onPress={this.onDomainPress}>
              <View style={styles.domainView}>
                <EdgeText style={styles.domainText}>{fioDomain}</EdgeText>
                <EdgeText style={styles.errorMessage}>{chooseHandleErrorMessage ? `(${chooseHandleErrorMessage})` : ''}</EdgeText>
                <EdgeText style={styles.loadingText}>{loading ? `(${s.strings.loading})` : ''}</EdgeText>
              </View>
            </Tile>
          </View>

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
    textAlign: 'center',
    color: theme.secondaryText
  },

  title: {
    paddingTop: theme.rem(1.5)
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
  errorMessage: {
    color: theme.dangerText
  },
  loadingText: {
    color: theme.deactivatedText
  },
  iconIon: {
    alignSelf: 'center',
    marginTop: theme.rem(1.5),
    height: theme.rem(4),
    width: theme.rem(4),
    textAlign: 'center'
  }
}))

const FioDomainRegisterScene = connect((state: RootState) => {
  const { account } = state.core
  if (!account || !account.currencyConfig) {
    return {
      fioWallets: [],
      fioPlugin: {},
      isConnected: state.network.isConnected
    }
  }
  const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)
  const fioPlugin = account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO]

  return {
    fioWallets,
    fioPlugin,
    isConnected: state.network.isConnected
  }
}, {})(withTheme(FioDomainRegister))
export { FioDomainRegisterScene }
