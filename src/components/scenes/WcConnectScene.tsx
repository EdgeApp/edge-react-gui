import { Web3WalletTypes } from '@walletconnect/web3wallet'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { sprintf } from 'sprintf-js'

import { selectWalletToken } from '../../actions/WalletActions'
import { MAX_ADDRESS_CHARACTERS } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useMount } from '../../hooks/useMount'
import { useUnmount } from '../../hooks/useUnmount'
import { useWalletConnect } from '../../hooks/useWalletConnect'
import { useWalletName } from '../../hooks/useWalletName'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { EdgeAsset } from '../../types/types'
import { getTokenIdForced } from '../../util/CurrencyInfoHelpers'
import { truncateString } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { FlashNotification } from '../navigation/FlashNotification'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { SceneHeader } from '../themed/SceneHeader'
import { SelectableRow } from '../themed/SelectableRow'
import { ButtonsViewUi4 } from '../ui4/ButtonsViewUi4'
import { CryptoIconUi4 } from '../ui4/CryptoIconUi4'

interface Props extends EdgeSceneProps<'wcConnect'> {}

export interface WcConnectParams {
  proposal: Web3WalletTypes.SessionProposal
  edgeTokenIds: EdgeAsset[]
}

export const WcConnectScene = (props: Props) => {
  const { navigation } = props
  const [selectedWallet, setSelectedWallet] = React.useState({ walletId: '', currencyCode: '' })
  const connected = React.useRef(false)
  const theme = useTheme()
  const styles = getStyles(theme)
  const { proposal, edgeTokenIds } = props.route.params
  const [walletAddress, setWalletAddress] = React.useState('')

  const account = useSelector(state => state.core.account)
  const selectedWalletId = useSelector(state => state.ui.wallets.selectedWalletId)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const wallet = currencyWallets[selectedWalletId]
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

  const dispatch = useDispatch()

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
      const { walletId, currencyCode } = result
      const wallet = account.currencyWallets[walletId]
      const tokenId = getTokenIdForced(account, wallet.currencyInfo.pluginId, currencyCode)
      await dispatch(selectWalletToken({ navigation, walletId, tokenId }))
      setSelectedWallet({ walletId, currencyCode })
    }
  })

  useMount(() => {
    handleWalletListModal().catch(err => showError(err))
  })

  useUnmount(() => {
    if (!connected.current) wallet.otherMethods.rejectSession(proposal)
  })

  const renderWalletSelect = () => {
    if (selectedWallet.walletId === '' && selectedWallet.currencyCode === '') {
      return <SelectableRow title={lstrings.wc_confirm_select_wallet} onPress={handleWalletListModal} />
    } else {
      const walletNameStr = truncateString(walletName || '', MAX_ADDRESS_CHARACTERS)
      const walletImage = (
        <CryptoIconUi4 pluginId={wallet.currencyInfo.pluginId} tokenId={getTokenIdForced(account, wallet.currencyInfo.pluginId, selectedWallet.currencyCode)} />
      )
      const walletAddressStr = truncateString(walletAddress, MAX_ADDRESS_CHARACTERS, true)
      return <SelectableRow icon={walletImage} subTitle={walletAddressStr} title={walletNameStr} onPress={handleWalletListModal} />
    }
  }

  return (
    <SceneWrapper>
      <SceneHeader title={lstrings.wc_confirm_title} underline />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.listRow}>
          <FastImage resizeMode="contain" style={styles.currencyLogo} source={{ uri: dAppImage }} />
          <EdgeText style={styles.subTitle} numberOfLines={2}>
            {subTitleText}
          </EdgeText>
        </View>

        <EdgeText style={styles.bodyTitle}>{bodyTitleText}</EdgeText>
        <EdgeText style={styles.body}>{lstrings.wc_confirm_body}</EdgeText>
        {renderWalletSelect()}
        {subTitleText === '' ? null : <ButtonsViewUi4 sceneMargin primary={{ label: lstrings.wc_confirm_connect_button, onPress: handleConnect }} />}
      </ScrollView>
    </SceneWrapper>
  )
}

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
