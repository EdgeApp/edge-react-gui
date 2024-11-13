import * as React from 'react'
import { Keyboard, ListRenderItemInfo, Switch, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import { enableTokensAcrossWallets, PLACEHOLDER_WALLET_ID } from '../../actions/CreateWalletActions'
import { approveTokenTerms } from '../../actions/TokenTermsActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import {
  filterWalletCreateItemListBySearchText,
  getCreateWalletList,
  MainWalletCreateItem,
  splitCreateWalletItems,
  WalletCreateItem
} from '../../selectors/getCreateWalletList'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps, NavigationBase } from '../../types/routerTypes'
import { EdgeAsset } from '../../types/types'
import { logEvent } from '../../util/tracking'
import { EdgeButton } from '../buttons/EdgeButton'
import { SceneButtons } from '../buttons/SceneButtons'
import { EdgeAnim } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { ListModal } from '../modals/ListModal'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { EdgeText } from '../themed/EdgeText'
import { SceneHeader } from '../themed/SceneHeader'
import { SimpleTextInput } from '../themed/SimpleTextInput'
import { WalletListCurrencyRow } from '../themed/WalletListCurrencyRow'

export interface CreateWalletSelectCryptoParams {
  newAccountFlow?: (
    navigation: EdgeAppSceneProps<'createWalletSelectCrypto' | 'createWalletSelectCryptoNewAccount'>['navigation'],
    items: WalletCreateItem[]
  ) => Promise<void>
  defaultSelection?: EdgeAsset[]
  disableLegacy?: boolean
  splitPluginIds?: string[]
  splitSourceWalletId?: string
}

interface Props extends EdgeAppSceneProps<'createWalletSelectCrypto' | 'createWalletSelectCryptoNewAccount'> {}

const CreateWalletSelectCryptoComponent = (props: Props) => {
  const { navigation, route } = props
  const { newAccountFlow, defaultSelection = [], disableLegacy = false, splitPluginIds = [], splitSourceWalletId } = route.params

  const dispatch = useDispatch()
  const theme = useTheme()

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')

  const pluginIdWalletIdsMap = React.useMemo(
    () =>
      Object.keys(currencyWallets).reduce((map: { [key: string]: string[] }, walletId) => {
        const { pluginId } = currencyWallets[walletId].currencyInfo
        if (map[pluginId] == null) map[pluginId] = [walletId]
        else map[pluginId].push(walletId)
        return map
      }, {}),
    [currencyWallets]
  )
  const [searchTerm, setSearchTerm] = React.useState('')

  const allowedAssets = splitPluginIds.length > 0 ? splitPluginIds.map(pluginId => ({ pluginId, tokenId: null })) : undefined
  const createList = getCreateWalletList(account, { allowedAssets, disableLegacy })

  const createWalletList = React.useMemo(() => {
    const preselectedList: WalletCreateItem[] = []
    for (const edgeTokenId of defaultSelection) {
      const i = createList.findIndex(item => item.pluginId === edgeTokenId.pluginId && item.tokenId === edgeTokenId.tokenId)
      if (i === -1) continue
      preselectedList.push(createList.splice(i, 1)[0])
    }
    return [...preselectedList, ...createList]
  }, [createList, defaultSelection])

  const filteredCreateWalletList = React.useMemo(
    () => [...filterWalletCreateItemListBySearchText(createWalletList, searchTerm.toLowerCase()), null],
    [createWalletList, searchTerm]
  )

  const [selectedItems, setSelectedItems] = React.useState(() => {
    const out = new Set<string>()
    for (const asset of defaultSelection) {
      const item = createWalletList.find(item => item.pluginId === asset.pluginId && item.tokenId === asset.tokenId)
      if (item != null) out.add(item.key)
    }
    return out
  })

  const findMainnetItem = (pluginId: string): MainWalletCreateItem => {
    const newItem = createWalletList.find(item => item.pluginId === pluginId)
    return newItem as MainWalletCreateItem
  }

  const handleCreateWalletToggle = useHandler(async (key: string) => {
    setSelectedItems(state => {
      const copy = new Set(state)
      if (copy.has(key)) {
        copy.delete(key)
      } else {
        copy.add(key)
      }
      return copy
    })

    // Check if this is a token to potentially show the gas requirement warning
    const newAsset = createWalletList.find(item => item.key === key)
    if (newAsset != null && newAsset.tokenId != null) {
      await approveTokenTerms(account, newAsset.pluginId)
    }
  })

  const handleNextPress = useHandler(async () => {
    if (selectedItems.size === 0) {
      showError(lstrings.create_wallet_no_assets_selected)
      return
    }

    if (newAccountFlow != null) dispatch(logEvent('Signup_Wallets_Selected_Next', { numSelectedWallets: selectedItems.size }))

    const createItems = createWalletList.filter(item => selectedItems.has(item.key))
    const { newWalletItems, newTokenItems } = splitCreateWalletItems(createItems)

    // Filter duplicates
    const uniquePluginIdList = newTokenItems.map(item => item.pluginId).filter((v, i, a) => a.findIndex(v2 => v2 === v) === i)
    for (const pluginId of uniquePluginIdList) {
      const existingWalletIds = [...(pluginIdWalletIdsMap[pluginId] ?? [])]

      // Determine if the user selected a new wallet for this pluginId.
      const newItem = findMainnetItem(pluginId)
      if (selectedItems.has(newItem.key)) {
        existingWalletIds.push(PLACEHOLDER_WALLET_ID)
      }

      if (existingWalletIds.length === 0) {
        // If the user hasn't selected the parent wallet to create, add it for them
        if (!newWalletItems.some(item => item.pluginId === pluginId)) {
          const newItem = findMainnetItem(pluginId)
          newWalletItems.push(newItem)
        }
        newTokenItems.forEach(item => {
          if (item.pluginId === pluginId) {
            item.createWalletIds = [PLACEHOLDER_WALLET_ID]
          }
        })
      } else if (existingWalletIds.length === 1) {
        // Automatically associate new tokens with existing wallet
        newTokenItems.forEach(item => {
          if (item.pluginId === pluginId) {
            item.createWalletIds = existingWalletIds
          }
        })
      } else {
        // Prompt user to choose a wallet
        const selectedWalletId = await Airship.show<string | undefined>(bridge => {
          const renderRow = (walletId: string) => {
            if (walletId === PLACEHOLDER_WALLET_ID) {
              return (
                <CreateWalletSelectCryptoRow
                  pluginId={pluginId}
                  tokenId={null}
                  walletName=""
                  onPress={() => {
                    bridge.resolve(PLACEHOLDER_WALLET_ID)
                  }}
                  rightSide={<EdgeText>{lstrings.create_wallet_choice_new_button_fragment}</EdgeText>}
                />
              )
            }

            const wallet = currencyWallets[walletId]
            return <WalletListCurrencyRow wallet={wallet} tokenId={null} onPress={walletId => bridge.resolve(walletId)} />
          }

          const displayNames = newTokenItems
            .filter(item => item.pluginId === pluginId)
            .map(item => item.displayName)
            .join(', ')
          return (
            <ListModal<string>
              bridge={bridge}
              title={lstrings.select_wallet}
              message={sprintf(lstrings.create_wallet_select_wallet_for_assets, displayNames)}
              textInput={false}
              fullScreen={false}
              rowComponent={renderRow}
              rowsData={existingWalletIds}
            />
          )
        })

        // Return to list if user cancelled the modal
        if (selectedWalletId == null) return

        // Update tokens with selected walletId
        newTokenItems.forEach(item => {
          if (item.pluginId === pluginId) {
            item.createWalletIds = [selectedWalletId]
          }
        })
      }
    }

    const newList = [...newWalletItems, ...newTokenItems]
      .sort((a, b) => (a.pluginId < b.pluginId ? 1 : -1)) // Sort alphabetically by pluginId
      .sort((a, b) => (a.pluginId === b.pluginId && (a.tokenId ?? '') > (b.tokenId ?? '') ? 1 : -1)) // Sort tokens below mainnet wallets

    if (newAccountFlow != null) {
      // This scene is used when an account is just created. Allow the initialization method to define what needs to be done.
      await newAccountFlow(navigation, newList)
    } else if (newWalletItems.length > 0) {
      // Navigate to the fiat/name change scene if new wallets are being created.
      navigation.push('createWalletEditName', { createWalletList: newList, splitSourceWalletId })
    } else {
      // Otherwise enable the tokens and return to the main scene.
      await dispatch(enableTokensAcrossWallets(newTokenItems))
      navigation.navigate('edgeTabs', { screen: 'walletsTab', params: { screen: 'walletList' } })
    }
  })

  const handleAddCustomTokenPress = useHandler(async () => {
    const allowedCreateAssets = createList
      .filter(createItem => createItem.tokenId === null && Object.keys(account.currencyConfig[createItem.pluginId].builtinTokens).length > 0)
      .map(filteredCreateItem => ({
        pluginId: filteredCreateItem.pluginId,
        tokenId: null
      }))

    const walletListResult = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={props.navigation as NavigationBase}
        headerTitle={lstrings.choose_custom_token_wallet}
        allowedAssets={allowedCreateAssets}
        showCreateWallet
      />
    ))
    if (walletListResult?.type === 'wallet') {
      const { walletId } = walletListResult
      navigation.navigate('editToken', {
        walletId
      })
    }
  })

  const handleSubmitEditing = useHandler(() => {
    Keyboard.dismiss()
  })

  const renderRow = useHandler((item: ListRenderItemInfo<WalletCreateItem | null>) => {
    // Render the bottom button
    if (item.item === null) {
      if (splitSourceWalletId != null) return null
      return (
        <EdgeAnim
          visible={selectedItems.size === 0}
          enter={{ type: 'fadeIn', duration: selectedItems.size === 0 ? 0 : 300 }}
          exit={{ type: 'fadeOut', duration: 300 }}
        >
          <EdgeButton type="secondary" label={lstrings.add_custom_token} onPress={handleAddCustomTokenPress} marginRem={0.5} />
        </EdgeAnim>
      )
    }

    const { key, displayName, pluginId, tokenId } = item.item

    const accessibilityHint = sprintf(lstrings.create_wallet_hint, displayName)
    const selected = selectedItems.has(key)
    const toggle = (
      <Switch
        accessibilityRole="switch"
        accessibilityState={{ selected }}
        accessibilityHint={accessibilityHint}
        ios_backgroundColor={theme.toggleButtonOff}
        trackColor={{
          false: theme.toggleButtonOff,
          true: theme.toggleButton
        }}
        value={selected}
        onValueChange={async () => await handleCreateWalletToggle(key)}
      />
    )

    return (
      <CreateWalletSelectCryptoRow
        pluginId={pluginId}
        tokenId={tokenId}
        walletName={displayName}
        onPress={async () => await handleCreateWalletToggle(key)}
        rightSide={toggle}
      />
    )
  })

  const keyExtractor = useHandler((item: WalletCreateItem | null) => (item === null ? 'customToken' : item.key))

  const renderNextButton = React.useMemo(
    () => (
      <EdgeAnim
        visible={selectedItems.size > 0}
        enter={{ type: 'fadeIn', duration: defaultSelection.length > 0 ? 0 : 300 }}
        exit={{ type: 'fadeOut', duration: 300 }}
        accessible={false}
      >
        <SceneButtons primary={{ label: lstrings.string_next_capitalized, onPress: handleNextPress }} absolute />
      </EdgeAnim>
    ),
    [defaultSelection.length, handleNextPress, selectedItems.size]
  )

  return (
    <SceneWrapper avoidKeyboard>
      {({ insetStyle, undoInsetStyle }) => (
        <View style={{ ...undoInsetStyle, marginTop: 0 }}>
          <SceneHeader
            title={splitSourceWalletId == null ? lstrings.title_create_wallet_select_crypto : lstrings.title_create_wallet_from_seed}
            withTopMargin
          />
          <SimpleTextInput
            verticalRem={0.5}
            horizontalRem={1}
            autoCorrect={false}
            autoCapitalize="words"
            onChangeText={setSearchTerm}
            value={searchTerm}
            placeholder={lstrings.wallet_list_wallet_search}
            iconComponent={SearchIconAnimated}
            blurOnClear={false}
            onClear={() => setSearchTerm('')}
            onSubmitEditing={handleSubmitEditing}
          />
          <FlatList
            automaticallyAdjustContentInsets={false}
            contentContainerStyle={{
              ...insetStyle,
              paddingTop: 0,
              paddingBottom: insetStyle.paddingBottom + theme.rem(5),
              marginHorizontal: theme.rem(0.5)
            }}
            data={filteredCreateWalletList}
            extraData={selectedItems}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            keyExtractor={keyExtractor}
            renderItem={renderRow}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          />
          {renderNextButton}
        </View>
      )}
    </SceneWrapper>
  )
}

export const CreateWalletSelectCryptoScene = React.memo(CreateWalletSelectCryptoComponent)
