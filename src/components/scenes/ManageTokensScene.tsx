import type { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, SectionList, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'

import { useHandler } from '../../hooks/useHandler'
import { useRowLayout } from '../../hooks/useRowLayout'
import {
  useServerTokens,
  useServerTokenSearch
} from '../../hooks/useServerTokens'
import { useWalletName } from '../../hooks/useWalletName'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import type { FlatListItem } from '../../types/types'
import {
  changeEnabledTokenIds,
  getWalletName
} from '../../util/CurrencyWalletHelpers'
import { logActivity } from '../../util/logger'
import { serverTokenToEdgeToken } from '../../util/tokenService'
import { normalizeForSearch } from '../../util/utils'
import { ButtonsView } from '../buttons/ButtonsView'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { CryptoIcon } from '../icons/CryptoIcon'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { DividerLine } from '../themed/DividerLine'
import { EdgeText } from '../themed/EdgeText'
import { FilledTextInput } from '../themed/FilledTextInput'
import { ManageTokensRow } from '../themed/ManageTokensRow'
import { SceneHeader } from '../themed/SceneHeader'
import { Title } from '../themed/Title'
import { WalletListSectionHeader } from '../themed/WalletListSectionHeader'

/**
 * walletId: ID of the wallet whose tokens we are managing
 * newTokenIds: We routed from a notification that was triggered from detecting
 * these new tokenIds having nonzero balance. Show these at the top of the list.
 */
export interface ManageTokensParams {
  walletId: string
  newTokenIds?: string[]
}

interface Section {
  title: string
  data: string[]
}

interface Props extends EdgeAppSceneProps<'manageTokens'> {
  wallet: EdgeCurrencyWallet
}

const ManageTokensSceneComponent: React.FC<Props> = props => {
  const { navigation, route, wallet } = props
  const { newTokenIds } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)
  const walletName = useWalletName(wallet)

  const [searchValue, setSearchValue] = React.useState('')

  const pluginId = wallet.currencyInfo.pluginId

  // Memoize pluginIds array to prevent infinite loops
  const pluginIdsArray = React.useMemo(() => [pluginId], [pluginId])

  // Subscribe to the account's token lists:
  const { currencyConfig } = wallet
  const customTokens = useWatch(currencyConfig, 'customTokens')

  // Fetch server tokens for this chain
  const {
    tokens: serverTokens,
    loading: serverLoading,
    loadMore: loadMoreServerTokens,
    hasMore: hasMoreServerTokens
  } = useServerTokens({ pluginIds: pluginIdsArray })

  // Search server tokens when user types
  const { tokens: searchResults } = useServerTokenSearch({
    searchTerm: searchValue,
    pluginIds: pluginIdsArray
  })

  // Subscribe to the wallet's enabled tokens:
  const enabledTokenIds = useWatch(wallet, 'enabledTokenIds')

  // Track pending changes locally (only saved on explicit save):
  const [pendingEnabledTokenIds, setPendingEnabledTokenIds] = React.useState(
    () => new Set(enabledTokenIds)
  )

  // Merge token sources: customTokens + serverTokens + searchResults (avoiding duplicates)
  const mergedTokens = React.useMemo(() => {
    const tokens: Record<string, EdgeToken> = { ...customTokens }

    for (const serverToken of [...serverTokens, ...searchResults]) {
      if (tokens[serverToken.tokenId] == null) {
        try {
          tokens[serverToken.tokenId] = serverTokenToEdgeToken(serverToken)
        } catch (error) {
          // Silently skip invalid tokens
        }
      }
    }

    return tokens
  }, [customTokens, serverTokens, searchResults])

  // Baseline for change detection (updated for external additions):
  const [baselineSet, setBaselineSet] = React.useState(
    () => new Set(enabledTokenIds)
  )

  // Baseline for sorting (fixed on mount, never changes):
  const sortingBaselineSet = React.useMemo(
    () => new Set(enabledTokenIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Check if there are unsaved changes:
  const hasUnsavedChanges = React.useMemo(() => {
    if (pendingEnabledTokenIds.size !== baselineSet.size) return true
    for (const tokenId of pendingEnabledTokenIds) {
      if (!baselineSet.has(tokenId)) return true
    }
    return false
  }, [pendingEnabledTokenIds, baselineSet])

  // Track unsaved changes in a ref for the beforeRemove listener:
  const hasUnsavedChangesRef = React.useRef(hasUnsavedChanges)
  hasUnsavedChangesRef.current = hasUnsavedChanges

  // Ref to track if we're allowing navigation (after save or discard):
  const allowNavigationRef = React.useRef(false)

  // Ref to store the pending navigation action for modal handlers:
  const pendingActionRef = React.useRef<{ type: string } | null>(null)

  // Sync externally-added tokens into pending state and baseline:
  React.useEffect(() => {
    const toAdd: string[] = []
    for (const tokenId of enabledTokenIds) {
      if (!baselineSet.has(tokenId)) {
        toAdd.push(tokenId)
      }
    }
    if (toAdd.length > 0) {
      // Update baseline so externally-added tokens don't count as unsaved:
      setBaselineSet(prev => {
        const next = new Set(prev)
        for (const tokenId of toAdd) next.add(tokenId)
        return next
      })
      // Also add to pending state:
      setPendingEnabledTokenIds(prev => {
        const next = new Set(prev)
        for (const tokenId of toAdd) next.add(tokenId)
        return next
      })
    }
  }, [enabledTokenIds, baselineSet])

  // Sort the token list (only re-sort when mergedTokens changes, not on toggle):
  const sortedTokenIds = React.useMemo(() => {
    return Object.keys(mergedTokens).sort((id1, id2) => {
      const token1 = mergedTokens[id1]
      const token2 = mergedTokens[id2]

      // Use sorting baseline for stable ordering during session
      const isToken1Enabled = sortingBaselineSet.has(id1)
      const isToken2Enabled = sortingBaselineSet.has(id2)

      // Sort enabled tokens first
      if (isToken1Enabled && !isToken2Enabled) return -1
      if (!isToken1Enabled && isToken2Enabled) return 1

      // Finally, sort by currency code
      if (token1.currencyCode < token2.currencyCode) return -1
      if (token1.currencyCode > token2.currencyCode) return 1
      return 0
    })
  }, [mergedTokens, sortingBaselineSet])

  // Filter the list of tokens based on the search term:
  const filteredTokenIds = React.useMemo(() => {
    if (searchValue.length === 0) {
      return sortedTokenIds
    }

    // Build set of matching tokenIds from search results
    const searchResultIds = new Set(searchResults.map(t => t.tokenId))

    // Filter to tokens that match search (either in merged or search results)
    const target = normalizeForSearch(searchValue)
    const filtered = sortedTokenIds.filter(tokenId => {
      if (searchResultIds.has(tokenId)) return true
      const token = mergedTokens[tokenId]
      const currencyCode = normalizeForSearch(token.currencyCode)
      const displayName = normalizeForSearch(token.displayName)
      return currencyCode.includes(target) || displayName.includes(target)
    })
    return filtered
  }, [mergedTokens, searchValue, sortedTokenIds, searchResults])

  // Split the list of tokens based on if there were auto-detected tokens given
  const autoDetectedTokenIds = React.useMemo(
    () =>
      newTokenIds != null
        ? filteredTokenIds.filter(filteredTokenId =>
            newTokenIds.includes(filteredTokenId)
          )
        : [],
    [filteredTokenIds, newTokenIds]
  )

  const extraData = React.useMemo(
    () => ({ mergedTokens, pendingEnabledTokenIds, customTokens }),
    [mergedTokens, pendingEnabledTokenIds, customTokens]
  )

  const sectionList = React.useMemo<Section[] | null>(() => {
    if (autoDetectedTokenIds.length === 0) {
      return null // Non-sectioned list off raw tokenIds
    } else {
      return [
        {
          title: lstrings.managetokens_detected_tokens_header,
          data: autoDetectedTokenIds
        },
        {
          title: lstrings.managetokens_all_tokens_header,

          // Omit the auto-detected tokens we're already showing above
          data: filteredTokenIds.filter(
            filteredTokenId => !autoDetectedTokenIds.includes(filteredTokenId)
          )
        }
      ]
    }
  }, [autoDetectedTokenIds, filteredTokenIds])

  const handleItemLayout = useRowLayout()

  // Load more server tokens when reaching the end of the list
  const handleEndReached = useHandler(() => {
    if (!serverLoading && hasMoreServerTokens) {
      loadMoreServerTokens()
    }
  })

  // Goes to the add token scene:
  const handleAdd = useHandler(() => {
    navigation.navigate('editToken', {
      walletId: wallet.id
    })
  })

  // Toggle a token's enabled state locally:
  const handleToggle = useHandler((tokenId: string) => {
    setPendingEnabledTokenIds(prev => {
      const next = new Set(prev)
      if (next.has(tokenId)) {
        next.delete(tokenId)
      } else {
        next.add(tokenId)
      }
      return next
    })
  })

  // Save token changes to the wallet (without navigating):
  const doSave = useHandler(async () => {
    // Calculate delta from baseline state:
    const enabledTokens: string[] = []
    const disabledTokens: string[] = []
    for (const tokenId of pendingEnabledTokenIds) {
      if (!baselineSet.has(tokenId)) {
        enabledTokens.push(tokenId)
      }
    }
    for (const tokenId of baselineSet) {
      if (!pendingEnabledTokenIds.has(tokenId)) {
        disabledTokens.push(tokenId)
      }
    }

    // Log activity for changed tokens:
    const walletName = getWalletName(wallet)
    for (const tokenId of enabledTokens) {
      logActivity(
        `Enable Token: ${walletName} ${wallet.type} ${wallet.id} ${tokenId}`
      )
    }
    for (const tokenId of disabledTokens) {
      logActivity(
        `Disable Token: ${walletName} ${wallet.type} ${wallet.id} ${tokenId}`
      )
    }

    await changeEnabledTokenIds(Array.from(pendingEnabledTokenIds), wallet)
  })

  // Save and navigate back:
  const handleSave = useHandler(async () => {
    await doSave()
    allowNavigationRef.current = true
    navigation.goBack()
  })

  // Modal save handler - saves, navigates, and dismisses:
  const handleModalSave = useHandler(async (): Promise<boolean> => {
    await doSave()
    allowNavigationRef.current = true
    if (pendingActionRef.current != null) {
      navigation.dispatch(pendingActionRef.current)
    }
    return true
  })

  // Intercept back navigation when there are unsaved changes:
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (!hasUnsavedChangesRef.current || allowNavigationRef.current) return

      // Prevent default behavior of leaving the screen:
      e.preventDefault()

      // Store the navigation action for modal handlers:
      pendingActionRef.current = e.data.action

      // Show the unsaved changes modal:
      Airship.show<'save' | 'discard' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={lstrings.unsaved_changes_title}
          message={lstrings.unsaved_changes_message}
          buttons={{
            save: { label: lstrings.string_save, onPress: handleModalSave },
            discard: { label: lstrings.unsaved_changes_discard }
          }}
        />
      ))
        .then(result => {
          // Handle discard (save is handled by onPress):
          if (result === 'discard') {
            allowNavigationRef.current = true
            if (pendingActionRef.current != null) {
              navigation.dispatch(pendingActionRef.current)
            }
          }
        })
        .catch(() => {})
    })

    return unsubscribe
  }, [handleModalSave, navigation])

  // Renders an individual token row within the list:
  const renderRow = useHandler((item: FlatListItem<string>) => {
    const tokenId = item.item
    return (
      <ManageTokensRow
        // Scene stuff:
        navigation={navigation}
        wallet={wallet}
        // Token stuff:
        isCustom={customTokens[tokenId]?.isUserCreated === true}
        isEnabled={pendingEnabledTokenIds.has(tokenId)}
        token={mergedTokens[tokenId]}
        tokenId={tokenId}
        // Callbacks:
        onToggle={handleToggle}
      />
    )
  })

  // Render a section header
  const renderSectionHeader = useHandler((section: { section: Section }) => {
    return <WalletListSectionHeader title={section.section.title} />
  })

  return (
    <SceneWrapper>
      <SceneHeader underline>
        <Title
          leftIcon={
            <CryptoIcon
              sizeRem={1.5}
              tokenId={null}
              pluginId={wallet.currencyInfo.pluginId}
            />
          }
          text={walletName}
        />
        <EdgeText style={styles.subTitle}>
          {lstrings.managetokens_top_instructions}
        </EdgeText>
        <FilledTextInput
          topRem={1}
          placeholder={lstrings.search_tokens}
          returnKeyType="search"
          iconComponent={SearchIconAnimated}
          value={searchValue}
          onChangeText={setSearchValue}
        />
      </SceneHeader>
      {sectionList == null ? (
        <FlatList
          data={filteredTokenIds}
          extraData={extraData}
          keyExtractor={keyExtractor}
          renderItem={renderRow}
          style={styles.list}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            serverLoading ? <ActivityIndicator style={styles.loader} /> : null
          }
        />
      ) : (
        <SectionList
          getItemLayout={handleItemLayout}
          extraData={extraData}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          renderItem={renderRow}
          renderSectionHeader={renderSectionHeader}
          sections={sectionList}
          style={styles.sectionList}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            serverLoading ? <ActivityIndicator style={styles.loader} /> : null
          }
        />
      )}
      <>
        <DividerLine marginRem={[0, 1]} />
        {/* TODO: Create a layout enum in ButtonsViewUi4 for this persistent button area */}
        <View style={styles.buttonsContainer}>
          <ButtonsView
            primary={{
              label: lstrings.string_save,
              onPress: handleSave,
              disabled: !hasUnsavedChanges
            }}
            secondary={
              wallet.currencyInfo.customTokenTemplate == null
                ? undefined
                : { label: lstrings.addtoken_add, onPress: handleAdd }
            }
            layout="column"
          />
        </View>
      </>
    </SceneWrapper>
  )
}

const keyExtractor = (tokenId: string): string => tokenId

const getStyles = cacheStyles((theme: Theme) => ({
  buttonsContainer: { marginTop: theme.rem(1), marginBottom: theme.rem(1) },
  list: {
    marginHorizontal: theme.rem(0.5)
  },
  rightIcon: {
    color: theme.iconTappable,
    marginRight: theme.rem(1)
  },
  subTitle: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.85)
  },
  sectionList: {
    marginTop: theme.rem(1),
    marginHorizontal: theme.rem(0.5)
  },
  loader: {
    marginVertical: theme.rem(1)
  }
}))

export const ManageTokensScene = withWallet(ManageTokensSceneComponent)
