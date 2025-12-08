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
import { RegionButton } from '../buttons/RegionButton'
import { GiftCardTile } from '../cards/GiftCardTile'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { FilledTextInput } from '../themed/FilledTextInput'
import { SceneHeaderUi4 } from '../themed/SceneHeaderUi4'

interface MarketItem {
  brandName: string
  priceRange: string
  productId: number
  productImage: string
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

export const GiftCardMarketScene: React.FC = () => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  // Get user's current country settings
  const { countryCode, stateProvinceCode } = useSelector(
    state => state.ui.settings
  )
  const account = useSelector(state => state.core.account)

  const [query, setQuery] = React.useState('')
  const [items, setItems] = React.useState<MarketItem[] | null>(null)

  // Provider (requires API key configured)
  const apiKey = (ENV.PLUGIN_API_KEYS as Record<string, unknown>)?.phaze as
    | { apiKey?: string }
    | undefined
  const phazeApiKey = apiKey?.apiKey ?? ''
  const { provider, isReady } = useGiftCardProvider({
    account,
    apiKey: phazeApiKey
  })

  // Fetch brands when ready:
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
    console.log('[Phaze] Fetching gift cards for:', countryCode)
    provider
      .getGiftCards({
        countryCode,
        brandName: query === '' ? undefined : query,
        currentPage: 1,
        perPage: 50
      })
      .then(response => {
        if (aborted) return
        console.log('[Phaze] Got', response.brands.length, 'brands')
        const mapped: MarketItem[] = response.brands.map(brand => ({
          brandName: brand.brandName,
          priceRange: formatPriceRange(brand),
          productId: brand.productId,
          productImage: brand.productImage
        }))
        setItems(mapped)
      })
      .catch((err: unknown) => {
        console.log('[Phaze] Error fetching gift cards:', err)
        // Leave items as null to fall back to placeholders
      })
    return () => {
      aborted = true
    }
  }, [countryCode, isReady, phazeApiKey, provider, query])

  const handleItemPress = useHandler((item: MarketItem) => {
    // TODO: Navigate to brand detail/purchase scene
    console.log('[Phaze] Selected brand:', item.brandName, item.productId)
  })

  const renderItem: ListRenderItem<MarketItem> = React.useCallback(
    ({ item }) => {
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
    [handleItemPress, styles.tileContainer]
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
          <View
            style={[
              styles.searchContainer,
              {
                paddingLeft: insetStyle.paddingLeft + theme.rem(0.5),
                paddingRight: insetStyle.paddingRight + theme.rem(0.5)
              }
            ]}
          >
            <FilledTextInput
              placeholder={lstrings.search_gift_cards}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              aroundRem={0.5}
            />
          </View>
          <FlatList
            data={items ?? PLACEHOLDER_ITEMS}
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
  tileContainer: {
    flex: 1,
    margin: theme.rem(0.25)
  },
  list: {
    flex: 1
  }
}))
