import * as React from 'react'
import { ListRenderItemInfo, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { createWallet, enableTokensAcrossWallets, getUniqueWalletName } from '../../actions/CreateWalletActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { splitCreateWalletItems, WalletCreateItem } from '../../selectors/getCreateWalletList'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { logEvent } from '../../util/tracking'
import { ButtonsView } from '../buttons/ButtonsView'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { EdgeText, Paragraph } from '../themed/EdgeText'
import { SceneHeader } from '../themed/SceneHeader'

export interface CreateWalletEditNameParams {
  createWalletList: WalletCreateItem[]
  splitSourceWalletId?: string
}

interface Props extends EdgeSceneProps<'createWalletEditName'> {}

const CreateWalletEditNameComponent = (props: Props) => {
  const { navigation, route } = props
  const { createWalletList, splitSourceWalletId } = route.params
  const isSplit = splitSourceWalletId != null

  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)
  const currencyWallets = useWatch(account, 'currencyWallets')

  const { newWalletItems, newTokenItems } = React.useMemo(() => splitCreateWalletItems(createWalletList), [createWalletList])

  const [walletNames, setWalletNames] = React.useState(() =>
    createWalletList.reduce<{ [key: string]: string }>((map, item) => {
      const maybeSplitFrom = isSplit ? ` (${sprintf(lstrings.split_from_1s, getWalletName(currencyWallets[splitSourceWalletId]))})` : ''
      map[item.key] = `${getUniqueWalletName(account, item.pluginId)}${maybeSplitFrom}`
      return map
    }, {})
  )

  const handleEditWalletName = useHandler(async (key: string, currentName: string) => {
    const newName = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        autoCorrect={false}
        bridge={bridge}
        initialValue={currentName}
        inputLabel={lstrings.fragment_wallets_rename_wallet}
        returnKeyType="go"
        title={lstrings.fragment_wallets_rename_wallet}
      />
    ))
    if (newName != null) setWalletNames({ ...walletNames, [key]: newName })
  })

  const handleCreate = useHandler(async () => {
    // If only creating one wallet, do it now and return to home screen
    if (newWalletItems.length === 1 && newTokenItems.length === 0) {
      const item = newWalletItems[0]
      try {
        await createWallet(account, {
          fiatCurrencyCode: defaultIsoFiat,
          keyOptions: item.keyOptions,
          name: walletNames[item.key],
          walletType: item.walletType
        })
        dispatch(logEvent('Create_Wallet_Success'))
      } catch (error: any) {
        showError(error)
        dispatch(logEvent('Create_Wallet_Failed', { error: String(error) }))
      }
      navigation.navigate('walletsTab', { screen: 'walletList' })
      return
    }
    // Any other combination goes to the completion scene
    navigation.navigate('createWalletCompletion', { createWalletList, walletNames })
  })

  const handleSplit = useHandler(async () => {
    if (splitSourceWalletId != null) {
      for (const item of newWalletItems) {
        try {
          const splitWalletId = await account.splitWalletInfo(splitSourceWalletId, account.currencyConfig[item.pluginId]?.currencyInfo.walletType)
          const splitWallet = await account.waitForCurrencyWallet(splitWalletId)
          await splitWallet.renameWallet(walletNames[item.key])
        } catch (error: unknown) {
          showError(error)
          break
        }
      }
      navigation.navigate('walletsTab', { screen: 'walletList' })
    }
  })

  const handleImport = useHandler(async () => {
    // Create copy that we can mutate
    const newWalletItemsCopy = [...newWalletItems]

    // Remove items that cannot be imported
    const importNotSupportedItems: WalletCreateItem[] = []
    for (let i = newWalletItemsCopy.length - 1; i >= 0; i--) {
      const { isImportKeySupported = false } = SPECIAL_CURRENCY_INFO[newWalletItemsCopy[i].pluginId] ?? {}
      if (!isImportKeySupported) {
        const removedItem = newWalletItemsCopy.splice(i, 1)
        importNotSupportedItems.push(removedItem[0])
      }
    }

    // Check if any remaining selected assets can be imported
    if (newWalletItemsCopy.length === 0 && newTokenItems.length === 0) {
      await Airship.show<'cancel' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={lstrings.create_wallet_failed_import_header}
          message={lstrings.create_wallet_all_disabled_import}
          buttons={{
            cancel: { label: lstrings.string_cancel_cap }
          }}
        />
      ))

      return
    }

    // If items remain that can be imported/enabled, show a warning that some assets will cannot be imported
    if (importNotSupportedItems.length > 0) {
      const displayNames = importNotSupportedItems.map(item => item.displayName).join(', ')
      const resolveValue = await Airship.show<'continue' | 'cancel' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={lstrings.create_wallet_failed_import_header}
          message={sprintf(lstrings.create_wallet_some_disabled_import, displayNames)}
          buttons={{
            continue: { label: lstrings.legacy_address_modal_continue },
            cancel: { label: lstrings.string_cancel_cap }
          }}
        />
      ))

      if (resolveValue === 'cancel' || resolveValue == null) {
        return
      }
    }

    // If all remaining create items are tokens just go enable them and return home
    if (newWalletItemsCopy.length === 0 && newTokenItems.length > 0) {
      await dispatch(enableTokensAcrossWallets(newTokenItems))
      navigation.navigate('walletsTab', { screen: 'walletList' })
      return
    }

    navigation.navigate('createWalletImport', { createWalletList: [...newWalletItemsCopy, ...newTokenItems], walletNames })
  })

  const renderCurrencyRow = useHandler((data: ListRenderItemInfo<WalletCreateItem>) => {
    const { key, pluginId, tokenId, walletType, createWalletIds } = data.item

    if (walletType != null) {
      // New mainchain wallet
      const walletName = walletNames[key]
      const chevron = <IonIcon size={theme.rem(1.5)} color={theme.iconTappable} name="chevron-forward-outline" />

      return (
        <CreateWalletSelectCryptoRow
          pluginId={pluginId}
          tokenId={tokenId}
          walletName={walletName}
          onPress={async () => await handleEditWalletName(key, walletName)}
          rightSide={chevron}
        />
      )
    } else if (createWalletIds != null && createWalletIds.length === 1 && createWalletIds[0] !== 'NEW_WALLET_UNIQUE_STRING') {
      // Token added to existing wallet
      const walletName = getWalletName(currencyWallets[createWalletIds[0]])

      return <CreateWalletSelectCryptoRow pluginId={pluginId} tokenId={tokenId} walletName={walletName} />
    } else {
      // Token added to new wallet
      const newWalletItem = createWalletList.find(item => item.pluginId === pluginId && item.walletType != null)
      if (newWalletItem == null) return null
      const walletName = walletNames[newWalletItem.key]

      return <CreateWalletSelectCryptoRow pluginId={pluginId} tokenId={tokenId} walletName={walletName} />
    }
  })

  const keyExtractor = useHandler((item: WalletCreateItem) => item.key)

  return (
    <SceneWrapper>
      <SceneHeader title={isSplit ? lstrings.fragment_wallets_split_wallet : lstrings.title_create_wallet} withTopMargin />
      <View style={styles.content}>
        {isSplit && <Paragraph marginRem={[0, 0.5, 1.5, 0.5]}>{lstrings.split_description}</Paragraph>}
        <EdgeText style={styles.instructionalText} numberOfLines={1}>
          {lstrings.fragment_create_wallet_instructions}
        </EdgeText>
        <FlatList
          automaticallyAdjustContentInsets={false}
          data={createWalletList}
          extraData={walletNames}
          keyExtractor={keyExtractor}
          renderItem={renderCurrencyRow}
          scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
        />
        {isSplit ? (
          <ButtonsView primary={{ label: lstrings.fragment_wallets_split_wallet, onPress: handleSplit }} />
        ) : (
          <ButtonsView
            primary={{ label: lstrings.title_create_wallets, onPress: handleCreate }}
            secondary={{ label: lstrings.create_wallet_imports_title, onPress: handleImport }}
          />
        )}
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  content: {
    flex: 1,
    margin: theme.rem(0.5),
    marginTop: theme.rem(0)
  },
  cryptoTypeLogo: {
    width: theme.rem(2),
    height: theme.rem(2),
    borderRadius: theme.rem(1),
    marginLeft: theme.rem(0.25)
  },
  instructionalText: {
    fontSize: theme.rem(0.75),
    color: theme.primaryText,
    paddingHorizontal: theme.rem(0.5),
    textAlign: 'left'
  }
}))

export const CreateWalletEditNameScene = React.memo(CreateWalletEditNameComponent)
