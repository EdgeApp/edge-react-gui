// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Image, ScrollView, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions.js'
import fioAddressLogo from '../../assets/images/fio/fio_logo.png'
import { Fontello } from '../../assets/vector'
import { FIO_ADDRESS_DETAILS, FIO_ADDRESS_REGISTER, FIO_DOMAIN_REGISTER, FIO_DOMAIN_SETTINGS } from '../../constants/SceneKeys.js'
import s from '../../locales/strings.js'
import { FioNameRow } from '../../modules/FioAddress/components/FioName'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import { PLATFORM } from '../../theme/variables/platform'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp, Actions } from '../../types/routerTypes.js'
import type { FioAddress, FioDomain } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ClickableText } from '../themed/ClickableText'
import { EdgeText } from '../themed/EdgeText'
import { Fade } from '../themed/Fade'
import { SceneHeader } from '../themed/SceneHeader'

type LocalState = {
  initLoading: boolean,
  prevLoading: boolean
}

type StateProps = {
  fioAddresses: FioAddress[],
  fioDomains: FioDomain[],
  fioWallets: EdgeCurrencyWallet[],
  loading: boolean,
  isConnected: boolean
}

type DispatchProps = {
  refreshAllFioAddresses: () => void
}

type OwnProps = {
  navigation: NavigationProp<'fioAddressList'>
}

type Props = StateProps & DispatchProps & OwnProps & ThemeProps

class FioAddressList extends React.Component<Props, LocalState> {
  willFocusSubscription: (() => void) | null = null
  state: LocalState = {
    initLoading: true,
    prevLoading: false
  }

  static getDerivedStateFromProps(props: Props, state: LocalState): LocalState | null {
    const { loading } = props
    const { prevLoading, initLoading } = state
    if (!loading && prevLoading && initLoading) {
      return {
        prevLoading: loading,
        initLoading: false
      }
    }
    if (loading !== prevLoading) {
      return {
        initLoading,
        prevLoading: loading
      }
    }

    return null
  }

  fetchData() {
    const { refreshAllFioAddresses, isConnected } = this.props
    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
    }
    refreshAllFioAddresses()
  }

  componentDidMount(): void {
    this.willFocusSubscription = this.props.navigation.addListener('didFocus', () => {
      this.fetchData()
    })
  }

  componentWillUnmount(): void {
    if (this.willFocusSubscription != null) this.willFocusSubscription()
  }

  onAddressPress = (fioAddress: FioAddress) => {
    const { name, expiration } = fioAddress
    Actions.push(FIO_ADDRESS_DETAILS, {
      fioAddressName: name,
      expiration
    })
  }

  onDomainPress = (fioDomain: FioDomain) => {
    const { fioWallets } = this.props
    const { name, expiration, walletId, isPublic } = fioDomain
    const fioWallet = fioWallets.find((fioWallet: EdgeCurrencyWallet) => fioWallet.id === walletId)
    if (fioWallet == null) return
    Actions.push(FIO_DOMAIN_SETTINGS, {
      fioWallet,
      fioDomainName: name,
      expiration,
      isPublic
    })
  }

  render() {
    const { fioAddresses, fioDomains, loading, theme } = this.props
    const { initLoading } = this.state
    const styles = getStyles(theme)

    const noFioDomainsText = `${s.strings.no} ${s.strings.title_fio_domains}`
    const noFioAddressesText = `${s.strings.no} ${s.strings.title_fio_address}`
    return (
      <>
        <SceneWrapper background="theme">
          <ScrollView style={styles.row}>
            <SceneHeader title={s.strings.title_fio_address} underline />
            <View style={styles.list}>
              {!fioAddresses.length && <EdgeText style={styles.noNames}>{noFioAddressesText}</EdgeText>}
              {fioAddresses.map((address: FioAddress) => (
                <FioNameRow
                  key={`${address.name}`}
                  name={address.name}
                  expiration={address.expiration}
                  icon={<Image source={fioAddressLogo} style={styles.iconImg} />}
                  theme={theme}
                  onPress={() => this.onAddressPress(address)}
                />
              ))}
            </View>
            <SceneHeader title={s.strings.title_fio_domains} withTopMargin underline />
            <View style={styles.list}>
              {!fioDomains.length && <EdgeText style={styles.noNames}>{noFioDomainsText}</EdgeText>}
              {fioDomains.map((domain: FioDomain) => (
                <FioNameRow
                  key={`${domain.name}`}
                  name={domain.name}
                  expiration={domain.expiration}
                  icon={<IonIcon name="ios-at" style={styles.iconIon} color={theme.icon} size={theme.rem(1.5)} />}
                  theme={theme}
                  onPress={() => this.onDomainPress(domain)}
                />
              ))}
            </View>
            <Fade visible={loading && !initLoading}>
              <ActivityIndicator color={theme.iconTappable} style={styles.loading} size="large" />
            </Fade>
          </ScrollView>

          <View style={styles.footer}>
            <ClickableText
              alignSelf="center"
              label={s.strings.fio_address_list_screen_button_register}
              marginRem={0.5}
              onPress={() => Actions.push(FIO_ADDRESS_REGISTER)}
            >
              <Fontello name="register-new-fio-icon" color={theme.iconTappable} size={theme.rem(1)} />
            </ClickableText>
            <ClickableText
              alignSelf="center"
              label={s.strings.fio_address_list_domain_register}
              marginRem={0.5}
              onPress={() => Actions.push(FIO_DOMAIN_REGISTER)}
            >
              <Fontello name="register-custom-fio" color={theme.iconTappable} size={theme.rem(1)} />
            </ClickableText>
          </View>
        </SceneWrapper>

        <Fade visible={initLoading} noFadeIn>
          <Gradient style={styles.initLoadingContainer}>
            <ActivityIndicator color={theme.iconTappable} style={styles.loading} size="large" />
          </Gradient>
        </Fade>
      </>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  list: {
    display: 'flex',
    flexDirection: 'column'
  },
  loading: {
    flex: 1,
    marginTop: theme.rem(2.5),
    alignSelf: 'center'
  },
  initLoadingContainer: {
    flex: 1,
    top: 0,
    left: 0,
    position: 'absolute',
    backgroundColor: theme.backgroundGradientRight,
    width: '100%',
    height: PLATFORM.deviceHeight
  },
  row: {
    flex: 1
  },
  noNames: {
    color: theme.deactivatedText,
    fontSize: theme.rem(1),
    textAlign: 'center',
    padding: theme.rem(1)
  },
  iconImg: {
    height: theme.rem(2.25),
    marginRight: theme.rem(1.5)
  },
  iconIon: {
    width: theme.rem(1.5),
    marginRight: theme.rem(1),
    textAlign: 'center'
  },
  footer: {
    marginBottom: theme.rem(2),
    marginTop: theme.rem(1),
    padding: theme.rem(0.5)
  }
}))

export const FioAddressListScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    fioAddresses: state.ui.scenes.fioAddress.fioAddresses,
    fioDomains: state.ui.scenes.fioAddress.fioDomains,
    fioWallets: state.ui.wallets.fioWallets,
    loading: state.ui.scenes.fioAddress.fioAddressesLoading,
    isConnected: state.network.isConnected
  }),
  dispatch => ({
    refreshAllFioAddresses() {
      dispatch(refreshAllFioAddresses())
    }
  })
)(withTheme(FioAddressList))
