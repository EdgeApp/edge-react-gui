import * as React from 'react'
import { FlatList, type ListRenderItem, ScrollView, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { EdgeCard } from '../cards/EdgeCard'
import { CircularBrandIcon } from '../common/CircularBrandIcon'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ModalFilledTextInput } from '../themed/FilledTextInput'
import { EdgeModal } from './EdgeModal'

const CATEGORY_ALL = 'Popular'

/**
 * Normalizes a category string by converting spaces to hyphens and lowercasing.
 * This deduplicates "food delivery" and "food-delivery" into "food-delivery".
 */
export const normalizeCategory = (category: string): string => {
  return category.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Normalizes an array of categories, removing duplicates after normalization.
 * Returns unique normalized categories.
 */
export const normalizeCategories = (categories: string[]): string[] => {
  const seen = new Set<string>()
  const result: string[] = []
  for (const cat of categories) {
    const normalized = normalizeCategory(cat)
    if (!seen.has(normalized)) {
      seen.add(normalized)
      result.push(normalized)
    }
  }
  return result
}

export interface GiftCardBrandItem {
  brandName: string
  productId: number
  productImage: string
  categories: string[]
}

export interface GiftCardSearchResult {
  brand: GiftCardBrandItem
}

interface Props {
  bridge: AirshipBridge<GiftCardSearchResult | undefined>
  brands: GiftCardBrandItem[]
  categories: string[]
}

export function GiftCardSearchModal(props: Props): React.ReactElement {
  const { bridge, brands, categories } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const [query, setQuery] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState(CATEGORY_ALL)

  // Build category list with "Popular" first, normalizing and deduplicating
  const categoryList = React.useMemo(() => {
    // Normalize all categories and deduplicate
    const normalizedSet = new Set<string>()
    for (const cat of categories) {
      const normalized = normalizeCategory(cat)
      if (normalized !== normalizeCategory(CATEGORY_ALL)) {
        normalizedSet.add(normalized)
      }
    }
    return [CATEGORY_ALL, ...Array.from(normalizedSet).sort()]
  }, [categories])

  // Filter brands by search query and selected category
  const filteredBrands = React.useMemo(() => {
    let filtered = brands

    // Filter by category (unless "Popular" is selected, which shows all)
    if (selectedCategory !== CATEGORY_ALL) {
      filtered = filtered.filter(brand =>
        brand.categories.some(
          cat => normalizeCategory(cat) === selectedCategory
        )
      )
    }

    // Filter by search query
    if (query.trim() !== '') {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(brand =>
        brand.brandName.toLowerCase().includes(lowerQuery)
      )
    }

    return filtered
  }, [brands, query, selectedCategory])

  const handleCancel = useHandler(() => {
    bridge.resolve(undefined)
  })

  const handleBrandPress = useHandler((brand: GiftCardBrandItem) => {
    bridge.resolve({ brand })
  })

  const handleCategoryPress = useHandler((category: string) => {
    setSelectedCategory(category)
  })

  const renderBrandRow: ListRenderItem<GiftCardBrandItem> = React.useCallback(
    ({ item }) => {
      const handlePress = (): void => {
        handleBrandPress(item)
      }

      // Normalize and deduplicate categories, then join as comma-delimited
      const displayCategories = normalizeCategories(item.categories).join(', ')

      return (
        <EdgeCard
          icon={<CircularBrandIcon imageUrl={item.productImage} />}
          onPress={handlePress}
        >
          <View style={styles.brandTextContainer}>
            <EdgeText style={styles.brandName} numberOfLines={1}>
              {item.brandName}
            </EdgeText>
            <EdgeText style={styles.brandCategory} numberOfLines={2}>
              {displayCategories}
            </EdgeText>
          </View>
        </EdgeCard>
      )
    },
    [handleBrandPress, styles]
  )

  const keyExtractor = React.useCallback(
    (item: GiftCardBrandItem): string => String(item.productId),
    []
  )

  return (
    <EdgeModal
      bridge={bridge}
      title={lstrings.title_gift_card_select}
      onCancel={handleCancel}
    >
      <ModalFilledTextInput
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        placeholder={lstrings.search_gift_cards}
        onChangeText={setQuery}
        value={query}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScrollView}
        contentContainerStyle={styles.categoryContainer}
      >
        {categoryList.map(category => {
          const isSelected = selectedCategory === category
          return (
            <EdgeTouchableOpacity
              key={category}
              style={styles.categoryButton}
              onPress={() => {
                handleCategoryPress(category)
              }}
            >
              <EdgeText
                style={
                  isSelected ? styles.categoryTextSelected : styles.categoryText
                }
                disableFontScaling
              >
                {category}
              </EdgeText>
            </EdgeTouchableOpacity>
          )
        })}
      </ScrollView>
      <FlatList
        data={filteredBrands}
        keyExtractor={keyExtractor}
        renderItem={renderBrandRow}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  categoryScrollView: {
    flexGrow: 0,
    flexShrink: 0,
    marginTop: theme.rem(0.5)
  },
  categoryContainer: {
    paddingHorizontal: theme.rem(0.25),
    paddingBottom: theme.rem(0.5)
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
  list: {
    flexGrow: 0,
    flexShrink: 1
  },
  listContent: {
    paddingTop: theme.rem(0.5)
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.rem(0.5),
    paddingHorizontal: theme.rem(0.5),
    marginBottom: theme.rem(0.25),
    backgroundColor: theme.tileBackground,
    borderRadius: theme.rem(0.5)
  },
  brandTextContainer: {
    flexGrow: 1,
    flexShrink: 1,
    marginLeft: theme.rem(0.5)
  },
  brandName: {
    fontSize: theme.rem(1),
    color: theme.primaryText
  },
  brandCategory: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))
