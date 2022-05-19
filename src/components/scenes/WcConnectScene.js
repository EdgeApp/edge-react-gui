/* eslint-disable react-native/no-raw-text */
// @flow

import * as React from 'react'
import { ScrollView, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { sprintf } from 'sprintf-js'

import { selectWalletFromModal } from '../../actions/WalletActions.js'
import { MAX_ADDRESS_CHARACTERS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { getSelectedWallet } from '../../selectors/WalletSelectors.js'
import { useEffect, useRef, useState } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { getTokenId } from '../../util/CurrencyInfoHelpers.js'
import { truncateString } from '../../util/utils.js'
import { Card } from '../cards/Card'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { type WalletListResult, WalletListModal } from '../modals/WalletListModal.js'
import { FlashNotification } from '../navigation/FlashNotification.js'
import { Airship, showError } from '../services/AirshipInstance'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { CurrencyIcon } from '../themed/CurrencyIcon.js'
import { EdgeText } from '../themed/EdgeText.js'
import { MainButton } from '../themed/MainButton.js'
import { SceneHeader } from '../themed/SceneHeader'
import { SelectableRow } from '../themed/SelectableRow'

type Props = {
  navigation: NavigationProp<'wcConnect'>,
  route: RouteProp<'wcConnect'>
}

export const WcConnectScene = (props: Props) => {
  const { navigation } = props
  const [selectedWallet, setSelectedWallet] = useState({ walletId: '', currencyCode: '' })
  const connected = useRef(false)
  const theme = useTheme()
  const styles = getStyles(theme)
  const { uri } = props.route.params
  const [dappDetails, setDappDetails] = useState({ subTitleText: '', bodyTitleText: '', dAppImage: '' })
  const [walletAddress, setWalletAddress] = useState('')

  const account = useSelector(state => state.core.account)
  const { walletName, wallet, currencyWallets } = useSelector(state => {
    const { currencyWallets } = state.core.account
    const guiWallet = getSelectedWallet(state)
    const wallet = currencyWallets[guiWallet.id]
    const walletName = guiWallet.name
    return {
      walletName,
      wallet,
      currencyWallets
    }
  })

  useEffect(() => {
    wallet.getReceiveAddress().then(r => setWalletAddress(r.publicAddress))
  }, [wallet])

  const dispatch = useDispatch()

  const handleConnect = async () => {
    try {
      await wallet.otherMethods.wcConnect(uri, walletAddress, wallet.id)
      connected.current = true
      Airship.show(bridge => <FlashNotification bridge={bridge} message={s.strings.wc_confirm_return_to_browser} onPress={() => {}} />)
      navigation.navigate('wcConnections')
    } catch (error) {
      console.error(`WalletConnect connection error: ${error.message}`)
    }
  }

  const handleRequestDapp = async walletId => {
    try {
      const dApp = await currencyWallets[walletId].otherMethods.wcInit({ uri })
      const dAppName = String(dApp.peerMeta.name).split(' ')[0]
      setDappDetails({
        subTitleText: sprintf(s.strings.wc_confirm_subtitle, dAppName),
        bodyTitleText: sprintf(s.strings.wc_confirm_body_title, dAppName),
        dAppImage: <FastImage style={styles.currencyLogo} source={{ uri: dApp.peerMeta.icons[0] }} />
      })
    } catch (e) {
      showError('Failed to connect, try again.')
      navigation.navigate('wcConnections')
    }
  }

  const showWalletListModal = () => {
    const allowedCurrencyWallets = Object.keys(currencyWallets).filter(walletId => currencyWallets[walletId]?.otherMethods?.wcConnect != null)

    const allowedAssets = allowedCurrencyWallets.map(walletID => ({ pluginId: currencyWallets[walletID].currencyInfo.pluginId }))
    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedAssets={allowedAssets} />).then(
      ({ walletId, currencyCode }: WalletListResult) => {
        if (walletId && currencyCode) {
          dispatch(selectWalletFromModal(walletId, currencyCode))
          setSelectedWallet({ walletId, currencyCode })
          if (dappDetails.subTitleText === '') {
            handleRequestDapp(walletId)
          }
        }
      }
    )
  }

  useEffect(() => {
    if (selectedWallet.walletId === '' && selectedWallet.currencyCode === '') {
      showWalletListModal()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWallet.walletId, selectedWallet.currencyCode])

  useEffect(() => {
    return () => {
      if (!connected.current && wallet?.otherMethods?.wcDisconnect != null) wallet.otherMethods.wcDisconnect(uri)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderWalletSelect = () => {
    if (selectedWallet.walletId === '' && selectedWallet.currencyCode === '') {
      return <SelectableRow arrowTappable paddingRem={[0, 1]} title={s.strings.wc_confirm_select_wallet} onPress={showWalletListModal} />
    } else {
      const walletNameStr = truncateString(walletName || '', MAX_ADDRESS_CHARACTERS)
      const walletImage = (
        <CurrencyIcon tokenId={getTokenId(account, wallet.currencyInfo.pluginId, selectedWallet.currencyCode)} walletId={selectedWallet.walletId} />
      )
      const walletAddressStr = truncateString(JSON.stringify(walletAddress), MAX_ADDRESS_CHARACTERS, true)
      return (
        <SelectableRow arrowTappable icon={walletImage} paddingRem={[0, 1]} subTitle={walletAddressStr} title={walletNameStr} onPress={showWalletListModal} />
      )
    }
  }

  const { subTitleText, bodyTitleText, dAppImage } = dappDetails
  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <SceneHeader underline title={s.strings.wc_confirm_title} />
      <ScrollView style={styles.container}>
        <View style={styles.listRow}>
          {dAppImage !== '' && dAppImage}
          <EdgeText style={styles.subTitle} numberOfLines={2}>
            {subTitleText}
          </EdgeText>
        </View>

        <EdgeText style={styles.bodyTitle}>{bodyTitleText}</EdgeText>
        <EdgeText style={styles.body}>{s.strings.wc_confirm_body}</EdgeText>
        <Card paddingRem={0} marginRem={[2.5, 0.5, 2]}>
          {renderWalletSelect()}
        </Card>
        {subTitleText !== '' && (
          <MainButton label={s.strings.wc_confirm_connect_button} type="secondary" marginRem={[3.5, 0.5]} onPress={handleConnect} alignSelf="center" />
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
    padding: theme.rem(0.5)
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
