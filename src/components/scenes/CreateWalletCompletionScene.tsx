import { EdgeCreateCurrencyWallet, EdgeCurrencyWallet } from 'edge-core-js'
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
import { SceneButtons } from '../buttons/SceneButtons'
import { SceneWrapper } from '../common/SceneWrapper'
import { IconDataRow } from '../rows/IconDataRow'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { EdgeText } from '../themed/EdgeText'
import { SceneHeader } from '../themed/SceneHeader'
import { MigrateWalletItem } from './MigrateWalletSelectCryptoScene'

export interface CreateWalletCompletionParams {
  createWalletList: WalletCreateItem[]
  walletNames: { [key: string]: string }
  importText?: string
  keyOptions?: Map<string, { [opt: string]: string | undefined }>
}

interface Props extends EdgeSceneProps<'createWalletCompletion'> {}

const CreateWalletCompletionComponent = (props: Props) => {
  const { navigation, route } = props
  const { createWalletList, walletNames, keyOptions = new Map(), importText } = route.params

  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)

  const [done, setDone] = React.useState(false)
  const [wallets, setWallets] = React.useState<EdgeCurrencyWallet[]>([])

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
      // Create new wallets in parallel:
      const walletResults = await createWallets(
        account,
        newWalletItems.map(
          (item): EdgeCreateCurrencyWallet => ({
            enabledTokenIds: newTokenItems
              .filter(tokenItem => tokenItem.createWalletIds[0] === PLACEHOLDER_WALLET_ID && tokenItem.pluginId === item.pluginId)
              .map(tokenItem => tokenItem.tokenId),
            fiatCurrencyCode: defaultIsoFiat,
            importText,
            keyOptions: { ...item.keyOptions, ...keyOptions.get(item.pluginId) },
            name: walletNames[item.key],
            walletType: item.walletType
          })
        )
      )

      // Check the wallet results:
      for (let i = 0; i < walletResults.length; ++i) {
        const result = walletResults[i]
        if (!result.ok) {
          showError(result.error)
          setItemStatus(currentState => ({ ...currentState, [filteredCreateItemsForDisplay[i].key]: 'error' }))
        } else {
          // Wait for wallet creation
          await account.waitForCurrencyWallet(result.result.id)
          setItemStatus(currentState => ({ ...currentState, [filteredCreateItemsForDisplay[i].key]: 'complete' }))
        }
      }

      // Create tokens on existing wallets:
      if (tokenKey != null) {
        await dispatch(enableTokensAcrossWallets(newTokenItems)).then(
          () => setItemStatus(currentState => ({ ...currentState, [tokenKey]: 'complete' })),
          error => {
            showError(error)
            setItemStatus(currentState => ({ ...currentState, [tokenKey]: 'error' }))
          }
        )
      }

      // Save the created wallets
      setWallets(walletResults.filter((result): result is { ok: true; result: EdgeCurrencyWallet } => result.ok).map(result => result.result))

      setDone(true)
      return () => {}
    },
    [],
    'CreateWalletCompletionComponent'
  )

  // TODO: Clean up these hack styles.
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
      // Single row listing all tokens selected
      const tokenNameString = newTokenItems.map(item => item.currencyCode).join(', ')

      return (
        <IconDataRow
          marginRem={0.5}
          icon={<FontAwesome5 style={styles.tokenIcon} name="coins" size={theme.rem(2)} color={theme.iconTappable} />}
          leftText={lstrings.create_wallet_tokens}
          leftSubtext={
            <EdgeText style={styles.tokenNames} ellipsizeMode="tail">
              {tokenNameString}
            </EdgeText>
          }
          // HACK: Right justified icons are supported in
          // CreateWalletSelectCryptoRow, but not in IconDataRow. This View
          // lets the icon overflow outside of the top half of the component.
          rightText={<View>{renderStatus(item)}</View>}
        />
      )
    }
    return null
  })

  const handleNext = useHandler(() => navigation.navigate('walletsTab', { screen: 'walletList' }))

  const handleMigrate = useHandler(() => {
    // Transform filtered items into the structure expected by the migration component
    const migrateWalletList: MigrateWalletItem[] = newWalletItems.map(createWallet => {
      // Link the createWalletIds with the created wallets
      const { key, pluginId } = createWallet
      const wallet = wallets.find(wallet => wallet.currencyInfo.pluginId === pluginId)

      return {
        ...createWallet,
        createWalletIds: wallet == null ? [''] : [wallet.id],
        displayName: walletNames[key],
        key,
        type: 'create'
      }
    })

    // Navigate to the migration screen with the prepared list
    if (migrateWalletList.length > 0) {
      navigation.navigate('migrateWalletCalculateFee', {
        migrateWalletList
      })
    } else {
      showError('Unable to migrate imported wallets')
    }
  })

  const keyExtractor = useHandler((item: WalletCreateItem) => item.key)

  return (
    <SceneWrapper>
      {({ insetStyle, undoInsetStyle }) => (
        <View style={{ ...undoInsetStyle, marginTop: 0 }}>
          <SceneHeader title={lstrings.title_create_wallets} withTopMargin />
          <FlatList
            automaticallyAdjustContentInsets={false}
            contentContainerStyle={{
              ...insetStyle,
              paddingTop: 0,
              paddingBottom: insetStyle.paddingBottom + theme.rem(3.5),
              marginHorizontal: theme.rem(0.5)
            }}
            data={filteredCreateItemsForDisplay}
            fadingEdgeLength={10}
            keyExtractor={keyExtractor}
            extraData={itemStatus}
            ref={flatListRef}
            renderItem={renderRow}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          />

          <SceneButtons
            primary={{ label: lstrings.string_next_capitalized, disabled: !done, onPress: handleNext }}
            secondary={importText == null ? undefined : { label: lstrings.migrate_label, disabled: !done, onPress: handleMigrate }}
          />
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
  },
  tokenIcon: {
    marginRight: theme.rem(0.5)
  },
  tokenNames: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75)
  }
}))

export const CreateWalletCompletionScene = React.memo(CreateWalletCompletionComponent)
