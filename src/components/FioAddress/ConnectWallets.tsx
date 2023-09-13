import { FlashList } from '@shopify/flash-list'
import { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, Switch, View } from 'react-native'

import { CryptoIcon } from '../../components/icons/CryptoIcon'
import { showError } from '../../components/services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../components/services/ThemeContext'
import { EdgeText } from '../../components/themed/EdgeText'
import { MainButton } from '../../components/themed/MainButton'
import { lstrings } from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { FioConnectionWalletItem } from '../../types/types'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { convertFIOToEdgeCodes, makeConnectWallets } from '../../util/FioAddressUtils'

interface LocalState {
  connectWalletsMap: { [walletId: string]: FioConnectionWalletItem }
  disconnectWalletsMap: { [walletId: string]: FioConnectionWalletItem }
  prevItemsConnected: { [key: string]: boolean }
}

interface StateProps {
  account: EdgeAccount
  walletItems: { [key: string]: FioConnectionWalletItem }
  loading: boolean
}

interface OwnProps {
  disabled: boolean
  fioAddressName: string
  fioWallet: EdgeCurrencyWallet | null
  navigation: NavigationBase
}

type Props = StateProps & OwnProps & ThemeProps

let flashListToggle = false // TODO: Hack to get FlashList to rerender when select wallet is tapped. Cache this with useMemo once we switch to hooks.

class ConnectWallets extends React.Component<Props, LocalState> {
  state = {
    connectWalletsMap: {},
    disconnectWalletsMap: {},
    prevItemsConnected: {}
  }

  // @ts-expect-error
  static getDerivedStateFromProps(props, state) {
    const { walletItems } = props
    const { prevItemsConnected } = state
    for (const walletKey of Object.keys(prevItemsConnected)) {
      if (prevItemsConnected[walletKey] !== walletItems[walletKey]?.isConnected) {
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

  _onContinuePress = (): void => {
    const { fioAddressName, fioWallet, navigation, walletItems } = this.props
    const { connectWalletsMap, disconnectWalletsMap } = this.state
    const walletsToDisconnect: FioConnectionWalletItem[] = []
    for (const walletKey of Object.keys(disconnectWalletsMap)) {
      if (
        !Object.keys(connectWalletsMap).find(
          // @ts-expect-error
          (cWalletKey: string) => connectWalletsMap[cWalletKey].fullCurrencyCode === disconnectWalletsMap[walletKey].fullCurrencyCode
        )
      ) {
        // @ts-expect-error
        walletsToDisconnect.push(disconnectWalletsMap[walletKey])
      }
    }

    if (fioWallet) {
      this.setState({
        prevItemsConnected: Object.keys(walletItems).reduce((acc, walletKey: string) => {
          // @ts-expect-error
          acc[walletKey] = walletItems[walletKey].isConnected
          return acc
        }, {})
      })
      // @ts-expect-error
      const walletsToConnect: FioConnectionWalletItem[] = Object.keys(connectWalletsMap).map(key => connectWalletsMap[key])
      navigation.navigate('fioConnectToWalletsConfirm', {
        fioAddressName,
        fioWallet,
        walletsToConnect,
        walletsToDisconnect
      })
    } else {
      showError(lstrings.fio_wallet_missing_for_fio_address)
    }
  }

  selectWallet(value: boolean, wallet: FioConnectionWalletItem): void {
    const { connectWalletsMap, disconnectWalletsMap } = this.state
    if (value) {
      // @ts-expect-error
      if (disconnectWalletsMap[wallet.key]) {
        // @ts-expect-error
        delete disconnectWalletsMap[wallet.key]
      } else {
        // @ts-expect-error
        connectWalletsMap[wallet.key] = wallet
      }
    } else {
      // @ts-expect-error
      if (connectWalletsMap[wallet.key]) {
        // @ts-expect-error
        delete connectWalletsMap[wallet.key]
      } else {
        // @ts-expect-error
        disconnectWalletsMap[wallet.key] = wallet
      }
    }

    this.setState({ connectWalletsMap, disconnectWalletsMap })
    flashListToggle = !flashListToggle
  }

  keyExtractor = (item: FioConnectionWalletItem): string => `${item.fullCurrencyCode}${item.edgeWallet.id}`

  renderFioConnectionWalletItem = ({ item: wallet }: { item: FioConnectionWalletItem }) => {
    const { account, walletItems, theme } = this.props
    const { connectWalletsMap, disconnectWalletsMap } = this.state
    const styles = getStyles(theme)

    if (wallet) {
      // @ts-expect-error
      const value = wallet.isConnected ? !disconnectWalletsMap[wallet.key] : !!connectWalletsMap[wallet.key]
      const disabled =
        !value &&
        // @ts-expect-error
        (!!Object.keys(connectWalletsMap).find((walletItemKey: string) => connectWalletsMap[walletItemKey].fullCurrencyCode === wallet.fullCurrencyCode) ||
          !!Object.keys(walletItems).find(
            (walletKey: string) =>
              walletItems[walletKey].fullCurrencyCode === wallet.fullCurrencyCode &&
              walletItems[walletKey].isConnected &&
              walletItems[walletKey].id !== wallet.id &&
              // @ts-expect-error
              !disconnectWalletsMap[walletKey]
          ))
      const noWalletSymbol = '-'

      // Convert back to Edge currency code to display the icon
      const pluginId = wallet.edgeWallet.currencyInfo.pluginId
      const { tokenCode: currencyCode } = convertFIOToEdgeCodes(pluginId, wallet.chainCode, wallet.currencyCode)

      const tokenId = getTokenId(account, pluginId, currencyCode)

      return (
        <View style={[styles.wallet, disabled ? styles.walletDisabled : null]}>
          <View style={styles.rowContainerTop}>
            <View style={styles.containerLeft}>
              {wallet != null ? <CryptoIcon pluginId={pluginId} tokenId={tokenId} /> : <EdgeText>{noWalletSymbol}</EdgeText>}
            </View>
            <View style={styles.walletDetailsContainer}>
              <View style={styles.walletDetailsCol}>
                <EdgeText style={styles.walletDetailsRowCurrency}>{currencyCode}</EdgeText>
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
    return <EdgeText style={styles.no_wallets_text}>{loading ? lstrings.loading : lstrings.fio_connect_no_wallets}</EdgeText>
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
              <FlashList
                data={Object.values(walletItems)}
                extraData={flashListToggle}
                estimatedItemSize={theme.rem(4.25)}
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
          <MainButton onPress={this._onContinuePress} label={lstrings.string_next_capitalized} disabled={continueDisabled || disabled} />
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
    flex: 1,
    backgroundColor: theme.backgroundGradientColors[1],
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

export const ConnectWalletsConnector = connect<StateProps, {}, OwnProps>(
  (state, ownProps) => {
    const edgeWallets = state.core.account.currencyWallets
    const ccWalletMap = state.ui.fio.connectedWalletsByFioAddress[ownProps.fioAddressName]

    if (!ccWalletMap) {
      return {
        account: state.core.account,
        walletItems: {},
        loading: true
      }
    }

    return {
      account: state.core.account,
      walletItems: makeConnectWallets(edgeWallets, ccWalletMap),
      loading: false
    }
  },
  dispatch => ({})
)(withTheme(ConnectWallets))
