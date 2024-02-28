import { ProposalTypes } from '@walletconnect/types'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import { showBackupForTransferModal } from '../../actions/BackupModalActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useMount } from '../../hooks/useMount'
import { useWalletConnect, walletConnectClient } from '../../hooks/useWalletConnect'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { EdgeAsset, WcConnectionInfo } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { ScanModal } from '../modals/ScanModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'

interface Props extends EdgeSceneProps<'wcConnections'> {}

export interface WcConnectionsParams {
  uri?: string
}

export const WcConnectionsScene = (props: Props) => {
  const { navigation } = props
  const { uri } = props.route.params
  const theme = useTheme()
  const styles = getStyles(theme)
  const [connections, setConnections] = React.useState<WcConnectionInfo[]>([])
  const [connecting, setConnecting] = React.useState(false)

  const account = useSelector(state => state.core.account)
  const activeUsername = useSelector(state => state.core.account.username)
  const walletConnect = useWalletConnect()
  const isLightAccount = activeUsername == null

  useMount(() => {
    if (uri != null) onScanSuccess(uri).catch(err => showError(err))
  })

  useAsyncEffect(
    async () => {
      const connections = await walletConnect.getActiveSessions()
      setConnections(connections)
      // We want to trigger another lookup whenever the props change ie. navigating from the connect or disconnect scenes
    },
    [walletConnect, props],
    'WcConnectionsScene'
  )

  const onScanSuccess = async (qrResult: string) => {
    setConnecting(true)
    try {
      const proposal = await walletConnect.initSession(qrResult)
      const edgeTokenIds = getProposalNamespaceCompatibleEdgeTokenIds(proposal, account.currencyConfig)
      navigation.navigate('wcConnect', { proposal, edgeTokenIds })
    } catch (error: any) {
      showError(error)
    }
    setConnecting(false)
  }

  const handleActiveConnectionPress = (wcConnectionInfo: WcConnectionInfo) => {
    navigation.navigate('wcDisconnect', { wcConnectionInfo })
  }

  const handleNewConnectionPress = async () => {
    if (isLightAccount) {
      showBackupForTransferModal(() => navigation.navigate('upgradeUsername', {}))
    } else {
      const result = await Airship.show<string | undefined>(bridge => (
        <ScanModal
          bridge={bridge}
          scanModalTitle={lstrings.scan_qr_label}
          textModalHint={lstrings.wc_scan_modal_text_modal_hint}
          textModalTitle={lstrings.wc_scan_modal_text_modal_title}
        />
      ))
      if (result != null) {
        await onScanSuccess(result)
      }
    }
  }

  return (
    <SceneWrapper>
      <SceneHeader underline title={lstrings.wc_walletconnect_title} />
      <ScrollView contentContainerStyle={styles.container} scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}>
        <EdgeText style={styles.subTitle}>{lstrings.wc_walletconnect_subtitle}</EdgeText>
        <MainButton
          label={connecting ? undefined : lstrings.wc_walletconnect_new_connection_button}
          type="primary"
          marginRem={[2, 0]}
          onPress={async () => await handleNewConnectionPress()}
          spinner={connecting}
        />
        <EdgeText style={styles.listTitle}>{lstrings.wc_walletconnect_active_connections}</EdgeText>
        {walletConnectClient.client != null ? null : (
          <EdgeText style={{ ...styles.listTitle, color: theme.dangerText }}>
            {sprintf(lstrings.wc_dapp_disconnected, lstrings.wc_walletconnect_title)}
          </EdgeText>
        )}
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

const getProposalNamespaceCompatibleEdgeTokenIds = (proposal: Web3WalletTypes.SessionProposal, currencyConfig: EdgeAccount['currencyConfig']): EdgeAsset[] => {
  // The type definition implies optionalNamespaces will be present but is actually unchecked and not all dapps provide it
  const { requiredNamespaces, optionalNamespaces = {} } = proposal.params

  const getChainIdsFromNamespaces = (namespaces: { [key: string]: ProposalTypes.BaseRequiredNamespace }): Set<string> => {
    const chainIds = new Set<string>()
    for (const key of Object.keys(namespaces)) {
      if (key.split(':').length === 2) {
        chainIds.add(key) // The key itself could CAIP-2 compliant
      }
      const namespace = namespaces[key]
      if (namespace.chains != null) {
        namespace.chains.forEach(chainId => chainIds.add(chainId))
      }
    }
    return chainIds
  }

  const requiredChainIds: Set<string> = getChainIdsFromNamespaces(requiredNamespaces)
  const optionalChainIds: Set<string> = requiredChainIds.size === 0 ? getChainIdsFromNamespaces(optionalNamespaces) : new Set()

  let hasWalletForRequiredNamespace = false
  const edgeTokenIdMap = new Map<string, EdgeAsset>()
  for (const pluginId of Object.keys(currencyConfig)) {
    const chainId = SPECIAL_CURRENCY_INFO[pluginId].walletConnectV2ChainId
    if (chainId == null) continue

    const chainIdString = `${chainId.namespace}:${chainId.reference}`
    if (requiredChainIds.has(chainIdString)) {
      hasWalletForRequiredNamespace = true
      if (!edgeTokenIdMap.has(pluginId)) {
        edgeTokenIdMap.set(pluginId, { pluginId, tokenId: null })
      }
    }
    if (optionalChainIds.has(chainIdString)) {
      if (!edgeTokenIdMap.has(pluginId)) {
        edgeTokenIdMap.set(pluginId, { pluginId, tokenId: null })
      }
    }
  }

  if (!hasWalletForRequiredNamespace) {
    throw new Error('No wallets meet dapp requirements')
  }

  return [...edgeTokenIdMap.values()]
}
