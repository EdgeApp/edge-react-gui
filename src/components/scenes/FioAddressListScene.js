// @flow

import type { EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Image, ScrollView, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import fioAddressLogo from '../../assets/images/fio/fio_logo.png'
import { Fontello } from '../../assets/vector'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { refreshAllFioAddresses } from '../../modules/FioAddress/action'
import { FioNameRow } from '../../modules/FioAddress/components/FioName'
import { getFioWallets } from '../../modules/UI/selectors'
import type { RootState } from '../../reducers/RootReducer'
import type { Dispatch } from '../../types/reduxTypes'
import type { FioAddress, FioDomain } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { ClickableText } from '../themed/ThemedButtons'
import { UnderlinedHeader } from '../themed/UnderlinedHeader'

export type StateProps = {
  fioAddresses: FioAddress[],
  fioDomains: FioDomain[],
  fioWallets: EdgeCurrencyWallet[],
  fioPlugin: EdgeCurrencyConfig | null,
  loading: boolean,
  isConnected: boolean
}

export type DispatchProps = {
  refreshAllFioAddresses: () => Promise<void>
}

type NavigationProps = {
  navigation: any
}

type Props = StateProps & DispatchProps & NavigationProps & ThemeProps

class FioAddressList extends React.Component<Props> {
  willFocusSubscription: { remove: () => void } | null = null

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

  componentDidUpdate(prevProps: Props): void {
    const { fioAddresses, loading } = this.props

    if (!loading && prevProps.loading) {
      if (fioAddresses.length === 0 && Actions.currentScene === Constants.FIO_ADDRESS_LIST) {
        Actions[Constants.FIO_ADDRESS_REGISTER]({ noAddresses: true })
      }
    }
  }

  componentWillUnmount(): void {
    this.willFocusSubscription && this.willFocusSubscription.remove()
  }

  onAddressPress = (fioAddress: FioAddress) => {
    const { name, expiration } = fioAddress
    Actions[Constants.FIO_ADDRESS_DETAILS]({ fioAddressName: name, expiration })
  }

  onDomainPress = (fioDomain: FioDomain) => {
    const { fioWallets } = this.props
    const { name, expiration, walletId, isPublic } = fioDomain
    const fioWallet = fioWallets.find((fioWallet: EdgeCurrencyWallet) => fioWallet.id === walletId)
    Actions[Constants.FIO_DOMAIN_SETTINGS]({ fioWallet, fioDomainName: name, expiration, isPublic })
  }

  render() {
    const { fioAddresses, fioDomains, loading, theme } = this.props
    const styles = getStyles(theme)

    if (!fioAddresses.length) {
      return (
        <SceneWrapper background="theme">
          <ActivityIndicator color={theme.iconTappable} style={styles.loading} size="large" />
        </SceneWrapper>
      )
    }

    const noFioDomainsText = `${s.strings.no} ${s.strings.title_fio_domains}`
    return (
      <SceneWrapper background="theme">
        <ScrollView style={styles.row}>
          <UnderlinedHeader title={s.strings.title_fio_address} />
          <View style={styles.list}>
            {fioAddresses.map((address: FioAddress, index: number) => (
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
          <UnderlinedHeader title={s.strings.title_fio_domains} withTopMargin />
          <View style={styles.list}>
            {!fioDomains.length && <EdgeText style={styles.noNames}>{noFioDomainsText}</EdgeText>}
            {fioDomains.map((domain: FioDomain, index: number) => (
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
          {loading && <ActivityIndicator color={theme.iconTappable} style={styles.loading} size="large" />}
        </ScrollView>

        <View>
          <ClickableText marginRem={[1, 1, 0]} onPress={Actions[Constants.FIO_ADDRESS_REGISTER]}>
            <View style={styles.actionButton}>
              <Fontello name="register-new-fio-icon" style={styles.actionIcon} color={theme.iconTappable} size={theme.rem(1)} />
              <EdgeText style={styles.buttonText}>{s.strings.fio_address_list_screen_button_register}</EdgeText>
            </View>
          </ClickableText>
          <ClickableText marginRem={[0, 1, 2, 1]} onPress={Actions[Constants.FIO_DOMAIN_REGISTER]}>
            <View style={styles.actionButton}>
              <Fontello name="register-custom-fio" style={styles.actionIcon} color={theme.iconTappable} size={theme.rem(1)} />
              <EdgeText style={styles.buttonText}>{s.strings.fio_address_list_domain_register}</EdgeText>
            </View>
          </ClickableText>
        </View>
      </SceneWrapper>
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
  row: {
    flex: 1
  },
  noNames: {
    color: theme.deactivatedText,
    fontSize: theme.rem(1),
    textAlign: 'center',
    padding: theme.rem(1)
  },
  buttonText: {
    marginLeft: theme.rem(0.5),
    color: theme.textLink,
    textAlign: 'center'
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
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionIcon: {
    marginTop: theme.rem(0.25)
  }
}))

const FioAddressListScene = connect(
  (state: RootState) => {
    const { account } = state.core
    const fioAddresses: FioAddress[] = state.ui.scenes.fioAddress.fioAddresses
    const fioDomains: FioDomain[] = state.ui.scenes.fioAddress.fioDomains
    const fioWallets: EdgeCurrencyWallet[] = getFioWallets(state)
    const loading: boolean = state.ui.scenes.fioAddress.fioAddressesLoading
    const fioPlugin = account.currencyConfig ? account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO] : null

    return {
      fioAddresses,
      fioDomains,
      fioWallets,
      fioPlugin,
      loading,
      isConnected: state.network.isConnected
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    refreshAllFioAddresses: () => dispatch(refreshAllFioAddresses())
  })
)(withTheme(FioAddressList))
export { FioAddressListScene }
