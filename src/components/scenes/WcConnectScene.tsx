import { Web3WalletTypes } from '@walletconnect/web3wallet'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { sprintf } from 'sprintf-js'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { MAX_ADDRESS_CHARACTERS } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useUnmount } from '../../hooks/useUnmount'
import { useWalletConnect } from '../../hooks/useWalletConnect'
import { useWalletName } from '../../hooks/useWalletName'
import { lstrings } from '../../locales/strings'
import { EdgeSceneProps } from '../../types/routerTypes'
import { EdgeAsset } from '../../types/types'
import { truncateString } from '../../util/utils'
import { ButtonsView } from '../buttons/ButtonsView'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { CryptoIcon } from '../icons/CryptoIcon'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { FlashNotification } from '../navigation/FlashNotification'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { SceneHeader } from '../themed/SceneHeader'
import { SelectableRow } from '../themed/SelectableRow'

interface Props extends EdgeSceneProps<'wcConnect'> {
  wallet: EdgeCurrencyWallet
}

export interface WcConnectParams {
  proposal: Web3WalletTypes.SessionProposal
  edgeTokenIds: EdgeAsset[]
  walletId: string
}

export const WcConnectScene = withWallet((props: Props) => {
  const { navigation, wallet } = props
  const connected = React.useRef(false)
  const theme = useTheme()
  const styles = getStyles(theme)
  const { proposal, edgeTokenIds } = props.route.params
  const [walletAddress, setWalletAddress] = React.useState('')

  const walletName = useWalletName(wallet)
  const walletConnect = useWalletConnect()

  const { subTitleText, bodyTitleText, dAppImage } = React.useMemo(() => {
    const subTitleText = sprintf(lstrings.wc_confirm_subtitle, proposal.params.proposer.metadata.name)
    const bodyTitleText = sprintf(lstrings.wc_confirm_body_title, proposal.params.proposer.metadata.name)
    const imageUri = proposal.params.proposer.metadata.icons[0] ?? '.svg'
    const dAppImage = imageUri.endsWith('.svg') ? 'https://content.edge.app/walletConnectLogo.png' : imageUri
    return { subTitleText, bodyTitleText, dAppImage }
  }, [proposal])

  useAsyncEffect(
    async () => {
      const r = await wallet.getReceiveAddress({ tokenId: null })
      setWalletAddress(r.publicAddress)
    },
    [wallet],
    'WcConnectScene'
  )

  const handleConnect = async () => {
    try {
      await walletConnect.approveSession(proposal, wallet.id)
      connected.current = true
      Airship.show(bridge => <FlashNotification bridge={bridge} message={lstrings.wc_confirm_return_to_browser} onPress={() => {}} />).catch(e => showError(e))
      navigation.navigate('wcConnections', {})
    } catch (error: any) {
      console.error('WalletConnect connection error:', String(error))
      showError(error)
    }
  }

  const handleWalletListModal = useHandler(async () => {
    const result = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal bridge={bridge} headerTitle={lstrings.select_wallet} allowedAssets={edgeTokenIds} showCreateWallet navigation={navigation} />
    ))
    if (result?.type === 'wallet') {
      const { walletId } = result
      navigation.setParams({ walletId })
    }
  })

  useUnmount(async () => {
    if (!connected.current) await walletConnect.rejectSession(proposal)
  })

  const renderWalletSelect = () => {
    const walletNameStr = truncateString(walletName, MAX_ADDRESS_CHARACTERS)
    const walletImage = <CryptoIcon pluginId={wallet.currencyInfo.pluginId} tokenId={null} />
    const walletAddressStr = truncateString(walletAddress, MAX_ADDRESS_CHARACTERS, true)
    return <SelectableRow icon={walletImage} subTitle={walletAddressStr} title={walletNameStr} onPress={handleWalletListModal} />
  }

  return (
    <SceneWrapper>
      <SceneHeader title={lstrings.wc_confirm_title} underline />
      <ScrollView contentContainerStyle={styles.container} scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}>
        <View style={styles.listRow}>
          <FastImage resizeMode="contain" style={styles.currencyLogo} source={{ uri: dAppImage }} />
          <EdgeText style={styles.subTitle} numberOfLines={2}>
            {subTitleText}
          </EdgeText>
        </View>

        <EdgeText style={styles.bodyTitle}>{bodyTitleText}</EdgeText>
        <EdgeText style={styles.body}>{lstrings.wc_confirm_body}</EdgeText>
        {renderWalletSelect()}
        {subTitleText === '' ? null : <ButtonsView parentType="scene" primary={{ label: lstrings.wc_confirm_connect_button, onPress: handleConnect }} />}
      </ScrollView>
    </SceneWrapper>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  currencyLogo: {
    height: theme.rem(2),
    width: theme.rem(2),
    marginLeft: theme.rem(0.5)
  },
  container: {
    padding: theme.rem(0.5),
    paddingTop: theme.rem(1)
  },
  listRow: {
    marginTop: theme.rem(1),
    marginBottom: theme.rem(1.5),
    marginHorizontal: theme.rem(0.5),
    marginRight: theme.rem(2),
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  subTitle: {
    fontFamily: theme.fontFaceMedium,
    marginTop: theme.rem(0.25),
    marginLeft: theme.rem(1)
  },
  bodyTitle: {
    fontFamily: theme.fontFaceMedium,
    marginLeft: theme.rem(0.5)
  },
  body: {
    color: theme.secondaryText,
    marginLeft: theme.rem(0.5),
    marginBottom: theme.rem(1)
  },
  icon: {
    alignSelf: 'center',
    color: theme.modal,
    paddingTop: theme.rem(0.25)
  }
}))
