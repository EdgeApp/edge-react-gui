import * as React from 'react'
import { Keyboard, ListRenderItemInfo, Switch, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import { enableTokensAcrossWallets, PLACEHOLDER_WALLET_ID } from '../../actions/CreateWalletActions'
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
import { EdgeSceneProps, NavigationProp } from '../../types/routerTypes'
import { EdgeAsset } from '../../types/types'
import { logEvent } from '../../util/tracking'
import { SceneWrapper } from '../common/SceneWrapper'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { ListModal } from '../modals/ListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { EdgeText } from '../themed/EdgeText'
import { Fade } from '../themed/Fade'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'
import { SimpleTextInput } from '../themed/SimpleTextInput'
import { WalletListCurrencyRow } from '../themed/WalletListCurrencyRow'

export interface CreateWalletSelectCryptoParams {
  newAccountFlow?: (navigation: NavigationProp<'createWalletSelectCrypto' | 'createWalletSelectCryptoNewAccount'>, items: WalletCreateItem[]) => Promise<void>
  defaultSelection?: EdgeAsset[]
}

interface Props extends EdgeSceneProps<'createWalletSelectCrypto' | 'createWalletSelectCryptoNewAccount'> {}

const CreateWalletSelectCryptoComponent = (props: Props) => {
  const { navigation, route } = props
  const { newAccountFlow, defaultSelection = [] } = route.params

  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

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

  const createWalletList = React.useMemo(() => {
    const createList = getCreateWalletList(account)
    const preselectedList: WalletCreateItem[] = []
    for (const edgeTokenId of defaultSelection) {
      const i = createList.findIndex(item => item.pluginId === edgeTokenId.pluginId && item.tokenId === edgeTokenId.tokenId)
      preselectedList.push(createList.splice(i, 1)[0])
    }
    return [...preselectedList, ...createList]
  }, [account, defaultSelection])

  const filteredCreateWalletList = React.useMemo(
    () => filterWalletCreateItemListBySearchText(createWalletList, searchTerm.toLowerCase()),
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

  const handleCreateWalletToggle = useHandler((key: string) => {
    setSelectedItems(state => {
      const copy = new Set(state)
      if (copy.has(key)) copy.delete(key)
      else copy.add(key)
      return copy
    })
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
      navigation.push('createWalletSelectFiat', { createWalletList: newList })
    } else {
      // Otherwise enable the tokens and return to the main scene.
      await dispatch(enableTokensAcrossWallets(newTokenItems))
      navigation.navigate('walletsTab', { screen: 'walletList' })
    }
  })

  const handleSubmitEditing = useHandler(() => {
    Keyboard.dismiss()
  })

  const renderCreateWalletRow = useHandler((item: ListRenderItemInfo<WalletCreateItem>) => {
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
        onValueChange={() => handleCreateWalletToggle(key)}
      />
    )

    return (
      <CreateWalletSelectCryptoRow
        pluginId={pluginId}
        tokenId={tokenId}
        walletName={displayName}
        onPress={() => handleCreateWalletToggle(key)}
        rightSide={toggle}
      />
    )
  })

  const keyExtractor = useHandler((item: WalletCreateItem) => item.key)

  const renderNextButton = React.useMemo(
    () => (
      <Fade noFadeIn={defaultSelection.length > 0} visible={selectedItems.size > 0} duration={300}>
        <View style={styles.bottomButton}>
          <MainButton label={lstrings.string_next_capitalized} type="primary" marginRem={[0, 0, 1]} onPress={handleNextPress} />
        </View>
      </Fade>
    ),
    [defaultSelection, handleNextPress, selectedItems, styles.bottomButton]
  )

  return (
    <SceneWrapper>
      {({ insetStyle, undoInsetStyle }) => (
        <View style={{ ...undoInsetStyle, marginTop: 0 }}>
          <SceneHeader title={lstrings.title_create_wallet_select_crypto} withTopMargin />
          <SimpleTextInput
            vertical={0.5}
            horizontal={1}
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
            contentContainerStyle={{ ...insetStyle, paddingTop: 0, paddingBottom: insetStyle.paddingBottom + theme.rem(3.5) }}
            data={filteredCreateWalletList}
            extraData={selectedItems}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            keyExtractor={keyExtractor}
            renderItem={renderCreateWalletRow}
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

export const CreateWalletSelectCryptoScene = React.memo(CreateWalletSelectCryptoComponent)
