import * as React from 'react'
import type { ListRenderItem } from 'react-native'
import { ScrollView, StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated from 'react-native-reanimated'

import { showCountrySelectionModal } from '../../actions/CountryListActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { ENV } from '../../env'
import { useGiftCardProvider } from '../../hooks/useGiftCardProvider'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import {
  makePhazeGiftCardCache,
  type PhazeGiftCardCache
} from '../../plugins/gift-cards/phazeGiftCardCache'
import type { PhazeGiftCardBrand } from '../../plugins/gift-cards/phazeGiftCardTypes'
import type { FooterRender } from '../../state/SceneFooterState'
import { useSceneScrollHandler } from '../../state/SceneScrollState'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { CountryButton } from '../buttons/RegionButton'
import { EdgeCard } from '../cards/EdgeCard'
import { GiftCardTile } from '../cards/GiftCardTile'
import { CircularBrandIcon } from '../common/CircularBrandIcon'
import { EdgeAnim } from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { GridIcon, ListIcon } from '../icons/ThemedIcons'
import { SceneContainer } from '../layout/SceneContainer'
import { normalizeCategory } from '../modals/GiftCardSearchModal'
import { ShimmerCard } from '../progress-indicators/ShimmerCard'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { SearchFooter } from '../themed/SearchFooter'

type ViewMode = 'grid' | 'list'

// Internal constant for "All" category comparison - display uses lstrings.string_all
const CATEGORY_ALL = 'All'

// Fields needed for market listing display (reduces API payload size)
const MARKET_LISTING_FIELDS = [
  'brandName',
  'countryName',
  'currency',
  'denominations',
  'valueRestrictions',
  'productId',
  'productImage',
  'categories'
].join(',')

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
  isShimmer?: boolean
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

// Shimmer placeholder items shown at end of list while loading all cards
const SHIMMER_ITEMS: MarketItem[] = [
  {
    brandName: '',
    priceRange: '',
    productId: -1,
    productImage: '',
    categories: [],
    isShimmer: true
  },
  {
    brandName: '',
    priceRange: '',
    productId: -2,
    productImage: '',
    categories: [],
    isShimmer: true
  }
]

interface Props extends EdgeAppSceneProps<'giftCardMarket'> {}

export const GiftCardMarketScene: React.FC<Props> = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  // Get user's current country settings
  const { countryCode } = useSelector(state => state.ui.settings)
  const account = useSelector(state => state.core.account)

  const [items, setItems] = React.useState<MarketItem[] | null>(null)
  const [allCategories, setAllCategories] = React.useState<string[]>([])
  const [isLoadingAll, setIsLoadingAll] = React.useState(false)

  // Search state
  const [searchText, setSearchText] = React.useState('')
  const [isSearching, setIsSearching] = React.useState(false)
  const [footerHeight, setFooterHeight] = React.useState<number | undefined>()

  // Category filter state
  const [selectedCategory, setSelectedCategory] = React.useState(CATEGORY_ALL)

  // View mode state (grid or list)
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid')

  // Map productId -> full brand data for navigation
  const brandMap = React.useRef<Map<number, PhazeGiftCardBrand>>(new Map())

  // Cache for gift card brands (persisted to disk)
  const cacheRef = React.useRef<PhazeGiftCardCache | null>(null)
  cacheRef.current ??= makePhazeGiftCardCache(account)
  const cache = cacheRef.current

  // Provider (requires API key configured)
  const apiKey = (ENV.PLUGIN_API_KEYS as Record<string, unknown>)?.phaze as
    | { apiKey?: string }
    | undefined
  const phazeApiKey = apiKey?.apiKey ?? ''
  const { provider, isReady } = useGiftCardProvider({
    account,
    apiKey: phazeApiKey
  })

  const handleScroll = useSceneScrollHandler()

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

  // Extract unique normalized categories from brands
  const extractCategories = React.useCallback(
    (brands: PhazeGiftCardBrand[]): string[] => {
      const categorySet = new Set<string>()
      for (const brand of brands) {
        for (const category of brand.categories) {
          categorySet.add(normalizeCategory(category))
        }
      }
      return Array.from(categorySet).sort()
    },
    []
  )

  // Helper to store brands in the map for later lookup.
  // When mergeOnly=true, only add new brands (don't overwrite existing
  // full-data brands with limited-field data)
  const storeBrands = React.useCallback(
    (brands: PhazeGiftCardBrand[], mergeOnly = false): void => {
      for (const brand of brands) {
        if (mergeOnly && brandMap.current.has(brand.productId)) {
          continue // Skip - already have this brand with full data
        }
        brandMap.current.set(brand.productId, brand)
      }
    },
    []
  )

  // Helper to update UI state from brands
  const updateFromBrands = React.useCallback(
    (brands: PhazeGiftCardBrand[]): void => {
      setItems(mapBrandsToItems(brands))
      setAllCategories(extractCategories(brands))
    },
    [extractCategories, mapBrandsToItems]
  )

  // Load cached data on mount (before API calls complete)
  React.useEffect(() => {
    if (countryCode === '') return
    let aborted = false

    const loadCache = async (): Promise<void> => {
      // 1. Try memory cache first (instant)
      const memoryCached = cache.get(countryCode)
      if (memoryCached != null) {
        console.log(
          '[PhazeCache] Using memory cache:',
          memoryCached.length,
          'brands'
        )
        storeBrands(memoryCached, true)
        updateFromBrands(memoryCached)
        return
      }

      // 2. Try disk cache (for cold start / offline)
      const diskCached = await cache.loadFromDisk(countryCode)
      if (aborted) return
      if (diskCached != null) {
        console.log(
          '[PhazeCache] Using disk cache:',
          diskCached.length,
          'brands'
        )
        storeBrands(diskCached, true)
        updateFromBrands(diskCached)
      }
    }

    loadCache().catch(() => {})

    return () => {
      aborted = true
    }
  }, [cache, countryCode, storeBrands, updateFromBrands])

  // Fetch fresh data from API (runs in parallel with cache load)
  React.useEffect(() => {
    if (!isReady || provider == null) return
    if (phazeApiKey === '' || countryCode === '') {
      console.log('[Phaze] Skipping fetch - missing apiKey or countryCode:', {
        phazeApiKey: phazeApiKey !== '',
        countryCode
      })
      return
    }
    let aborted = false

    const fetchBrands = async (): Promise<void> => {
      try {
        // 1. Fetch initial 50 brands (fast)
        console.log('[Phaze] Fetching initial 50 gift cards for:', countryCode)
        const initialResponse = await provider.getGiftCards({
          countryCode,
          currentPage: 1,
          perPage: 50
        })
        if (aborted) return
        console.log(
          '[Phaze] Got initial',
          initialResponse.brands.length,
          'brands'
        )
        storeBrands(initialResponse.brands)
        updateFromBrands(initialResponse.brands)

        // 2. Fetch all brands in background (with minimal fields)
        setIsLoadingAll(true)
        console.log('[Phaze] Fetching all gift cards in background...')
        const fullResponse = await provider.getFullGiftCards({
          countryCode,
          fields: MARKET_LISTING_FIELDS
        })
        if (aborted) return
        console.log('[Phaze] Got all', fullResponse.brands.length, 'brands')
        // mergeOnly=true: Don't overwrite initial brands that have full data
        storeBrands(fullResponse.brands, true)
        updateFromBrands(fullResponse.brands)
        setIsLoadingAll(false)

        // 3. Update cache with fresh data
        cache.set(countryCode, fullResponse.brands)
        cache.saveToDisk(countryCode).catch(() => {})
      } catch (err: unknown) {
        console.log('[Phaze] Error fetching gift cards:', err)
        setIsLoadingAll(false)
        // Leave items as-is (cached data if available, or null for placeholders)
      }
    }

    fetchBrands().catch(() => {})

    return () => {
      aborted = true
    }
  }, [
    cache,
    countryCode,
    isReady,
    phazeApiKey,
    provider,
    storeBrands,
    updateFromBrands
  ])

  // Build category list with "All" first, then alphabetized categories
  const categoryList = React.useMemo(() => {
    const normalizedSet = new Set<string>()
    for (const cat of allCategories) {
      normalizedSet.add(normalizeCategory(cat))
    }
    return [CATEGORY_ALL, ...Array.from(normalizedSet).sort()]
  }, [allCategories])

  // Filter items by search text and category
  const filteredItems = React.useMemo(() => {
    if (items == null) return null

    let filtered = items

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
  }, [items, searchText, selectedCategory])

  const handleItemPress = useHandler((item: MarketItem) => {
    const brand = brandMap.current.get(item.productId)
    if (brand == null) {
      console.log('[Phaze] Brand not found for productId:', item.productId)
      return
    }
    console.log('[Phaze] Navigating to purchase for:', item.brandName)
    navigation.navigate('giftCardPurchase', { brand })
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
      // Render shimmer placeholder
      if (item.isShimmer === true) {
        return (
          <View style={styles.tileContainer}>
            <View style={styles.shimmerTile}>
              <ShimmerCard heightRem={10} />
            </View>
          </View>
        )
      }

      const handlePress = (): void => {
        if (item.isShimmer === true) return
        handleItemPress(item)
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
    [handleItemPress, styles.shimmerTile, styles.tileContainer]
  )

  const renderListItem: ListRenderItem<MarketItem> = React.useCallback(
    ({ item }) => {
      // Render shimmer placeholder
      if (item.isShimmer === true) {
        return <ShimmerCard heightRem={4} />
      }

      const handlePress = (): void => {
        if (item.isShimmer === true) return
        handleItemPress(item)
      }

      return (
        <EdgeCard
          icon={<CircularBrandIcon imageUrl={item.productImage} />}
          onPress={handlePress}
        >
          <View style={styles.listTextContainer}>
            <EdgeText style={styles.listBrandName} numberOfLines={1}>
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
          onStartSearching={handleStartSearching}
          onDoneSearching={handleDoneSearching}
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

  const listData = isLoadingAll
    ? [...(filteredItems ?? []), ...SHIMMER_ITEMS]
    : filteredItems

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
                { marginRight: insetStyle.paddingRight + theme.rem(0.25) }
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
              paddingRight: insetStyle.paddingRight + theme.rem(0.5)
            }}
            data={listData}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            numColumns={viewMode === 'grid' ? 2 : 1}
            keyboardDismissMode="on-drag"
            onScroll={handleScroll}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          />
        </SceneContainer>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.rem(0.5)
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
    fontSize: theme.rem(0.875),
    color: theme.primaryText
  },
  categoryTextSelected: {
    fontSize: theme.rem(0.875),
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
  shimmerTile: {
    aspectRatio: 1,
    width: '100%'
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
