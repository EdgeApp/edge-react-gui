// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Switch, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { showError } from '../../../components/services/AirshipInstance'
import * as Constants from '../../../constants/indexConstants'
import s from '../../../locales/strings.js'
import { THEME } from '../../../theme/variables/airbitz.js'
import type { State } from '../../../types/reduxTypes'
import type { FioConnectionWalletItem } from '../../../types/types'
import { scale } from '../../../util/scaling.js'
import T from '../../UI/components/FormattedText/FormattedText.ui.js'
import { getWallets } from '../../UI/selectors'
import { makeConnectWallets } from '../util'

export type LocalState = {
  connectWalletsMap: { [walletId: string]: FioConnectionWalletItem },
  disconnectWalletsMap: { [walletId: string]: FioConnectionWalletItem },
  prevItemsConnected: { [string]: boolean }
}

export type FioConnectWalletStateProps = {
  walletItems: { [key: string]: FioConnectionWalletItem },
  loading: boolean
}

export type OwnProps = {
  fioAddressName: string,
  fioWallet: EdgeCurrencyWallet | null,
  disabled: boolean
}

class ConnectWallets extends Component<FioConnectWalletStateProps & OwnProps, LocalState> {
  state = {
    connectWalletsMap: {},
    disconnectWalletsMap: {},
    prevItemsConnected: {}
  }

  static getDerivedStateFromProps(props, state) {
    const { walletItems } = props
    const { prevItemsConnected } = state
    for (const walletKey in prevItemsConnected) {
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
    for (const walletKey in disconnectWalletsMap) {
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
      Actions[Constants.FIO_CONNECT_TO_WALLETS_CONFIRM]({
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
    const { walletItems } = this.props
    const { connectWalletsMap, disconnectWalletsMap } = this.state
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

      return (
        <View style={disabled ? styles.walletDisabled : styles.wallet} underlayColor={THEME.COLORS.GRAY_2}>
          <View style={styles.rowContainerTop}>
            <View style={styles.containerLeft}>
              {wallet.symbolImage ? <Image style={styles.imageContainer} source={{ uri: wallet.symbolImage }} resizeMode="contain" /> : <T>-</T>}
            </View>
            <View style={styles.walletDetailsContainer}>
              <View style={styles.walletDetailsCol}>
                <T style={styles.walletDetailsRowCurrency}>{wallet.currencyCode}</T>
                <T style={styles.walletDetailsRowName}>{wallet.name}</T>
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
    const { loading } = this.props
    return <T style={styles.no_wallets_text}>{loading ? s.strings.loading : s.strings.fio_connect_no_wallets}</T>
  }

  render() {
    const { walletItems, disabled } = this.props
    const { connectWalletsMap, disconnectWalletsMap } = this.state
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
          <TouchableHighlight
            style={[styles.button, continueDisabled ? styles.btnDisabled : null]}
            onPress={this._onContinuePress}
            underlayColor={THEME.COLORS.SECONDARY}
            disabled={continueDisabled || disabled}
          >
            <View style={styles.buttonTextWrap}>
              {disabled ? <ActivityIndicator size="small" /> : <T style={styles.buttonText}>{s.strings.string_next_capitalized}</T>}
            </View>
          </TouchableHighlight>
        </View>
      </View>
    )
  }
}

const rawStyles = {
  view: {
    flex: 1
  },
  list: {
    flex: 5,
    backgroundColor: THEME.COLORS.WHITE
  },
  no_wallets_text: {
    padding: scale(30),
    fontSize: scale(22),
    color: THEME.COLORS.GRAY_2,
    textAlign: 'center'
  },
  wallet: {
    backgroundColor: THEME.COLORS.TRANSPARENT
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
    paddingRight: THEME.rem(0.25)
  },
  walletDetailsRowCurrency: {
    fontSize: scale(18)
  },
  walletDetailsRowName: {
    fontSize: scale(14),
    color: THEME.COLORS.SECONDARY
  },
  bottomSection: {
    flex: 2,
    backgroundColor: THEME.COLORS.GRAY_3,
    paddingBottom: scale(20)
  },
  button: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.BLUE_3,
    borderRadius: scale(3),
    height: scale(50),
    marginLeft: scale(15),
    marginRight: scale(15),
    marginTop: scale(15),
    marginBottom: scale(15)
  },
  buttonTextWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonText: {
    opacity: 1,
    color: THEME.COLORS.WHITE,
    fontSize: THEME.rem(1),
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  btnDisabled: {
    backgroundColor: THEME.COLORS.GRAY_2
  },

  rowContainerTop: {
    width: '100%',
    height: scale(76),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: scale(10),
    paddingRight: scale(10),
    borderBottomWidth: scale(1),
    borderBottomColor: THEME.COLORS.GRAY_3
  },
  containerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
    width: scale(36)
  },
  imageContainer: {
    height: scale(24),
    width: scale(24)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

const mapStateToProps = (state: State, ownProps): FioConnectWalletStateProps => {
  const wallets = getWallets(state)
  const ccWalletMap = state.ui.fio.connectedWalletsByFioAddress[ownProps.fioAddressName]

  if (!ccWalletMap) return { walletItems: {}, loading: true }

  const walletItems = makeConnectWallets(wallets, ccWalletMap)

  const out: FioConnectWalletStateProps = {
    walletItems,
    loading: false
  }
  return out
}

export const ConnectWalletsConnector = connect(mapStateToProps, {})(ConnectWallets)
