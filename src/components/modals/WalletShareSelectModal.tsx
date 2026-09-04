import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { type ListRenderItem, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import { FlatList } from 'react-native-gesture-handler'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import type { WalletListAssetItem } from '../../types/types'
import { ModalButtons } from '../buttons/ModalButtons'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { WalletShareSelectRow } from '../rows/WalletShareSelectRow'
import { searchWalletList } from '../services/SortedWalletList'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { SharePartyText } from '../text/SharePartyText'
import { ModalTitle } from '../themed/ModalParts'
import { SimpleTextInput } from '../themed/SimpleTextInput'
import { EdgeModal } from './EdgeModal'

interface Props {
  /** Resolves to the chosen wallets in list order, or undefined on cancel. */
  bridge: AirshipBridge<EdgeCurrencyWallet[] | undefined>
  /** Who the wallets are going to, '' when they gave no name. */
  counterpartyName: string
}

/**
 * Multi-select wallet picker. Sharing is per wallet, not per token, so token
 * rows are dropped and one row means one wallet.
 */
export const WalletShareSelectModal: React.FC<Props> = props => {
  const { bridge, counterpartyName } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const sortedWalletList = useSelector(state => state.sortedWalletList)
  const [searchText, setSearchText] = React.useState('')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set()
  )

  const walletItems = React.useMemo<WalletListAssetItem[]>(() => {
    const mainnet = sortedWalletList.filter(
      (item): item is WalletListAssetItem =>
        item.type === 'asset' && item.tokenId == null
    )
    return searchWalletList(mainnet, searchText).filter(
      (item): item is WalletListAssetItem => item.type === 'asset'
    )
  }, [searchText, sortedWalletList])

  const handleCancel = useHandler(() => {
    bridge.resolve(undefined)
  })
  const handleSearchClear = useHandler(() => {
    setSearchText('')
  })
  const handleToggle = useHandler((walletId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(walletId)) next.delete(walletId)
      else next.add(walletId)
      return next
    })
  })
  const handleNext = useHandler(() => {
    // Resolve in list order, ignoring the search filter, so the next step
    // sees every selection even if the user searched between taps:
    const wallets: EdgeCurrencyWallet[] = []
    for (const item of sortedWalletList) {
      if (item.type !== 'asset' || item.tokenId != null) continue
      if (selectedIds.has(item.wallet.id)) wallets.push(item.wallet)
    }
    bridge.resolve(wallets)
  })

  const renderRow: ListRenderItem<WalletListAssetItem> = useHandler(
    ({ item }) => (
      <WalletShareSelectRow
        wallet={item.wallet}
        selected={selectedIds.has(item.wallet.id)}
        onPress={handleToggle}
      />
    )
  )

  return (
    <EdgeModal
      bridge={bridge}
      title={
        <View style={styles.header}>
          <ModalTitle>
            <SharePartyText
              template={lstrings.wallet_share_select_title_1s}
              name={counterpartyName}
              fallbackTemplate={lstrings.wallet_share_select_title}
            />
          </ModalTitle>
          <SimpleTextInput
            aroundRem={0.5}
            returnKeyType="search"
            placeholder={lstrings.search_wallets}
            onChangeText={setSearchText}
            onClear={handleSearchClear}
            value={searchText}
            iconComponent={SearchIconAnimated}
          />
        </View>
      }
      onCancel={handleCancel}
    >
      <FlatList
        data={walletItems}
        extraData={selectedIds}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={keyExtractor}
        renderItem={renderRow}
      />
      <ModalButtons
        primary={{
          label: lstrings.string_next_capitalized,
          disabled: selectedIds.size === 0,
          onPress: handleNext
        }}
      />
    </EdgeModal>
  )
}

const keyExtractor = (item: WalletListAssetItem): string => item.key

const getStyles = cacheStyles((theme: Theme) => ({
  header: {
    flexGrow: 1,
    flexShrink: 1
  }
}))
