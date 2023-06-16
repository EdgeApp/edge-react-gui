import * as React from 'react'
import { ScrollView, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { sprintf } from 'sprintf-js'

import { selectWalletToken } from '../../actions/WalletActions'
import { MAX_ADDRESS_CHARACTERS } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useWalletName } from '../../hooks/useWalletName'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { truncateString } from '../../util/utils'
import { Card } from '../cards/Card'
import { SceneWrapper } from '../common/SceneWrapper'
import { CryptoIcon } from '../icons/CryptoIcon'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { FlashNotification } from '../navigation/FlashNotification'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'
import { SelectableRow } from '../themed/SelectableRow'

interface Props extends EdgeSceneProps<'wcConnect'> {}

interface DappDetails {
  subTitleText: string
  bodyTitleText: string
  dAppImage?: JSX.Element
}

export const WcConnectScene = (props: Props) => {
  const { navigation } = props
  const [selectedWallet, setSelectedWallet] = React.useState({ walletId: '', currencyCode: '' })
  const connected = React.useRef(false)
  const theme = useTheme()
  const styles = getStyles(theme)
  const { uri } = props.route.params
  const [dappDetails, setDappDetails] = React.useState<DappDetails>({ subTitleText: '', bodyTitleText: '' })
  const [walletAddress, setWalletAddress] = React.useState('')

  const account = useSelector(state => state.core.account)
  const selectedWalletId = useSelector(state => state.ui.wallets.selectedWalletId)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const wallet = currencyWallets[selectedWalletId]
  const walletName = useWalletName(wallet)

  React.useEffect(() => {
    wallet.getReceiveAddress().then(r => setWalletAddress(r.publicAddress))
  }, [wallet])

  const dispatch = useDispatch()

  const handleConnect = async () => {
    try {
      await wallet.otherMethods.wcConnect(uri, walletAddress, wallet.id)
      connected.current = true
      Airship.show(bridge => <FlashNotification bridge={bridge} message={lstrings.wc_confirm_return_to_browser} onPress={() => {}} />)
      navigation.navigate('wcConnections', {})
    } catch (error: any) {
      console.error(`WalletConnect connection error: ${error.message}`)
    }
  }

  const handleRequestDapp = async (walletId: string) => {
    try {
      const dApp = await currencyWallets[walletId].otherMethods.wcInit({ uri })
      const dAppName = String(dApp.peerMeta.name).split(' ')[0]
      setDappDetails({
        subTitleText: sprintf(lstrings.wc_confirm_subtitle, dAppName),
        bodyTitleText: sprintf(lstrings.wc_confirm_body_title, dAppName),
        dAppImage: <FastImage style={styles.currencyLogo} source={{ uri: dApp.peerMeta.icons[0] }} />
      })
    } catch (e: any) {
      showError('Failed to connect, try again.')
      console.error('wcInit error:', e)
      navigation.navigate('wcConnections', {})
    }
  }

  const handleWalletListModal = useHandler(() => {
    const allowedCurrencyWallets = Object.keys(currencyWallets).filter(walletId => currencyWallets[walletId]?.otherMethods?.wcConnect != null)

    const allowedAssets = allowedCurrencyWallets.map(walletID => ({ pluginId: currencyWallets[walletID].currencyInfo.pluginId }))
    Airship.show<WalletListResult>(bridge => (
      <WalletListModal bridge={bridge} headerTitle={lstrings.select_wallet} allowedAssets={allowedAssets} navigation={navigation} />
    )).then(({ walletId, currencyCode }: WalletListResult) => {
      if (walletId && currencyCode) {
        const wallet = account.currencyWallets[walletId]
        const tokenId = getTokenId(account, wallet.currencyInfo.pluginId, currencyCode)
        dispatch(selectWalletToken({ navigation, walletId, tokenId }))
        setSelectedWallet({ walletId, currencyCode })
        if (dappDetails.subTitleText === '') {
          handleRequestDapp(walletId)
        }
      }
    })
  })

  React.useEffect(() => {
    if (selectedWallet.walletId === '' && selectedWallet.currencyCode === '') {
      handleWalletListModal()
    }
  }, [selectedWallet.walletId, selectedWallet.currencyCode, handleWalletListModal])

  React.useEffect(() => {
    return () => {
      if (!connected.current && wallet?.otherMethods?.wcDisconnect != null) wallet.otherMethods.wcDisconnect(uri)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderWalletSelect = () => {
    if (selectedWallet.walletId === '' && selectedWallet.currencyCode === '') {
      return <SelectableRow arrowTappable paddingRem={[0, 1]} title={lstrings.wc_confirm_select_wallet} onPress={handleWalletListModal} />
    } else {
      const walletNameStr = truncateString(walletName || '', MAX_ADDRESS_CHARACTERS)
      const walletImage = (
        <CryptoIcon tokenId={getTokenId(account, wallet.currencyInfo.pluginId, selectedWallet.currencyCode)} walletId={selectedWallet.walletId} />
      )
      const walletAddressStr = truncateString(JSON.stringify(walletAddress), MAX_ADDRESS_CHARACTERS, true)
      return (
        <SelectableRow arrowTappable icon={walletImage} paddingRem={[0, 1]} subTitle={walletAddressStr} title={walletNameStr} onPress={handleWalletListModal} />
      )
    }
  }

  const { subTitleText, bodyTitleText, dAppImage } = dappDetails

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <SceneHeader title={lstrings.wc_confirm_title} underline />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.listRow}>
          {dAppImage == null ? null : dAppImage}
          <EdgeText style={styles.subTitle} numberOfLines={2}>
            {subTitleText}
          </EdgeText>
        </View>

        <EdgeText style={styles.bodyTitle}>{bodyTitleText}</EdgeText>
        <EdgeText style={styles.body}>{lstrings.wc_confirm_body}</EdgeText>
        <Card paddingRem={0} marginRem={[2.5, 0.5, 2]}>
          {renderWalletSelect()}
        </Card>
        {subTitleText !== '' && (
          <MainButton label={lstrings.wc_confirm_connect_button} type="secondary" marginRem={[3.5, 0.5]} onPress={handleConnect} alignSelf="center" />
        )}
      </ScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  currencyLogo: {
    height: theme.rem(2),
    width: theme.rem(2)
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
    marginLeft: theme.rem(0.5)
  },
  icon: {
    alignSelf: 'center',
    color: theme.modal,
    paddingTop: theme.rem(0.25)
  }
}))
