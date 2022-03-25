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
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { WalletPickerModal } from '../modals/WalletPickerModal.js'
import { FlashNotification } from '../navigation/FlashNotification.js'
import { Airship, showError } from '../services/AirshipInstance'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { Card } from '../themed/Card'
import { EdgeText } from '../themed/EdgeText.js'
import { MainButton } from '../themed/MainButton.js'
import { SceneHeader } from '../themed/SceneHeader'
import { SelectableRow } from '../themed/SelectableRow'

type Props = {
  navigation: NavigationProp<'wcConnect'>,
  route: RouteProp<'wcConnect'>
}

// Replaces extra chars with '...' either in the middle or end of the input string
export const truncateString = (input: string | number, maxLength: number, isMidTrunc?: boolean = false) => {
  const inputStr = typeof input !== 'string' ? String(input) : input
  const strLen = inputStr.length
  if (strLen >= maxLength) {
    const delimStr = s.strings.util_truncate_delimeter
    if (isMidTrunc) {
      const segmentLen = Math.round(maxLength / 2)
      const seg1 = inputStr.slice(0, segmentLen)
      const seg2 = inputStr.slice(-1 * segmentLen)
      return seg1 + delimStr + seg2
    } else {
      return inputStr.slice(0, maxLength) + delimStr
    }
  } else {
    return inputStr
  }
}

export const WcConnectScene = (props: Props) => {
  const { navigation } = props
  const [selectedWallet, setSelectedWallet] = useState({ walletId: '', currencyCode: '' })
  const connected = useRef(false)
  const theme = useTheme()
  const styles = getStyles(theme)
  const { uri } = props.route.params
  const [dappDetails, setDappDetails] = useState({ subTitleText: '', bodyTitleText: '', dAppImage: '' })

  const { walletAddress, walletImageUri, walletName, wallet, currencyWallets } = useSelector(state => {
    const { currencyWallets } = state.core.account
    const guiWallet = getSelectedWallet(state)
    const wallet = currencyWallets[guiWallet.id]
    const { pluginId, metaTokens } = wallet.currencyInfo
    const walletCurrencyCode = state.ui.wallets.selectedCurrencyCode
    const contractAddress = metaTokens.find(token => token.currencyCode === walletCurrencyCode)?.contractAddress
    const walletImageUri = getCurrencyIcon(pluginId, contractAddress).symbolImage
    const walletName = guiWallet.name
    const walletAddress = guiWallet.receiveAddress.publicAddress
    return {
      walletAddress,
      walletImageUri,
      walletName,
      wallet,
      currencyWallets
    }
  })
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
    Airship.show(bridge => (
      <WalletPickerModal bridge={bridge} headerTitle={s.strings.select_wallet} filterWallet={wallet => wallet.otherMethods?.wcConnect != null} />
    ))
      .then(({ walletId, currencyCode }) => {
        if (walletId && currencyCode) {
          dispatch(selectWalletFromModal(walletId, currencyCode))
          setSelectedWallet({ walletId, currencyCode })
          if (dappDetails.subTitleText === '') {
            handleRequestDapp(walletId)
          }
        }
      })
      .catch(showError)
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
      return <SelectableRow onPress={showWalletListModal} title={s.strings.wc_confirm_select_wallet} arrowTappable />
    } else {
      const walletNameStr = truncateString(walletName || '', MAX_ADDRESS_CHARACTERS)
      const walletImage = <FastImage style={styles.currencyLogo} source={{ uri: walletImageUri }} />
      const walletAddressStr = truncateString(JSON.stringify(walletAddress), MAX_ADDRESS_CHARACTERS, true)
      return <SelectableRow onPress={showWalletListModal} icon={walletImage} title={walletNameStr} subTitle={walletAddressStr} arrowTappable />
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
    width: theme.rem(2),
    resizeMode: 'contain'
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
