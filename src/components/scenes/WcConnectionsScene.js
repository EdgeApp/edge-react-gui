// @flow
import * as React from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import s from '../../locales/strings.js'
import { useEffect, useState } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { type WcConnectionInfo, type wcGetConnection } from '../../types/types.js'
import { unixToLocaleDateTime } from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ScanModal } from '../modals/ScanModal.js'
import { Airship, showError } from '../services/AirshipInstance'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { MainButton } from '../themed/MainButton.js'
import { SceneHeader } from '../themed/SceneHeader'

type Props = {
  navigation: NavigationProp<'wcConnections'>
}

export const WcConnectionsScene = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const [connections, setConnections] = useState([])
  const { tempWallet, currencyWallets, wcEnabledWalletIds } = useSelector(state => {
    const { currencyWallets } = state.core.account

    // Look for all existing WalletConnect-enabled wallets
    const wcEnabledWalletIds = Object.keys(currencyWallets).filter(walletId => currencyWallets[walletId]?.otherMethods?.wcConnect != null)

    // Check if the user was already recently using a WalletConnect-enabled wallet.
    // If not, select another WalletConnect-enabled wallet, if it exists.
    const selectedWalletId = state.ui.wallets.selectedWalletId
    const tempWallet =
      currencyWallets[selectedWalletId]?.otherMethods?.wcConnect != null
        ? currencyWallets[selectedWalletId]
        : wcEnabledWalletIds.length > 0
        ? currencyWallets[wcEnabledWalletIds[0]]
        : undefined

    // Temp wallet is only used for calling its parseUri function.
    // Actual wallet used for the connection is set later in the WcConnectScene
    return { tempWallet, currencyWallets, wcEnabledWalletIds }
  })

  useEffect(() => {
    getdAppconnections().then(connections => setConnections(connections))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props])

  const createWcConnectionInfo = (connectedWalletId: string, dApp: wcGetConnection): WcConnectionInfo => {
    const { date, time } = unixToLocaleDateTime(dApp.timeConnected)
    const timeConnected = `${date} at ${time}`
    return {
      dAppName: dApp.peerMeta.name,
      dAppUrl: dApp.peerMeta.url,
      timeConnected,
      walletName: currencyWallets[connectedWalletId].name ?? 'NA',
      walletId: connectedWalletId,
      uri: dApp.uri,
      icon: dApp.peerMeta.icons[0]
    }
  }

  // Populate the list of dAppConnections
  const getdAppconnections = async (): Promise<WcConnectionInfo[]> => {
    const dAppConnections = []
    if (wcEnabledWalletIds.length > 0) {
      for (const enabledWalletId of wcEnabledWalletIds) {
        const connections = await currencyWallets[enabledWalletId].otherMethods.wcGetConnections()
        if (connections.length > 0) {
          for (const dApp of connections) {
            dAppConnections.push(createWcConnectionInfo(enabledWalletId, dApp))
          }
        }
      }
    }
    return dAppConnections
  }

  const onScanSuccess = async (qrResult: string) => {
    if (tempWallet === undefined) showError(new Error('onScanSuccess called without a defined wallet'))
    else {
      try {
        const parsedScan = await tempWallet.parseUri(qrResult, tempWallet.currencyInfo.currencyCode)
        const uriStr = parsedScan.walletConnect?.uri
        if (uriStr === undefined) throw new Error('Undefined uri in parsed scan')
        navigation.navigate('wcConnect', { uri: uriStr })
      } catch (error) {
        showError(error)
      }
    }
  }

  const handleActiveConnectionPress = (wcConnectionInfo: WcConnectionInfo) => {
    navigation.navigate('wcDisconnect', { wcConnectionInfo })
  }

  const handleNewConnectionPress = () => {
    Airship.show(bridge => <ScanModal bridge={bridge} title={s.strings.scan_qr_label} />)
      .then((result: string | void) => {
        console.log(result)
        if (result) {
          onScanSuccess(result)
        } else {
          showError('No scan result')
        }
      })
      .catch(error => {
        showError(error)
      })
  }

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <SceneHeader underline title={s.strings.wc_walletconnect_title} />
      <ScrollView style={styles.container}>
        <EdgeText style={styles.subTitle}>{s.strings.wc_walletconnect_subtitle}</EdgeText>
        <MainButton
          label={s.strings.wc_walletconnect_new_connection_button}
          type="secondary"
          marginRem={[1, 0.5]}
          onPress={() => handleNewConnectionPress()}
          alignSelf="center"
        />
        <EdgeText style={styles.listTitle}>{s.strings.wc_walletconnect_active_connections}</EdgeText>
        <View style={styles.list}>
          {connections.map((dAppConnection: WcConnectionInfo, index) => (
            <TouchableOpacity key={index} style={styles.listRow} onPress={() => handleActiveConnectionPress(dAppConnection)}>
              <FastImage style={styles.currencyLogo} source={{ uri: dAppConnection.icon }} />
              <View style={styles.info}>
                <EdgeText style={styles.infoTitle}>{dAppConnection.dAppName}</EdgeText>
                <EdgeText style={styles.infoMidTitle}>{dAppConnection.dAppUrl}</EdgeText>
                <EdgeText style={styles.infoSubTitle}>{dAppConnection.walletName}</EdgeText>
              </View>
              <View style={styles.arrow}>
                <AntDesignIcon name="right" size={theme.rem(1)} color={theme.icon} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    padding: theme.rem(0.5)
  },
  currencyLogo: {
    height: theme.rem(2),
    width: theme.rem(2),
    resizeMode: 'contain'
  },
  arrow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto'
  },
  list: {
    display: 'flex',
    flexDirection: 'column'
  },
  listRow: {
    marginTop: theme.rem(1),
    marginBottom: theme.rem(1.5),
    marginHorizontal: theme.rem(0.5),
    flexDirection: 'row',
    alignItems: 'center'
  },
  listTitle: {
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(0.75),
    margin: theme.rem(0.5)
  },
  info: {
    flex: 4,
    marginLeft: theme.rem(1)
  },
  infoTitle: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  infoMidTitle: {
    color: theme.primaryText,
    fontSize: theme.rem(0.75)
  },
  infoSubTitle: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75)
  },
  subTitle: {
    fontFamily: theme.fontFaceMedium,
    margin: theme.rem(0.5)
  }
}))
