import { FlashList, ListRenderItem } from '@shopify/flash-list'
import * as React from 'react'
import { Keyboard, Switch, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { enableTokensAcrossWallets, MainWalletCreateItem, PLACEHOLDER_WALLET_ID, splitCreateWalletItems } from '../../actions/CreateWalletActions'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps, NavigationProp } from '../../types/routerTypes'
import { EdgeTokenId } from '../../types/types'
import { logEvent } from '../../util/tracking'
import { SceneWrapper } from '../common/SceneWrapper'
import { ListModal } from '../modals/ListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { EdgeText } from '../themed/EdgeText'
import { Fade } from '../themed/Fade'
import { MainButton } from '../themed/MainButton'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'
import { SceneHeader } from '../themed/SceneHeader'
import { filterWalletCreateItemListBySearchText, getCreateWalletList, WalletCreateItem } from '../themed/WalletList'
import { WalletListCurrencyRow } from '../themed/WalletListCurrencyRow'

export interface CreateWalletSelectCryptoParams {
  newAccountFlow?: (navigation: NavigationProp<'createWalletSelectCrypto' | 'createWalletSelectCryptoNewAccount'>, items: WalletCreateItem[]) => Promise<void>
  defaultSelection?: EdgeTokenId[]
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
    return createWalletList.reduce((map: { [key: string]: boolean }, item) => {
      const { key, pluginId, tokenId } = item
      map[key] = defaultSelection.find(edgeTokenId => edgeTokenId.pluginId === pluginId && edgeTokenId.tokenId === tokenId) != null
      if (item.walletType === 'wallet:bitcoin-bip44') map[key] = false // HACK: Make sure we don't select both bitcoin wallet choices
      if (item.walletType === 'wallet:litecoin-bip44') map[key] = false // HACK: Make sure we don't select both litecoin wallet choices
      return map
    }, {})
  })

  const [numSelected, setNumSelected] = React.useState(Object.values(selectedItems).filter(Boolean).length)

  const createMainnetItem = useHandler(pluginId => {
    const newItem = createWalletList.find(item => item.pluginId === pluginId)
    return newItem as MainWalletCreateItem
  })

  const handleCreateWalletToggle = useHandler((key: string) => {
    setSelectedItems({ ...selectedItems, [key]: !selectedItems[key] })

    // Update the count with the new value
    setNumSelected(!selectedItems[key] ? numSelected + 1 : numSelected - 1)
  })

  const handleNextPress = useHandler(async () => {
    if (numSelected === 0) {
      showError(lstrings.create_wallet_no_assets_selected)
      return
    }

    if (newAccountFlow != null) logEvent('Signup_Wallets_Selected_Next', { numSelectedWallets: numSelected })

    const createItems = createWalletList.filter(item => selectedItems[item.key])
    const { newWalletItems, newTokenItems } = splitCreateWalletItems(createItems)

    // Filter duplicates
    const uniquePluginIdList = newTokenItems.map(item => item.pluginId).filter((v, i, a) => a.findIndex(v2 => v2 === v) === i)
    for (const pluginId of uniquePluginIdList) {
      const existingWalletIds = [...(pluginIdWalletIdsMap[pluginId] ?? [])]

      // Determine if the user selected a new wallet for this pluginId.
      const newItem = createMainnetItem(pluginId)
      if (selectedItems[newItem.key]) {
        existingWalletIds.push(PLACEHOLDER_WALLET_ID)
      }

      if (existingWalletIds.length === 0) {
        // If the user hasn't selected the parent wallet to create, add it for them
        if (!newWalletItems.some(item => item.pluginId === pluginId)) {
          const newItem = createMainnetItem(pluginId)
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
                  walletName=""
                  onPress={() => {
                    bridge.resolve(PLACEHOLDER_WALLET_ID)
                  }}
                  rightSide={<EdgeText>{lstrings.create_wallet_choice_new_button_fragment}</EdgeText>}
                />
              )
            }

            const wallet = currencyWallets[walletId]
            return <WalletListCurrencyRow wallet={wallet} onPress={walletId => bridge.resolve(walletId)} />
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

  const renderCreateWalletRow: ListRenderItem<WalletCreateItem> = useHandler(item => {
    const { key, displayName, pluginId, tokenId } = item.item

    const accessibilityHint = sprintf(lstrings.create_wallet_hint, displayName)
    const toggle = (
      <Switch
        accessibilityRole="switch"
        accessibilityState={{ selected: selectedItems[key] }}
        accessibilityHint={accessibilityHint}
        ios_backgroundColor={theme.toggleButtonOff}
        trackColor={{
          false: theme.toggleButtonOff,
          true: theme.toggleButton
        }}
        value={selectedItems[key]}
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
      <Fade noFadeIn={defaultSelection.length > 0} visible={numSelected > 0} duration={300}>
        <View style={styles.bottomButton}>
          <MainButton label={lstrings.string_next_capitalized} type="primary" marginRem={[0, -0.5]} onPress={handleNextPress} alignSelf="center" />
        </View>
      </Fade>
    ),
    [defaultSelection, handleNextPress, numSelected, styles.bottomButton]
  )

  return (
    <SceneWrapper background="theme">
      {gap => (
        <View style={[styles.content, { marginBottom: -gap.bottom }]}>
          <SceneHeader title={lstrings.title_create_wallet_select_crypto} withTopMargin />
          <OutlinedTextInput
            autoCorrect={false}
            autoCapitalize="words"
            onChangeText={setSearchTerm}
            value={searchTerm}
            label={lstrings.wallet_list_wallet_search}
            marginRem={[0.5, 1]}
            searchIcon
            clearIcon
            blurOnClear={false}
            onClear={() => setSearchTerm('')}
            onSubmitEditing={handleSubmitEditing}
          />
          <FlashList
            automaticallyAdjustContentInsets={false}
            contentContainerStyle={{ paddingBottom: gap.bottom + theme.rem(4.25) }}
            data={filteredCreateWalletList}
            estimatedItemSize={theme.rem(4.25)}
            extraData={selectedItems}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            keyExtractor={keyExtractor}
            renderItem={renderCreateWalletRow}
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
  },
  content: {
    flex: 1
  }
}))

export const CreateWalletSelectCryptoScene = React.memo(CreateWalletSelectCryptoComponent)
