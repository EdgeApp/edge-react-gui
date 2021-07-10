// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { FlatList, Image, ScrollView, Switch, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { showError } from '../../../components/services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../../components/services/ThemeContext'
import { EdgeText } from '../../../components/themed/EdgeText'
import { PrimaryButton } from '../../../components/themed/ThemedButtons.js'
import { FIO_CONNECT_TO_WALLETS_CONFIRM } from '../../../constants/SceneKeys.js'
import s from '../../../locales/strings.js'
import { type Dispatch, type RootState } from '../../../types/reduxTypes'
import type { FioConnectionWalletItem } from '../../../types/types'
import { makeConnectWallets } from '../util'

type LocalState = {
  connectWalletsMap: { [walletId: string]: FioConnectionWalletItem },
  disconnectWalletsMap: { [walletId: string]: FioConnectionWalletItem },
  prevItemsConnected: { [string]: boolean }
}

type StateProps = {
  walletItems: { [key: string]: FioConnectionWalletItem },
  loading: boolean
}

type OwnProps = {
  fioAddressName: string,
  fioWallet: EdgeCurrencyWallet | null,
  disabled: boolean
}

type Props = StateProps & OwnProps & ThemeProps

class ConnectWallets extends React.Component<Props, LocalState> {
  state = {
    connectWalletsMap: {},
    disconnectWalletsMap: {},
    prevItemsConnected: {}
  }

  static getDerivedStateFromProps(props, state) {
    const { walletItems } = props
    const { prevItemsConnected } = state
    for (const walletKey of Object.keys(prevItemsConnected)) {
      if (prevItemsConnected[walletKey] !== walletItems[walletKey].isConnected) {
        return {
          connectWalletsMap: {},
          disconnectWalletsMap: {},
          prevItemsConnected: {}
        }
      }
    }
    return null
  }

  componentDidMount(): void {
    this.setState({
      connectWalletsMap: {},
      disconnectWalletsMap: {}
    })
  }

  _onContinuePress = async (): Promise<void> => {
    const { fioAddressName, fioWallet, walletItems } = this.props
    const { connectWalletsMap, disconnectWalletsMap } = this.state
    const walletsToDisconnect = []
    for (const walletKey of Object.keys(disconnectWalletsMap)) {
      if (
        !Object.keys(connectWalletsMap).find(
          (cWalletKey: string) => connectWalletsMap[cWalletKey].fullCurrencyCode === disconnectWalletsMap[walletKey].fullCurrencyCode
        )
      ) {
        walletsToDisconnect.push(disconnectWalletsMap[walletKey])
      }
    }

    if (fioWallet) {
      this.setState({
        prevItemsConnected: Object.keys(walletItems).reduce((acc, walletKey: string) => {
          acc[walletKey] = walletItems[walletKey].isConnected
          return acc
        }, {})
      })
      Actions[FIO_CONNECT_TO_WALLETS_CONFIRM]({
        fioAddressName,
        fioWallet,
        walletsToConnect: Object.values(connectWalletsMap),
        walletsToDisconnect
      })
    } else {
      showError(s.strings.fio_wallet_missing_for_fio_address)
    }
  }

  selectWallet(value: boolean, wallet: FioConnectionWalletItem): void {
    const { connectWalletsMap, disconnectWalletsMap } = this.state
    if (value) {
      if (disconnectWalletsMap[wallet.key]) {
        delete disconnectWalletsMap[wallet.key]
      } else {
        connectWalletsMap[wallet.key] = wallet
      }
    } else {
      if (connectWalletsMap[wallet.key]) {
        delete connectWalletsMap[wallet.key]
      } else {
        disconnectWalletsMap[wallet.key] = wallet
      }
    }

    this.setState({ connectWalletsMap, disconnectWalletsMap })
  }

  keyExtractor = (item: {}, index: number): string => index.toString()

  renderFioConnectionWalletItem = ({ item: wallet }: { item: FioConnectionWalletItem }) => {
    const { walletItems, theme } = this.props
    const { connectWalletsMap, disconnectWalletsMap } = this.state
    const styles = getStyles(theme)

    if (wallet) {
      const value = wallet.isConnected ? !disconnectWalletsMap[wallet.key] : !!connectWalletsMap[wallet.key]
      const disabled =
        !value &&
        (!!Object.keys(connectWalletsMap).find((walletItemKey: string) => connectWalletsMap[walletItemKey].fullCurrencyCode === wallet.fullCurrencyCode) ||
          !!Object.keys(walletItems).find(
            (walletKey: string) =>
              walletItems[walletKey].fullCurrencyCode === wallet.fullCurrencyCode &&
              walletItems[walletKey].isConnected &&
              walletItems[walletKey].id !== wallet.id &&
              !disconnectWalletsMap[walletKey]
          ))
      const noWalletSymbol = '-'

      return (
        <View style={[styles.wallet, disabled ? styles.walletDisabled : null]} underlayColor={theme.secondaryButton}>
          <View style={styles.rowContainerTop}>
            <View style={styles.containerLeft}>
              {wallet.symbolImage ? (
                <Image style={styles.imageContainer} source={{ uri: wallet.symbolImage }} resizeMode="contain" />
              ) : (
                <EdgeText>{noWalletSymbol}</EdgeText>
              )}
            </View>
            <View style={styles.walletDetailsContainer}>
              <View style={styles.walletDetailsCol}>
                <EdgeText style={styles.walletDetailsRowCurrency}>{wallet.currencyCode}</EdgeText>
                <EdgeText style={styles.walletDetailsRowName}>{wallet.name}</EdgeText>
              </View>
              <View style={styles.walletDetailsCol}>
                <View style={styles.switchContainer}>
                  <Switch disabled={disabled} onChange={() => this.selectWallet(!value, wallet)} value={value} />
                </View>
              </View>
            </View>
          </View>
        </View>
      )
    }
    return null
  }

  renderNoWallets() {
    const { loading, theme } = this.props
    const styles = getStyles(theme)
    return <EdgeText style={styles.no_wallets_text}>{loading ? s.strings.loading : s.strings.fio_connect_no_wallets}</EdgeText>
  }

  render() {
    const { walletItems, disabled, theme } = this.props
    const { connectWalletsMap, disconnectWalletsMap } = this.state
    const styles = getStyles(theme)
    const continueDisabled = !Object.keys(connectWalletsMap).length && !Object.keys(disconnectWalletsMap).length

    return (
      <View style={styles.view}>
        <View style={styles.list}>
          <ScrollView>
            {walletItems && Object.keys(walletItems).length ? (
              <FlatList
                data={Object.values(walletItems)}
                initialNumToRender={24}
                keyboardShouldPersistTaps="handled"
                keyExtractor={this.keyExtractor}
                renderItem={this.renderFioConnectionWalletItem}
              />
            ) : (
              this.renderNoWallets()
            )}
          </ScrollView>
        </View>
        <View style={styles.bottomSection}>
          <PrimaryButton onPress={this._onContinuePress} label={s.strings.string_next_capitalized} disabled={continueDisabled || disabled} />
        </View>
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  view: {
    flex: 1
  },
  list: {
    flex: 5
  },
  no_wallets_text: {
    padding: theme.rem(1.75),
    fontSize: theme.rem(1.5),
    color: theme.deactivatedText,
    textAlign: 'center'
  },
  wallet: {
    backgroundColor: theme.tileBackground,
    marginBottom: theme.rem(0.05)
  },
  walletDisabled: {
    opacity: 0.7
  },
  walletDetailsContainer: {
    flex: 1,
    flexDirection: 'row'
  },
  walletDetailsCol: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center'
  },
  switchContainer: {
    alignItems: 'flex-end',
    paddingRight: theme.rem(0.25)
  },
  walletDetailsRowCurrency: {
    fontSize: theme.rem(1.25),
    color: theme.primaryText
  },
  walletDetailsRowName: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  bottomSection: {
    flex: 2,
    backgroundColor: theme.backgroundGradientRight,
    padding: theme.rem(1)
  },
  btnDisabled: {
    opacity: 0.5
  },

  rowContainerTop: {
    width: '100%',
    height: theme.rem(4.75),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: theme.rem(0.5),
    paddingRight: theme.rem(0.5)
  },
  containerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.rem(0.25),
    width: theme.rem(2.25)
  },
  imageContainer: {
    height: theme.rem(1.5),
    width: theme.rem(1.5)
  }
}))

export const ConnectWalletsConnector = connect(
  (state: RootState, ownProps: OwnProps): StateProps => {
    const wallets = state.ui.wallets.byId
    const ccWalletMap = state.ui.fio.connectedWalletsByFioAddress[ownProps.fioAddressName]

    if (!ccWalletMap) return { walletItems: {}, loading: true }

    const walletItems = makeConnectWallets(wallets, ccWalletMap)

    return {
      walletItems,
      loading: false
    }
  },
  (dispatch: Dispatch) => ({})
)(withTheme(ConnectWallets))
