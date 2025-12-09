import * as React from 'react'
import type { ListRenderItem } from 'react-native'
import { FlatList, View } from 'react-native'

import { showCountrySelectionModal } from '../../actions/CountryListActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { ENV } from '../../env'
import { useGiftCardProvider } from '../../hooks/useGiftCardProvider'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { PhazeGiftCardBrand } from '../../plugins/gift-cards/phazeGiftCardTypes'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { RegionButton } from '../buttons/RegionButton'
import { GiftCardTile } from '../cards/GiftCardTile'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import {
  type GiftCardBrandItem,
  GiftCardSearchModal,
  type GiftCardSearchResult,
  normalizeCategory
} from '../modals/GiftCardSearchModal'
import { ShimmerCard } from '../progress-indicators/ShimmerCard'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { SceneHeaderUi4 } from '../themed/SceneHeaderUi4'

interface MarketItem {
  brandName: string
  priceRange: string
  productId: number
  productImage: string
  isShimmer?: boolean
}

/**
 * Formats a price range string from brand data.
 * Uses valueRestrictions (min/max) if available, otherwise denominations.
 */
const formatPriceRange = (brand: PhazeGiftCardBrand): string => {
  const { currency, valueRestrictions, denominations } = brand
  const { minVal, maxVal } = valueRestrictions

  if (minVal != null && maxVal != null) {
    return `${minVal} ${currency} - ${maxVal} ${currency}`
  }

  if (denominations.length > 0) {
    const sorted = [...denominations].sort((a, b) => a - b)
    if (sorted.length === 1) {
      return `${sorted[0]} ${currency}`
    }
    return `${sorted[0]} ${currency} - ${sorted[sorted.length - 1]} ${currency}`
  }

  return currency
}

const PLACEHOLDER_ITEMS: MarketItem[] = [
  {
    brandName: 'DoorDash',
    priceRange: '25 USD - 500 USD',
    productId: 0,
    productImage: ''
  },
  {
    brandName: 'Walmart',
    priceRange: '5 USD - 1000 USD',
    productId: 0,
    productImage: ''
  },
  {
    brandName: 'Amazon',
    priceRange: '10 USD - 150 USD',
    productId: 0,
    productImage: ''
  },
  {
    brandName: 'Xbox',
    priceRange: '15 USD - 100 USD',
    productId: 0,
    productImage: ''
  },
  {
    brandName: 'Airbnb',
    priceRange: '25 USD - 500 USD',
    productId: 0,
    productImage: ''
  },
  {
    brandName: 'Home Depot',
    priceRange: '5 USD - 1000 USD',
    productId: 0,
    productImage: ''
  }
]

// Shimmer placeholder items shown at end of list while loading all cards
const SHIMMER_ITEMS: MarketItem[] = [
  {
    brandName: '',
    priceRange: '',
    productId: -1,
    productImage: '',
    isShimmer: true
  },
  {
    brandName: '',
    priceRange: '',
    productId: -2,
    productImage: '',
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
  const { countryCode, stateProvinceCode } = useSelector(
    state => state.ui.settings
  )
  const account = useSelector(state => state.core.account)

  const [items, setItems] = React.useState<MarketItem[] | null>(null)
  const [allBrands, setAllBrands] = React.useState<GiftCardBrandItem[]>([])
  const [allCategories, setAllCategories] = React.useState<string[]>([])
  const [isLoadingAll, setIsLoadingAll] = React.useState(false)

  // Map productId -> full brand data for navigation
  const brandMap = React.useRef<Map<number, PhazeGiftCardBrand>>(new Map())

  // Provider (requires API key configured)
  const apiKey = (ENV.PLUGIN_API_KEYS as Record<string, unknown>)?.phaze as
    | { apiKey?: string }
    | undefined
  const phazeApiKey = apiKey?.apiKey ?? ''
  const { provider, isReady } = useGiftCardProvider({
    account,
    apiKey: phazeApiKey
  })

  // Helper to map brand response to MarketItem
  const mapBrandsToItems = React.useCallback(
    (brands: PhazeGiftCardBrand[]): MarketItem[] =>
      brands.map(brand => ({
        brandName: brand.brandName,
        priceRange: formatPriceRange(brand),
        productId: brand.productId,
        productImage: brand.productImage
      })),
    []
  )

  // Helper to extract brand items for modal
  const mapBrandsToBrandItems = React.useCallback(
    (brands: PhazeGiftCardBrand[]): GiftCardBrandItem[] =>
      brands.map(brand => ({
        brandName: brand.brandName,
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

  // Fetch initial 50 brands quickly, then fetch all in background
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
        // Helper to store brands in the map for later lookup
        const storeBrands = (brands: PhazeGiftCardBrand[]): void => {
          for (const brand of brands) {
            brandMap.current.set(brand.productId, brand)
          }
        }

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
        setItems(mapBrandsToItems(initialResponse.brands))
        setAllBrands(mapBrandsToBrandItems(initialResponse.brands))
        setAllCategories(extractCategories(initialResponse.brands))

        // 2. Fetch all brands in background
        setIsLoadingAll(true)
        console.log('[Phaze] Fetching all gift cards in background...')
        const fullResponse = await provider.getFullGiftCards({ countryCode })
        if (aborted) return
        console.log('[Phaze] Got all', fullResponse.brands.length, 'brands')
        storeBrands(fullResponse.brands)
        setItems(mapBrandsToItems(fullResponse.brands))
        setAllBrands(mapBrandsToBrandItems(fullResponse.brands))
        setAllCategories(extractCategories(fullResponse.brands))
        setIsLoadingAll(false)
      } catch (err: unknown) {
        console.log('[Phaze] Error fetching gift cards:', err)
        setIsLoadingAll(false)
        // Leave items as null to fall back to placeholders
      }
    }

    fetchBrands().catch(() => {})

    return () => {
      aborted = true
    }
  }, [
    countryCode,
    extractCategories,
    isReady,
    mapBrandsToItems,
    mapBrandsToBrandItems,
    phazeApiKey,
    provider
  ])

  const handleItemPress = useHandler((item: MarketItem) => {
    const brand = brandMap.current.get(item.productId)
    if (brand == null) {
      console.log('[Phaze] Brand not found for productId:', item.productId)
      return
    }
    console.log('[Phaze] Navigating to purchase for:', item.brandName)
    navigation.navigate('giftCardPurchase', { brand })
  })

  const handleSearchPress = useHandler(async () => {
    const result = await Airship.show<GiftCardSearchResult | undefined>(
      bridge => (
        <GiftCardSearchModal
          bridge={bridge}
          brands={allBrands}
          categories={allCategories}
        />
      )
    )
    if (result != null) {
      const brand = brandMap.current.get(result.brand.productId)
      if (brand == null) {
        console.log(
          '[Phaze] Brand not found for productId:',
          result.brand.productId
        )
        return
      }
      console.log('[Phaze] Navigating to purchase from modal:', brand.brandName)
      navigation.navigate('giftCardPurchase', { brand })
    }
  })

  const renderItem: ListRenderItem<MarketItem> = React.useCallback(
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

  const keyExtractor = React.useCallback(
    (item: MarketItem, index: number): string => `${item.productId}-${index}`,
    []
  )

  const handleRegionSelect = useHandler(() => {
    dispatch(
      showCountrySelectionModal({
        account,
        countryCode,
        stateProvinceCode
      })
    ).catch(() => {})
  })

  return (
    <SceneWrapper hasTabs>
      {({ insetStyle, undoInsetStyle }) => (
        <View style={{ ...undoInsetStyle, marginTop: 0 }}>
          <SceneHeaderUi4 title={lstrings.title_gift_card_market}>
            <RegionButton onPress={handleRegionSelect} />
          </SceneHeaderUi4>
          <EdgeTouchableOpacity
            style={[
              styles.searchContainer,
              {
                paddingLeft: insetStyle.paddingLeft + theme.rem(0.5),
                paddingRight: insetStyle.paddingRight + theme.rem(0.5)
              }
            ]}
            onPress={handleSearchPress}
          >
            <View style={styles.searchDummy}>
              <EdgeText style={styles.searchPlaceholder}>
                {lstrings.search_gift_cards}
              </EdgeText>
            </View>
          </EdgeTouchableOpacity>
          <FlatList
            data={
              items == null
                ? PLACEHOLDER_ITEMS
                : isLoadingAll
                ? [...items, ...SHIMMER_ITEMS]
                : items
            }
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            numColumns={2}
            style={styles.list}
            contentContainerStyle={{
              paddingBottom: insetStyle.paddingBottom,
              paddingLeft: insetStyle.paddingLeft + theme.rem(0.5),
              paddingRight: insetStyle.paddingRight + theme.rem(0.5)
            }}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          />
        </View>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  searchContainer: {
    paddingTop: theme.rem(0.5),
    paddingBottom: theme.rem(0.5)
  },
  searchDummy: {
    backgroundColor: theme.textInputBackgroundColor,
    borderRadius: theme.rem(0.5),
    paddingVertical: theme.rem(0.75),
    paddingHorizontal: theme.rem(1),
    borderWidth: theme.textInputBorderWidth,
    borderColor: theme.textInputBorderColor
  },
  searchPlaceholder: {
    color: theme.textInputPlaceholderColor,
    fontSize: theme.rem(1)
  },
  tileContainer: {
    flex: 1,
    margin: theme.rem(0.25)
  },
  shimmerTile: {
    aspectRatio: 1,
    width: '100%'
  },
  list: {
    flex: 1
  }
}))
