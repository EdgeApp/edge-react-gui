import { EdgeCreateCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { createWallets, enableTokensAcrossWallets, PLACEHOLDER_WALLET_ID } from '../../actions/CreateWalletActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { splitCreateWalletItems, WalletCreateItem } from '../../selectors/getCreateWalletList'
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

  const flatListRef = React.useRef<FlatList<WalletCreateItem>>(null)

  // Create the wallets and enable the tokens
  useAsyncEffect(
    async () => {
      let tokenPromise: Promise<void> | undefined
      if (tokenKey != null) {
        tokenPromise = dispatch(enableTokensAcrossWallets(newTokenItems)).then(
          () => setItemStatus(currentState => ({ ...currentState, [newTokenItems[0].key]: 'complete' })),
          error => {
            showError(error)
            setItemStatus(currentState => ({ ...currentState, [newTokenItems[0].key]: 'error' }))
          }
        )
      }
      const walletResults = await createWallets(
        account,
        newWalletItems.map(
          (item): EdgeCreateCurrencyWallet => ({
            fiatCurrencyCode: `iso:${fiatCode}`,
            importText,
            keyOptions: keyOptions.get(item.pluginId),
            name: walletNames[item.key],
            walletType: item.walletType
          })
        )
      )

      for (let i = 0; i < walletResults.length; ++i) {
        const result = walletResults[i]
        if (!result.ok) {
          showError(result.error)
          setItemStatus(currentState => ({ ...currentState, [filteredCreateItemsForDisplay[i].key]: 'error' }))
        } else {
          const wallet = result.result
          // We created a wallet so let's update relevant pending tokens with the new walletId
          if (wallet != null) {
            newTokenItems
              .filter(item => item.pluginId === wallet.currencyInfo.pluginId && item.createWalletIds[0] === PLACEHOLDER_WALLET_ID)
              .forEach(item => (item.createWalletIds = [wallet.id]))
          }
          setItemStatus(currentState => ({ ...currentState, [filteredCreateItemsForDisplay[i].key]: 'complete' }))
        }
      }

      if (tokenPromise != null) await tokenPromise
      setDone(true)
      return () => {}
    },
    [],
    'CreateWalletCompletionComponent'
  )

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
      return <CreateWalletSelectCryptoRow tokenId={null} pluginId={item.pluginId} walletName={walletNames[item.key]} rightSide={renderStatus(item)} />
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
      <View style={styles.bottomButton}>
        <MainButton
          spinner={!done}
          disabled={!done}
          label={!done ? undefined : lstrings.string_done_cap}
          type="secondary"
          marginRem={[0, 0, 1]}
          onPress={() => navigation.navigate('walletsTab', { screen: 'walletList' })}
        />
      </View>
    )
  }, [done, navigation, styles.bottomButton])

  const keyExtractor = useHandler((item: WalletCreateItem) => item.key)

  return (
    <SceneWrapper>
      {({ insetStyle, undoInsetStyle }) => (
        <View style={{ ...undoInsetStyle, marginTop: 0 }}>
          <SceneHeader title={lstrings.title_create_wallets} withTopMargin />
          <FlatList
            automaticallyAdjustContentInsets={false}
            contentContainerStyle={{ ...insetStyle, paddingTop: 0, paddingBottom: insetStyle.paddingBottom + theme.rem(3.5) }}
            data={filteredCreateItemsForDisplay}
            fadingEdgeLength={10}
            keyExtractor={keyExtractor}
            extraData={itemStatus}
            ref={flatListRef}
            renderItem={renderRow}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          />
          {renderNextButton}
        </View>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  bottomButton: {
    alignSelf: 'center',
    bottom: theme.rem(1),
    position: 'absolute'
  }
}))

export const CreateWalletCompletionScene = React.memo(CreateWalletCompletionComponent)
