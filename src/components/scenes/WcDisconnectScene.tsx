import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { useWalletConnect } from '../../hooks/useWalletConnect'
import { lstrings } from '../../locales/strings'
import { EdgeSceneProps } from '../../types/routerTypes'
import { WcConnectionInfo } from '../../types/types'
import { Card } from '../cards/Card'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'
import { Tile } from '../tiles/Tile'

interface Props extends EdgeSceneProps<'wcDisconnect'> {}

export interface WcDisconnectParams {
  wcConnectionInfo: WcConnectionInfo
}

export const WcDisconnectScene = (props: Props) => {
  const { navigation, route } = props
  const { wcConnectionInfo } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  const walletConnect = useWalletConnect()

  const handleDisconnect = async () => {
    try {
      await walletConnect.disconnectSession(wcConnectionInfo.uri)
    } catch (e: any) {
      showError(e)
    }
    navigation.navigate('wcConnections', {})
  }

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <SceneHeader underline title={lstrings.wc_walletconnect_title} />
      <View style={styles.container}>
        <Card paddingRem={0} marginRem={[0.5, 0.5, 0.5]}>
          <View key={wcConnectionInfo.dAppName} style={styles.listRow}>
            <FastImage style={styles.currencyLogo} source={{ uri: wcConnectionInfo.icon }} />
            <View style={styles.info}>
              <EdgeText style={styles.infoTitle}>{wcConnectionInfo.dAppName}</EdgeText>
              <EdgeText style={styles.infoBody}>{wcConnectionInfo.dAppUrl}</EdgeText>
            </View>
          </View>
        </Card>
      </View>
      <Tile type="static" title={lstrings.string_expiration} body={wcConnectionInfo.expiration} contentPadding={false} />
      <Tile type="static" title={lstrings.wc_details_connected_wallet} body={wcConnectionInfo.walletName} contentPadding={false} />
      <MainButton label={lstrings.wc_details_disconnect_button} type="secondary" marginRem={[3.5, 0.5]} onPress={handleDisconnect} alignSelf="center" />
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
  listRow: {
    marginTop: theme.rem(1),
    marginBottom: theme.rem(1),
    marginHorizontal: theme.rem(1.5),
    flexDirection: 'row',
    alignItems: 'center'
  },
  info: {
    flex: 4,
    marginLeft: theme.rem(1)
  },
  infoTitle: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  infoBody: {
    color: theme.primaryText,
    fontSize: theme.rem(0.75)
  }
}))
