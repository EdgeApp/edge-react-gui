import * as React from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useWalletConnect } from '../../hooks/useWalletConnect'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { WcConnectionInfo } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { ScanModal } from '../modals/ScanModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'

interface Props extends EdgeSceneProps<'wcConnections'> {}

export interface WcConnectionsParams {}

export const WcConnectionsScene = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const [connections, setConnections] = React.useState<WcConnectionInfo[]>([])

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const selectedWalletId = useSelector(state => state.ui.wallets.selectedWalletId)
  const walletConnect = useWalletConnect()

  // Look for all existing WalletConnect-enabled wallets
  const wcEnabledWalletIds = Object.keys(currencyWallets).filter(walletId => currencyWallets[walletId]?.otherMethods?.wcConnect != null)

  // Check if the user was already recently using a WalletConnect-enabled wallet.
  // If not, select another WalletConnect-enabled wallet, if it exists.
  const tempWallet =
    currencyWallets[selectedWalletId]?.otherMethods?.wcConnect != null
      ? currencyWallets[selectedWalletId]
      : wcEnabledWalletIds.length > 0
      ? currencyWallets[wcEnabledWalletIds[0]]
      : undefined

  useAsyncEffect(async () => {
    const connections = await walletConnect.getActiveSessions()
    setConnections(connections)
    // We want to trigger another lookup whenever the props change ie. navigating from the connect or disconnect scenes
  }, [walletConnect, props])

  const onScanSuccess = async (qrResult: string) => {
    if (tempWallet === undefined) showError(new Error('onScanSuccess called without a defined wallet'))
    else {
      try {
        const parsedScan = await tempWallet.parseUri(qrResult, tempWallet.currencyInfo.currencyCode)
        const uriStr = parsedScan.walletConnect?.uri
        if (uriStr === undefined) throw new Error('Undefined uri in parsed scan')
        navigation.navigate('wcConnect', { uri: uriStr })
      } catch (error: any) {
        showError(error)
      }
    }
  }

  const handleActiveConnectionPress = (wcConnectionInfo: WcConnectionInfo) => {
    navigation.navigate('wcDisconnect', { wcConnectionInfo })
  }

  const handleNewConnectionPress = () => {
    Airship.show<string | undefined>(bridge => (
      <ScanModal
        bridge={bridge}
        title={lstrings.scan_qr_label}
        textModalHint={lstrings.wc_scan_modal_text_modal_hint}
        textModalTitle={lstrings.wc_scan_modal_text_modal_title}
      />
    ))
      .then((result: string | undefined) => {
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
      <SceneHeader underline title={lstrings.wc_walletconnect_title} />
      <ScrollView contentContainerStyle={styles.container}>
        <EdgeText style={styles.subTitle}>{lstrings.wc_walletconnect_subtitle}</EdgeText>
        <MainButton
          label={lstrings.wc_walletconnect_new_connection_button}
          type="secondary"
          marginRem={[1, 0.5]}
          onPress={() => handleNewConnectionPress()}
          alignSelf="center"
        />
        <EdgeText style={styles.listTitle}>{lstrings.wc_walletconnect_active_connections}</EdgeText>
        <View style={styles.list}>
          {connections.map((dAppConnection: WcConnectionInfo, index) => (
            <TouchableOpacity key={index} style={styles.listRow} onPress={() => handleActiveConnectionPress(dAppConnection)}>
              <FastImage resizeMode="contain" style={styles.currencyLogo} source={{ uri: dAppConnection.icon }} />
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
    padding: theme.rem(0.5),
    paddingTop: theme.rem(1)
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
