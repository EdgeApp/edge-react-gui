// @flow

import type { EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import IonIcon from 'react-native-vector-icons/Ionicons'

import fioAddressDetailsIcon from '../../assets/images/details_fioAddress.png'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { FioAddressRow, FioDomainRow } from '../../modules/FioAddress/components/FioName'
import { Button } from '../../modules/UI/components/ControlPanel/Component/Button/Button.ui'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import type { FioAddress, FioDomain } from '../../types/types'
import { scale } from '../../util/scaling.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { SettingsHeaderRow } from '../common/SettingsHeaderRow.js'
import { showError } from '../services/AirshipInstance'

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

export type NavigationProps = {
  navigation: any
}

type Props = StateProps & DispatchProps & NavigationProps

export class FioAddressListScene extends React.Component<Props> {
  headerIconSize = THEME.rem(1.375)
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
      if (fioAddresses.length === 0) {
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
    const { name, expiration, walletId } = fioDomain
    const fioWallet = fioWallets.find((fioWallet: EdgeCurrencyWallet) => fioWallet.id === walletId)
    Actions[Constants.FIO_DOMAIN_SETTINGS]({ fioWallet, fioDomainName: name, expiration })
  }

  render() {
    const { fioAddresses, fioDomains, loading } = this.props

    if (!fioAddresses.length) {
      return (
        <SceneWrapper>
          <Gradient style={styles.gradient} />
          <ActivityIndicator style={styles.loading} size="large" />
        </SceneWrapper>
      )
    }

    return (
      <SafeAreaView>
        <Gradient style={styles.gradient} />
        <ScrollView style={styles.row}>
          <SettingsHeaderRow icon={<Image source={fioAddressDetailsIcon} style={styles.headerIcon} />} text={s.strings.title_fio_address} />
          <View style={styles.list}>
            {fioAddresses.map((address: FioAddress) => (
              <FioAddressRow key={`${address.name}`} item={address} onPress={this.onAddressPress} />
            ))}
          </View>
          <SettingsHeaderRow icon={<IonIcon name="ios-at" color={THEME.COLORS.WHITE} size={this.headerIconSize} />} text={s.strings.title_fio_domains} />
          <View style={styles.list}>
            {!fioDomains.length && (
              <T style={styles.noNames}>
                {s.strings.no} {s.strings.title_fio_domains}
              </T>
            )}
            {fioDomains.map((domain: FioDomain) => (
              <FioDomainRow key={`${domain.name}`} item={domain} onPress={this.onDomainPress} />
            ))}
          </View>
          {loading && <ActivityIndicator style={styles.loading} size="large" />}
        </ScrollView>

        <View>
          <View style={styles.button}>
            <Button onPress={Actions[Constants.FIO_ADDRESS_REGISTER]} style={styles.toggleButton} underlayColor={`${THEME.COLORS.PRIMARY}${THEME.ALPHA.LOW}`}>
              <Button.Center>
                <Button.Text>
                  <T>{s.strings.fio_address_list_screen_button_register}</T>
                </Button.Text>
              </Button.Center>
            </Button>
          </View>
          <View style={styles.button}>
            <Button onPress={Actions[Constants.FIO_DOMAIN_REGISTER]} style={styles.toggleButton} underlayColor={`${THEME.COLORS.PRIMARY}${THEME.ALPHA.LOW}`}>
              <Button.Center>
                <Button.Text>
                  <T>{s.strings.fio_address_list_domain_register}</T>
                </Button.Text>
              </Button.Center>
            </Button>
          </View>
        </View>
      </SafeAreaView>
    )
  }
}

const rawStyles = {
  gradient: {
    height: THEME.HEADER
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: THEME.COLORS.WHITE
  },
  item: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(15),
    borderBottomColor: THEME.COLORS.FIO_ADDRESS_LIST_BORDER_BOTTOM,
    borderBottomWidth: 1
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
    marginLeft: scale(5)
  },
  button: {
    paddingVertical: THEME.rem(0.33),
    paddingHorizontal: THEME.rem(0.66)
  },
  toggleButton: {
    backgroundColor: THEME.COLORS.PRIMARY,
    height: scale(58),
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  domainVew: {
    paddingHorizontal: scale(15),
    paddingTop: scale(10),
    paddingBottom: scale(0)
  },
  link: {
    padding: scale(10),
    color: THEME.COLORS.ACCENT_BLUE,
    textAlign: 'center'
  },
  loading: {
    flex: 1,
    marginTop: scale(40),
    alignSelf: 'center'
  },
  row: {
    flex: 1
  },
  noNames: {
    color: THEME.COLORS.GRAY_2,
    fontSize: scale(16),
    textAlign: 'center',
    padding: scale(15)
  },
  headerIcon: {
    width: scale(24),
    height: scale(22)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
