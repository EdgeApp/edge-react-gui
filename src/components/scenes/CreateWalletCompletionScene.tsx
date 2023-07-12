import { FlashList } from '@shopify/flash-list'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { createWallet, enableTokensAcrossWallets, PLACEHOLDER_WALLET_ID, splitCreateWalletItems } from '../../actions/CreateWalletActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { IconDataRow } from '../data/row/IconDataRow'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'
import { WalletCreateItem } from '../themed/WalletList'

export interface CreateWalletCompletionParams {
  createWalletList: WalletCreateItem[]
  walletNames: { [key: string]: string }
  fiatCode: string
  importText?: string
  keyOptions?: Map<string, { [opt: string]: string | undefined }>
}

interface Props extends EdgeSceneProps<'createWalletCompletion'> {}

const CreateWalletCompletionComponent = (props: Props) => {
  const { navigation, route } = props
  const { createWalletList, walletNames, fiatCode, keyOptions = new Map(), importText } = route.params

  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)

  const [done, setDone] = React.useState(false)

  const { newWalletItems, newTokenItems } = React.useMemo(() => splitCreateWalletItems(createWalletList), [createWalletList])

  // We only want to render a single token row so we'll take the first one, if present, and use it in the renderRow logic and itemStatus map
  const tokenKey: string | undefined = newTokenItems[0]?.key

  const walletPromises = React.useMemo<Array<() => Promise<EdgeCurrencyWallet>>>(() => {
    return newWalletItems.map(item => {
      return async () =>
        await createWallet(account, {
          walletType: item.walletType,
          walletName: walletNames[item.key],
          fiatCurrencyCode: `iso:${fiatCode}`,
          keyOptions: keyOptions.get(item.pluginId),
          importText
        })
    })
  }, [account, fiatCode, importText, keyOptions, newWalletItems, walletNames])

  const tokenPromise = React.useMemo(() => {
    return async () => await dispatch(enableTokensAcrossWallets(newTokenItems))
  }, [dispatch, newTokenItems])

  // Mainnet wallets first followed by our single token item, if necessary
  const filteredCreateItemsForDisplay = React.useMemo(() => {
    const items: WalletCreateItem[] = [...newWalletItems]
    if (newTokenItems.length > 0) {
      items.push(newTokenItems[0])
    }
    return items
  }, [newWalletItems, newTokenItems])

  // State to manage row status icons
  const [itemStatus, setItemStatus] = React.useState(() =>
    filteredCreateItemsForDisplay.reduce((map: { [key: string]: 'pending' | 'complete' | 'error' }, item) => {
      map[item.key] = 'pending'
      return map
    }, {})
  )

  const flatListRef = React.useRef<FlashList<WalletCreateItem>>(null)

  // Create the wallets and enable the tokens
  useAsyncEffect(async () => {
    const promises: Array<(() => Promise<EdgeCurrencyWallet>) | (() => Promise<void>)> = [...walletPromises]
    if (tokenKey != null) promises.push(tokenPromise)

    for (const [i, promise] of promises.entries()) {
      try {
        const wallet = await promise()
        // We created a wallet so let's Update relevant pending tokens with the new walletId
        if (wallet != null) {
          newTokenItems
            .filter(item => item.pluginId === wallet.currencyInfo.pluginId && item.createWalletIds[0] === PLACEHOLDER_WALLET_ID)
            .forEach(item => (item.createWalletIds = [wallet.id]))
        }
        setItemStatus(currentState => ({ ...currentState, [filteredCreateItemsForDisplay[i].key]: 'complete' }))
      } catch (e) {
        showError(e)
        setItemStatus(currentState => ({ ...currentState, [filteredCreateItemsForDisplay[i].key]: 'error' }))
      }

      flatListRef.current?.scrollToIndex({ animated: true, index: i, viewPosition: 0.5 })
    }
    setDone(true)

    return () => {}
  }, [])

  const renderStatus = useHandler((item: WalletCreateItem) => {
    let icon = <ActivityIndicator style={{ paddingRight: theme.rem(0.3125) }} color={theme.iconTappable} />
    if (itemStatus[item.key] === 'complete') icon = <IonIcon name="checkmark-circle-outline" size={theme.rem(1.5)} color={theme.iconTappable} />
    if (itemStatus[item.key] === 'error')
      icon = <IonIcon name="warning-outline" style={{ paddingRight: theme.rem(0.0625) }} size={theme.rem(1.5)} color={theme.dangerText} />
    return icon
  })

  const renderRow = useHandler(({ item }) => {
    if (item.walletType != null) {
      // Mainnet
      return <CreateWalletSelectCryptoRow pluginId={item.pluginId} walletName={walletNames[item.key]} rightSide={renderStatus(item)} />
    } else if (item.key === tokenKey) {
      // Single token row
      const tokenNameString = newTokenItems.map(item => item.currencyCode).join(', ')
      return (
        <IconDataRow
          marginRem={[1, 0.5, 0, 1]}
          icon={<FontAwesome5 name="coins" size={theme.rem(2)} color={theme.iconTappable} />}
          leftText={lstrings.create_wallet_tokens}
          leftSubtext={
            <EdgeText style={{ color: theme.secondaryText, fontSize: theme.rem(0.75) }} ellipsizeMode="tail">
              {tokenNameString}
            </EdgeText>
          }
          rightText={<View>{renderStatus(item)}</View>}
        />
      )
    }
    return null
  })

  const renderNextButton = React.useMemo(() => {
    return (
      <MainButton
        spinner={!done}
        disabled={!done}
        label={!done ? undefined : lstrings.string_done_cap}
        type="secondary"
        marginRem={[1]}
        onPress={() => navigation.navigate('walletsTab', { screen: 'walletList' })}
        alignSelf="center"
      />
    )
  }, [done, navigation])

  const keyExtractor = useHandler((item: WalletCreateItem) => item.key)

  return (
    <SceneWrapper background="theme">
      {gap => (
        <View style={[styles.content, { marginBottom: -gap.bottom }]}>
          <SceneHeader title={lstrings.title_create_wallets} withTopMargin />
          <FlashList
            automaticallyAdjustContentInsets={false}
            contentContainerStyle={{ paddingTop: theme.rem(0.5), paddingBottom: gap.bottom }}
            data={filteredCreateItemsForDisplay}
            estimatedItemSize={theme.rem(4.25)}
            fadingEdgeLength={10}
            keyExtractor={keyExtractor}
            extraData={itemStatus}
            ref={flatListRef}
            renderItem={renderRow}
            scrollEnabled={done}
          />
          {renderNextButton}
        </View>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  content: {
    flex: 1
  }
}))

export const CreateWalletCompletionScene = React.memo(CreateWalletCompletionComponent)
