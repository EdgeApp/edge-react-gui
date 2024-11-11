import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Switch, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'

import { checkAndShowLightBackupModal } from '../../actions/BackupModalActions'
import { showError } from '../../components/services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../../components/services/ThemeContext'
import { EdgeText } from '../../components/themed/EdgeText'
import { MainButton } from '../../components/themed/MainButton'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { FioConnectionWalletItem } from '../../types/types'
import { getTokenIdForced } from '../../util/CurrencyInfoHelpers'
import { convertFIOToEdgeCodes, makeConnectWallets } from '../../util/FioAddressUtils'
import { AlertCardUi4 } from '../cards/AlertCard'
import { CryptoIcon } from '../icons/CryptoIcon'

interface FioConnectWalletsProps {
  disabled: boolean
  fioAddressName: string
  fioWallet: EdgeCurrencyWallet | null
  navigation: NavigationBase
}

let flashListToggle = false // TODO: Hack to get FlashList to rerender when select wallet is tapped. Cache this with useMemo once we switch to hooks.

export const ConnectWallets = (props: FioConnectWalletsProps) => {
  const { disabled, fioAddressName, fioWallet, navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const edgeWallets = useWatch(account, 'currencyWallets')
  const ccWalletMap = useSelector(state => state.ui.fio.connectedWalletsByFioAddress[fioAddressName] ?? {})
  const walletItems = React.useMemo(() => makeConnectWallets(edgeWallets, ccWalletMap), [edgeWallets, ccWalletMap])

  const [connectWalletsMap, setConnectWalletsMap] = React.useState<{ [walletId: string]: FioConnectionWalletItem }>({})
  const [disconnectWalletsMap, setDisconnectWalletsMap] = React.useState<{ [walletId: string]: FioConnectionWalletItem }>({})
  const [prevItemsConnected, setPrevItemsConnected] = React.useState<{ [key: string]: boolean }>({})

  const continueDisabled = Object.keys(connectWalletsMap).length === 0 && Object.keys(disconnectWalletsMap).length === 0

  React.useEffect(() => {
    for (const walletKey of Object.keys(prevItemsConnected)) {
      if (prevItemsConnected[walletKey] !== walletItems[walletKey]?.isConnected) {
        setConnectWalletsMap({})
        setDisconnectWalletsMap({})
        setPrevItemsConnected({})
      }
    }
  }, [prevItemsConnected, walletItems])

  const handleContinuePress = useHandler(() => {
    if (checkAndShowLightBackupModal(account, navigation)) return

    const walletsToDisconnect: FioConnectionWalletItem[] = []
    for (const walletKey of Object.keys(disconnectWalletsMap)) {
      if (
        Object.keys(connectWalletsMap).find(
          (cWalletKey: string) => connectWalletsMap[cWalletKey].fullCurrencyCode === disconnectWalletsMap[walletKey].fullCurrencyCode
        ) == null
      ) {
        walletsToDisconnect.push(disconnectWalletsMap[walletKey])
      }
    }

    if (fioWallet != null) {
      const prevItemsConnected = Object.keys(walletItems).reduce<{ [key: string]: boolean }>((acc, walletKey: string) => {
        acc[walletKey] = walletItems[walletKey].isConnected
        return acc
      }, {})
      setPrevItemsConnected(prevItemsConnected)
      const walletsToConnect: FioConnectionWalletItem[] = Object.keys(connectWalletsMap).map(key => connectWalletsMap[key])
      navigation.navigate('fioConnectToWalletsConfirm', {
        fioAddressName,
        walletId: fioWallet.id,
        walletsToConnect,
        walletsToDisconnect
      })
    } else {
      showError(lstrings.fio_wallet_missing_for_fio_address)
    }
  })

  const handleSelectWallet = (value: boolean, wallet: FioConnectionWalletItem): void => {
    if (value) {
      if (disconnectWalletsMap[wallet.key] != null) {
        delete disconnectWalletsMap[wallet.key]
      } else {
        connectWalletsMap[wallet.key] = wallet
      }
    } else {
      if (connectWalletsMap[wallet.key] != null) {
        delete connectWalletsMap[wallet.key]
      } else {
        disconnectWalletsMap[wallet.key] = wallet
      }
    }

    setConnectWalletsMap({ ...connectWalletsMap })
    setDisconnectWalletsMap({ ...disconnectWalletsMap })
    flashListToggle = !flashListToggle
  }

  const keyExtractor = useHandler((item: FioConnectionWalletItem): string => `${item.fullCurrencyCode}${item.edgeWallet.id}`)

  const renderFioConnectionWalletItem = ({ item: wallet }: { item: FioConnectionWalletItem }) => {
    if (wallet != null) {
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

      // Convert back to Edge currency code to display the icon
      const pluginId = wallet.edgeWallet.currencyInfo.pluginId
      const { tokenCode: currencyCode } = convertFIOToEdgeCodes(pluginId, wallet.chainCode, wallet.currencyCode)

      const tokenId = getTokenIdForced(account, pluginId, currencyCode)

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
                  <Switch disabled={disabled} onChange={() => handleSelectWallet(!value, wallet)} value={value} />
                </View>
              </View>
            </View>
          </View>
        </View>
      )
    }
    return null
  }

  return (
    <View style={styles.view}>
      <View>
        {Object.keys(walletItems).length > 0 ? (
          <FlatList
            data={Object.values(walletItems)}
            extraData={flashListToggle}
            keyboardShouldPersistTaps="handled"
            keyExtractor={keyExtractor}
            renderItem={renderFioConnectionWalletItem}
            contentContainerStyle={{ paddingBottom: theme.rem(4) }}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          />
        ) : (
          <AlertCardUi4 type="warning" title={lstrings.fio_connect_no_wallets} />
        )}
      </View>
      <View style={styles.bottomSection}>
        <MainButton onPress={handleContinuePress} label={lstrings.string_next_capitalized} disabled={continueDisabled || disabled} />
      </View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  view: {
    flex: 1
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
    position: 'absolute',
    alignSelf: 'center',
    bottom: 0,
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
