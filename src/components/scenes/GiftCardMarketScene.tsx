import { useQuery } from '@tanstack/react-query'
import * as React from 'react'
import type { ListRenderItem } from 'react-native'
import { ScrollView, StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated from 'react-native-reanimated'

import { showCountrySelectionModal } from '../../actions/CountryListActions'
import {
  isGiftCardBrandDisabled,
  isGiftCardProviderDisabled
} from '../../actions/GiftCardInfoActions'
import { readSyncedSettings } from '../../actions/SettingsActions'
import { EDGE_CONTENT_SERVER_URI } from '../../constants/CdnConstants'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { guiPlugins } from '../../constants/plugins/GuiPlugins'
import { ENV } from '../../env'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useGiftCardProvider } from '../../hooks/useGiftCardProvider'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { getCachedBrandsSync } from '../../plugins/gift-cards/phazeGiftCardCache'
import type { PhazeGiftCardBrand } from '../../plugins/gift-cards/phazeGiftCardTypes'
import type { FooterRender } from '../../state/SceneFooterState'
import { useSceneScrollHandler } from '../../state/SceneScrollState'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { debugLog } from '../../util/logger'
import { CountryButton } from '../buttons/RegionButton'
import { AlertCardUi4 } from '../cards/AlertCard'
import { EdgeCard } from '../cards/EdgeCard'
import { GiftCardTile } from '../cards/GiftCardTile'
import { CircularBrandIcon } from '../common/CircularBrandIcon'
import { EdgeAnim } from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { GridIcon, ListIcon } from '../icons/ThemedIcons'
import { SceneContainer } from '../layout/SceneContainer'
import { normalizeCategory } from '../modals/GiftCardSearchModal'
import { FillLoader } from '../progress-indicators/FillLoader'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { SearchFooter } from '../themed/SearchFooter'

type ViewMode = 'grid' | 'list'

// Internal constant for "All" category comparison - display uses lstrings.string_all
const CATEGORY_ALL = 'All'

// Provider IDs used as keys in the info-server giftCardInfo.disablePlugins map.
// Phaze supports per-brand granularity (keyed by productId); Bitrefill is a
// webview, so only whole-provider disabling applies.
const PHAZE_PLUGIN_ID = 'phaze'
const BITREFILL_PLUGIN_ID = 'bitrefill'

/**
 * Formats a normalized category for display:
 * - Replaces dashes with " & "
 * - Capitalizes first letter of each word
 */
const formatCategoryDisplay = (category: string): string => {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' & ')
}

interface MarketItem {
  brandName: string
  priceRange: string
  productId: number
  productImage: string
  categories: string[]
  isBitrefill?: boolean
}

/**
 * Formats a price range string from brand data.
 * - Variable range: shows "min - max" format
 * - Fixed denominations: shows comma-separated list
 */
const formatPriceRange = (brand: PhazeGiftCardBrand): string => {
  const { currency, valueRestrictions, denominations } = brand
  const { minVal, maxVal } = valueRestrictions

  // Variable range - show min to max
  if (minVal != null && maxVal != null) {
    return `${minVal} - ${maxVal} ${currency}`
  }

  // Fixed denominations - show comma-separated list
  if (denominations.length > 0) {
    const sorted = [...denominations].sort((a, b) => a - b)
    return `${sorted.join(', ')} ${currency}`
  }

  return currency
}

// Bitrefill partner option shown at end of results
const BITREFILL_ITEM: MarketItem = {
  brandName: 'Bitrefill',
  priceRange: lstrings.gift_card_more_options,
  productId: -999,
  productImage: `${EDGE_CONTENT_SERVER_URI}/bitrefill.png`,
  categories: [],
  isBitrefill: true
}

interface Props extends EdgeAppSceneProps<'giftCardMarket'> {}

export const GiftCardMarketScene: React.FC<Props> = props => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  // Get user's current country code (specific selector to avoid re-renders on other setting changes)
  const countryCode = useSelector(state => state.ui.settings.countryCode)
  const account = useSelector(state => state.core.account)
  const isConnected = useSelector(state => state.network.isConnected)

  // Info-server remote enable/disable config for gift card providers
  const giftCardDisablePlugins = useSelector(
    state => state.ui.giftCardInfo.disablePlugins
  )

  // Provider (requires API key configured)
  const phazeConfig = ENV.PLUGIN_API_KEYS?.phaze
  const { provider, isReady } = useGiftCardProvider({
    account,
    apiKey: phazeConfig?.apiKey ?? '',
    baseUrl: phazeConfig?.baseUrl ?? ''
  })

  // Cache for gift card brands (accessed via provider)
  const cache = provider?.getCache()

  // Initialize items from memory cache synchronously to avoid flash of loader
  // Use getCachedBrandsSync since provider is null on initial render
  const [items, setItems] = React.useState<MarketItem[] | null>(() => {
    const cached = getCachedBrandsSync(countryCode)
    if (cached != null) {
      return cached.map(brand => ({
        brandName: brand.brandName,
        priceRange: formatPriceRange(brand),
        productId: brand.productId,
        productImage: brand.productImage,
        categories: brand.categories
      }))
    }
    return null
  })

  // Search state
  const [searchText, setSearchText] = React.useState('')
  const [isSearching, setIsSearching] = React.useState(false)
  const [footerHeight, setFooterHeight] = React.useState<number | undefined>()

  // Category filter state
  const [selectedCategory, setSelectedCategory] = React.useState(CATEGORY_ALL)

  // View mode state (grid or list)
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid')

  const handleScroll = useSceneScrollHandler()

  // Fallback check for deep links or other direct navigation to this scene
  // without going through navigateToGiftCards helper
  useAsyncEffect(
    async () => {
      if (countryCode !== '') return

      await dispatch(
        showCountrySelectionModal({
          account,
          countryCode: '',
          skipStateProvince: true
        })
      )
      // Re-read from synced settings to determine if user actually selected
      const synced = await readSyncedSettings(account)
      if ((synced.countryCode ?? '') === '') {
        navigation.goBack()
      }
    },
    [],
    'GiftCardMarketScene:countryCheck'
  )

  // Helper to map brand response to MarketItem
  const mapBrandsToItems = React.useCallback(
    (brands: PhazeGiftCardBrand[]): MarketItem[] =>
      brands.map(brand => ({
        brandName: brand.brandName,
        priceRange: formatPriceRange(brand),
        productId: brand.productId,
        productImage: brand.productImage,
        categories: brand.categories
      })),
    []
  )

  // Helper to update UI state from brands
  const updateFromBrands = React.useCallback(
    (brands: PhazeGiftCardBrand[]): void => {
      setItems(mapBrandsToItems(brands))
    },
    [mapBrandsToItems]
  )

  // If the user changes country while on this scene, clear the current list so
  // we don't briefly show stale brands from the previous country:
  const prevCountryCodeRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    // Skip initial mount so we don't wipe synchronous cache state:
    if (
      prevCountryCodeRef.current != null &&
      prevCountryCodeRef.current !== countryCode
    ) {
      setItems(null)
      setSelectedCategory(CATEGORY_ALL)
      setSearchText('')
      setIsSearching(false)
    }
    prevCountryCodeRef.current = countryCode
  }, [countryCode])

  // Fetch brands. Initial data comes from synchronous cache read in useState.
  // Adding isConnected to enabled so the query auto-retries when connectivity
  // returns after being offline.
  const { data: apiBrands, isError: isBrandsError } = useQuery({
    queryKey: ['phazeBrands', countryCode, isReady],
    queryFn: async () => {
      if (provider == null || cache == null) {
        throw new Error('Provider not ready')
      }

      // 1. Try disk cache first (for cold start)
      const diskCached = await cache.loadFromDisk(countryCode)
      if (diskCached != null) {
        debugLog('phaze', 'Using disk cache:', diskCached.length, 'brands')
        // Return disk cache immediately, but continue to fetch fresh data
      }

      // 2. Fetch all brands with minimal fields (fast) → immediate display
      debugLog('phaze', 'Fetching all gift cards for:', countryCode)
      const allBrands = await provider.getMarketBrands(countryCode)
      debugLog('phaze', 'Got', allBrands.length, 'brands for display')

      // 3. Background: Fetch all brands with full data (for purchase scene)
      debugLog('phaze', 'Fetching full brand data in background...')
      provider
        .getFullGiftCards({ countryCode })
        .then(fullResponse => {
          debugLog(
            'phaze',
            'Got',
            fullResponse.brands.length,
            'brands with full details'
          )
          const fullDetailIds = new Set(
            fullResponse.brands.map(b => b.productId)
          )
          cache.setBrands(countryCode, fullResponse.brands, fullDetailIds)
          cache.saveToDisk(countryCode).catch(() => {})
        })
        .catch(() => {})

      return allBrands
    },
    enabled: isConnected && isReady && provider != null && countryCode !== '',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 1
  })

  // Update items when API data arrives
  React.useEffect(() => {
    if (apiBrands != null) {
      updateFromBrands(apiBrands)
    }
  }, [apiBrands, updateFromBrands])

  // Remove phaze brands disabled by the info server, either because the whole
  // phaze provider is disabled or because the brand's productId is listed.
  const enabledItems = React.useMemo(() => {
    if (items == null) return null
    return items.filter(
      item =>
        !isGiftCardBrandDisabled(
          giftCardDisablePlugins,
          PHAZE_PLUGIN_ID,
          String(item.productId)
        )
    )
  }, [items, giftCardDisablePlugins])

  // Build the category list from the enabled items only, so a category whose
  // brands are all disabled by the info server does not show a chip that leads
  // to an empty grid. "All" comes first, then the categories alphabetized.
  const categoryList = React.useMemo(() => {
    const normalizedSet = new Set<string>()
    if (enabledItems != null) {
      for (const item of enabledItems) {
        for (const category of item.categories) {
          normalizedSet.add(normalizeCategory(category))
        }
      }
    }
    return [CATEGORY_ALL, ...Array.from(normalizedSet).sort()]
  }, [enabledItems])

  // If the selected category is no longer available (e.g. all of its brands
  // became disabled by the info server on a later refresh), fall back to "All"
  // so the grid is not left stuck on an empty selection.
  React.useEffect(() => {
    if (
      selectedCategory !== CATEGORY_ALL &&
      !categoryList.includes(selectedCategory)
    ) {
      setSelectedCategory(CATEGORY_ALL)
    }
  }, [categoryList, selectedCategory])

  // Filter items by search text and category
  const filteredItems = React.useMemo(() => {
    if (enabledItems == null) return null

    let filtered = enabledItems

    // Filter by category (unless "All" is selected, which shows all)
    if (selectedCategory !== CATEGORY_ALL) {
      filtered = filtered.filter(item =>
        item.categories.some(cat => normalizeCategory(cat) === selectedCategory)
      )
    }

    // Filter by search text
    if (searchText.trim() !== '') {
      const lowerQuery = searchText.toLowerCase()
      filtered = filtered.filter(item =>
        item.brandName.toLowerCase().includes(lowerQuery)
      )
    }

    return filtered
  }, [enabledItems, searchText, selectedCategory])

  const handleItemPress = useHandler((item: MarketItem) => {
    if (provider == null) return
    const brand = provider.getCachedBrand(countryCode, item.productId)
    if (brand == null) {
      debugLog('phaze', 'Brand not found for productId:', item.productId)
      return
    }
    debugLog('phaze', 'Navigating to purchase for:', item.brandName)
    navigation.navigate('giftCardPurchase', { brand })
  })

  const handleBitrefillPress = useHandler(() => {
    navigation.navigate('pluginView', {
      plugin: guiPlugins.bitrefill
    } as any)
  })

  const handleCategoryPress = useHandler((category: string) => {
    setSelectedCategory(category)
  })

  const handleToggleViewMode = useHandler(() => {
    setViewMode(prev => (prev === 'grid' ? 'list' : 'grid'))
  })

  const handleStartSearching = useHandler(() => {
    setIsSearching(true)
  })

  const handleDoneSearching = useHandler(() => {
    setSearchText('')
    setIsSearching(false)
  })

  const handleChangeText = useHandler((value: string) => {
    setSearchText(value)
  })

  const handleFooterLayoutHeight = useHandler((height: number) => {
    setFooterHeight(height)
  })

  const renderGridItem: ListRenderItem<MarketItem> = React.useCallback(
    ({ item }) => {
      const handlePress = (): void => {
        if (item.isBitrefill === true) {
          handleBitrefillPress()
        } else {
          handleItemPress(item)
        }
      }
      return (
        <View style={styles.tileContainer}>
          <GiftCardTile
            brandName={item.brandName}
            priceRange={item.priceRange}
            imageUrl={item.productImage}
            onPress={handlePress}
          />
        </View>
      )
    },
    [handleBitrefillPress, handleItemPress, styles.tileContainer]
  )

  const renderListItem: ListRenderItem<MarketItem> = React.useCallback(
    ({ item }) => {
      const handlePress = (): void => {
        if (item.isBitrefill === true) {
          handleBitrefillPress()
        } else {
          handleItemPress(item)
        }
      }

      return (
        <EdgeCard
          icon={<CircularBrandIcon imageUrl={item.productImage} />}
          onPress={handlePress}
        >
          <View style={styles.listTextContainer}>
            <EdgeText
              style={styles.listBrandName}
              numberOfLines={1}
              disableFontScaling
            >
              {item.brandName}
            </EdgeText>
            <EdgeText style={styles.listPriceRange} numberOfLines={1}>
              {item.priceRange}
            </EdgeText>
          </View>
        </EdgeCard>
      )
    },
    [
      handleBitrefillPress,
      handleItemPress,
      styles.listBrandName,
      styles.listPriceRange,
      styles.listTextContainer
    ]
  )

  const renderItem = viewMode === 'grid' ? renderGridItem : renderListItem

  const keyExtractor = React.useCallback(
    (item: MarketItem, index: number): string => `${item.productId}-${index}`,
    []
  )

  const handleRegionSelect = useHandler(() => {
    dispatch(
      showCountrySelectionModal({
        account,
        countryCode,
        skipStateProvince: true
      })
    ).catch(() => {})
  })

  const renderFooter: FooterRender = React.useCallback(
    sceneWrapperInfo => {
      return (
        <SearchFooter
          name="GiftCardMarketScene-SearchFooter"
          placeholder={lstrings.search_gift_cards}
          isSearching={isSearching}
          searchText={searchText}
          sceneWrapperInfo={sceneWrapperInfo}
          onFocus={handleStartSearching}
          onCancel={handleDoneSearching}
          onChangeText={handleChangeText}
          onLayoutHeight={handleFooterLayoutHeight}
        />
      )
    },
    [
      handleChangeText,
      handleDoneSearching,
      handleFooterLayoutHeight,
      handleStartSearching,
      isSearching,
      searchText
    ]
  )

  // Build list data: filtered items + Bitrefill option at end (unless the
  // Bitrefill provider is remotely disabled)
  const listData = React.useMemo(() => {
    const base = filteredItems ?? []
    if (
      isGiftCardProviderDisabled(giftCardDisablePlugins, BITREFILL_PLUGIN_ID)
    ) {
      return base
    }
    return [...base, BITREFILL_ITEM]
  }, [filteredItems, giftCardDisablePlugins])

  return (
    <SceneWrapper
      avoidKeyboard
      footerHeight={footerHeight}
      renderFooter={renderFooter}
    >
      {({ insetStyle, undoInsetStyle }) => (
        <SceneContainer
          undoInsetStyle={undoInsetStyle}
          headerTitle={lstrings.title_gift_card_market}
          headerTitleChildren={<CountryButton onPress={handleRegionSelect} />}
        >
          {items == null && isBrandsError ? (
            <AlertCardUi4
              type="warning"
              title={
                isConnected
                  ? lstrings.gift_card_service_error
                  : lstrings.gift_card_network_error
              }
            />
          ) : items == null ? (
            <FillLoader />
          ) : (
            <>
              <View style={styles.categoryRow}>
                {categoryList.length > 1 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScrollView}
                    contentContainerStyle={[
                      styles.categoryContainer,
                      {
                        paddingLeft: insetStyle.paddingLeft + theme.rem(0.25)
                      }
                    ]}
                  >
                    {categoryList.map((category, index) => {
                      const isSelected = selectedCategory === category
                      const displayName =
                        category === CATEGORY_ALL
                          ? lstrings.string_all
                          : formatCategoryDisplay(category)
                      return (
                        <EdgeAnim
                          key={category}
                          enter={{
                            type: 'fadeInRight',
                            distance: 20,
                            delay: index * 30
                          }}
                        >
                          <EdgeTouchableOpacity
                            style={styles.categoryButton}
                            onPress={() => {
                              handleCategoryPress(category)
                            }}
                          >
                            <EdgeText
                              style={
                                isSelected
                                  ? styles.categoryTextSelected
                                  : styles.categoryText
                              }
                              disableFontScaling
                            >
                              {displayName}
                            </EdgeText>
                          </EdgeTouchableOpacity>
                        </EdgeAnim>
                      )
                    })}
                  </ScrollView>
                ) : (
                  <View style={styles.categoryScrollView} />
                )}
                <EdgeTouchableOpacity
                  style={[
                    styles.viewToggleButton,
                    { marginRight: insetStyle.paddingRight + theme.rem(0.5) }
                  ]}
                  onPress={handleToggleViewMode}
                >
                  <LinearGradient
                    style={styles.viewToggleGradient}
                    colors={theme.secondaryButton}
                    end={theme.secondaryButtonColorEnd}
                    start={theme.secondaryButtonColorStart}
                  />
                  {viewMode === 'grid' ? (
                    <ListIcon size={theme.rem(1)} color={theme.primaryText} />
                  ) : (
                    <GridIcon size={theme.rem(1)} color={theme.primaryText} />
                  )}
                </EdgeTouchableOpacity>
              </View>
              <Animated.FlatList
                key={viewMode}
                contentContainerStyle={{
                  paddingTop: 0,
                  paddingLeft: insetStyle.paddingLeft + theme.rem(0.5),
                  paddingRight: insetStyle.paddingRight + theme.rem(0.5),
                  // Ensure the last item can scroll above the SearchFooter:
                  paddingBottom: insetStyle.paddingBottom + theme.rem(0.5)
                }}
                data={listData}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                numColumns={viewMode === 'grid' ? 2 : 1}
                keyboardDismissMode="on-drag"
                onScroll={handleScroll}
                scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
              />
            </>
          )}
        </SceneContainer>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.rem(0.5),
    marginRight: theme.rem(0.5)
  },
  categoryScrollView: {
    flexGrow: 1,
    flexShrink: 1
  },
  categoryContainer: {
    paddingRight: theme.rem(1)
  },
  categoryButton: {
    paddingHorizontal: theme.rem(0.5),
    paddingVertical: theme.rem(0.25)
  },
  categoryText: {
    color: theme.primaryText
  },
  categoryTextSelected: {
    color: theme.iconTappable
  },
  viewToggleButton: {
    width: theme.rem(2),
    height: theme.rem(2),
    borderRadius: theme.rem(1),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  viewToggleGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.rem(1)
  },
  tileContainer: {
    width: '50%'
  },
  // List view styles
  listTextContainer: {
    flexGrow: 1,
    flexShrink: 1,
    marginLeft: theme.rem(0.5)
  },
  listBrandName: {
    fontSize: theme.rem(1),
    color: theme.primaryText
  },
  listPriceRange: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))
