import { EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { createFioWallet } from '../../../actions/FioAddressActions'
import { lstrings } from '../../../locales/strings'
import { connect } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { getWalletName } from '../../../util/CurrencyWalletHelpers'
import { AlertCardUi4 } from '../../cards/AlertCard'
import { EdgeCard } from '../../cards/EdgeCard'
import { EdgeAnim, fadeIn, fadeOut } from '../../common/EdgeAnim'
import { SceneWrapper } from '../../common/SceneWrapper'
import { TextInputModal } from '../../modals/TextInputModal'
import { WalletListModal, WalletListResult } from '../../modals/WalletListModal'
import { EdgeRow } from '../../rows/EdgeRow'
import { Airship, showError, showToast } from '../../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { SceneHeader } from '../../themed/SceneHeader'

interface LocalState {
  selectedWallet: EdgeCurrencyWallet | null
  fioDomain: string
  isValid: boolean
  loading: boolean
  walletLoading: boolean
  isAvailable: boolean | null
  errorMessage: string
}

interface OwnProps extends EdgeSceneProps<'fioDomainRegister'> {}

interface StateProps {
  fioWallets: EdgeCurrencyWallet[]
  fioPlugin: EdgeCurrencyConfig
  isConnected: boolean
}

interface DispatchProps {
  createFioWallet: () => Promise<EdgeCurrencyWallet>
}

type Props = StateProps & DispatchProps & OwnProps & ThemeProps

export class FioDomainRegister extends React.PureComponent<Props, LocalState> {
  fioCheckQueue: number = 0

  state: LocalState = {
    selectedWallet: null,
    fioDomain: '',
    errorMessage: '',
    isValid: true,
    isAvailable: null,
    loading: false,
    walletLoading: false
  }

  componentDidMount() {
    const { fioWallets } = this.props
    if (fioWallets.length > 0) {
      this.setState({
        selectedWallet: fioWallets[0]
      })
    } else {
      this.createFioWallet().catch(err => showError(err))
    }
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
    } catch (e: any) {
      this.setState({ walletLoading: false })
      showError(lstrings.create_wallet_failed_message)
    }
  }

  handleNextButton = (): void => {
    const { isConnected, navigation } = this.props
    const { fioDomain, selectedWallet, isValid, isAvailable, loading, walletLoading } = this.state
    if (isValid && isAvailable === true && !loading && !walletLoading) {
      if (isConnected) {
        if (!selectedWallet) return showError(lstrings.create_wallet_failed_message)
        navigation.navigate('fioDomainRegisterSelectWallet', {
          fioDomain,
          walletId: selectedWallet.id
        })
      }
    } else {
      showError(lstrings.fio_network_alert_text)
    }
  }

  onDomainPress = async () => {
    await this.setDomain()
  }

  onWalletPress = async () => {
    await this.selectFioWallet()
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
          errorMessage: lstrings.warning_alphanumeric
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
      } catch (e: any) {
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

  handleFioWalletChange = (walletId: string) => {
    this.setState({
      // @ts-expect-error
      selectedWallet: this.props.fioWallets.find(fioWallet => fioWallet.id === walletId)
    })
  }

  selectFioWallet = async () => {
    const result = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={this.props.navigation}
        headerTitle={lstrings.select_wallet}
        allowedAssets={[{ pluginId: 'fio', tokenId: null }]}
      />
    ))
    if (result?.type === 'wallet') {
      const { walletId } = result
      this.handleFioWalletChange(walletId)
    }
  }

  setDomain = async () => {
    const fioDomain = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={this.state.fioDomain}
        inputLabel={lstrings.fio_domain_label}
        title={lstrings.fio_domain_choose_label}
        autoCorrect={false}
      />
    ))
    if (fioDomain) this.handleFioDomainChange(fioDomain)
  }

  renderButton() {
    const { isValid, isAvailable, loading, walletLoading } = this.state

    if (isValid && isAvailable && !loading) {
      return (
        <EdgeAnim enter={fadeIn} exit={fadeOut}>
          <MainButton
            marginRem={[2, 0, 2]}
            label={walletLoading ? '' : lstrings.string_next_capitalized}
            disabled={!isAvailable || walletLoading}
            spinner={walletLoading}
            onPress={this.handleNextButton}
            type="primary"
          />
        </EdgeAnim>
      )
    }

    return null
  }

  renderFioWallets() {
    const { fioWallets } = this.props
    const { selectedWallet } = this.state
    if (fioWallets && fioWallets.length > 1) {
      return (
        <EdgeRow
          rightButtonType="touchable"
          title={lstrings.title_fio_connect_to_wallet}
          onPress={this.onWalletPress}
          body={selectedWallet == null ? lstrings.fio_address_register_no_wallet_name : getWalletName(selectedWallet)}
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
      chooseHandleErrorMessage = lstrings.fio_address_register_screen_cant_check
    }
    if (fioDomain && isAvailable === false) {
      chooseHandleErrorMessage = lstrings.fio_address_register_screen_not_available
    }

    if (fioDomain && !isValid && errorMessage) {
      chooseHandleErrorMessage = errorMessage
    }

    return (
      <SceneWrapper scroll>
        <SceneHeader style={styles.header} title={lstrings.title_register_fio_domain} underline withTopMargin>
          <IonIcon name="at" style={styles.iconIon} color={theme.icon} size={theme.rem(1.5)} />
        </SceneHeader>
        <View style={styles.container}>
          <EdgeText style={[styles.paddings, styles.instructionalText, styles.title]} numberOfLines={3}>
            {lstrings.fio_domain_reg_text}
          </EdgeText>
          <EdgeText style={[styles.paddings, styles.instructionalText]} numberOfLines={8}>
            {lstrings.fio_domain_reg_descr}
          </EdgeText>

          <EdgeCard>
            <EdgeRow rightButtonType="editable" title={lstrings.fio_domain_choose_label} onPress={this.onDomainPress}>
              <View style={styles.domainView}>
                <EdgeText style={styles.domainText}>{fioDomain}</EdgeText>
                <EdgeText style={styles.loadingText}>{loading ? `(${lstrings.loading})` : ''}</EdgeText>
              </View>
            </EdgeRow>
          </EdgeCard>

          <EdgeAnim visible={chooseHandleErrorMessage !== ''} enter={fadeIn} exit={fadeOut}>
            <AlertCardUi4 title={chooseHandleErrorMessage} type="error" />
          </EdgeAnim>

          {this.renderFioWallets()}
          {this.renderButton()}
        </View>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    marginHorizontal: theme.rem(0.5)
  },
  paddings: {
    paddingBottom: theme.rem(1),
    paddingHorizontal: theme.rem(0.5)
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
  domainView: {
    flexDirection: 'row'
  },
  domainText: {
    color: theme.primaryText,
    marginRight: theme.rem(0.5)
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
