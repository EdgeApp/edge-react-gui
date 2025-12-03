import * as React from 'react'
import type { ListRenderItem } from 'react-native'
import { FlatList, View } from 'react-native'

import { showCountrySelectionModal } from '../../actions/CountryListActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { ENV } from '../../env'
import { useGiftCardProvider } from '../../hooks/useGiftCardProvider'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { RegionButton } from '../buttons/RegionButton'
import { HomeTileCard } from '../cards/HomeTileCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { SceneContainer } from '../layout/SceneContainer'
import { useTheme } from '../services/ThemeContext'
import { FilledTextInput } from '../themed/FilledTextInput'

interface MarketItem {
  title: string
  footer: string
}

const PLACEHOLDER_ITEMS: MarketItem[] = [
  { title: 'DoorDash', footer: '25 USD - 500 USD' },
  { title: 'Walmart', footer: '5 USD - 1000 USD' },
  { title: 'Amazon', footer: '10 USD - 150 USD' },
  { title: 'Xbox', footer: '15 USD - 100 USD' },
  { title: 'Airbnb', footer: '25 USD - 500 USD' },
  { title: 'Home Depot', footer: '5 USD - 1000 USD' }
]

export const GiftCardMarketScene: React.FC = () => {
  const theme = useTheme()
  const dispatch = useDispatch()

  //  Get user's current country settings
  const { countryCode, stateProvinceCode } = useSelector(
    state => state.ui.settings
  )
  const account = useSelector(state => state.core.account)

  const [query, setQuery] = React.useState('')
  const [items, setItems] = React.useState<MarketItem[] | null>(null)

  // Provider (requires API key configured)
  const apiKey = (ENV.PLUGIN_API_KEYS as any)?.phaze?.apiKey ?? ''
  const { provider, isReady } = useGiftCardProvider({
    account,
    apiKey
  })

  // Fetch brands when ready:
  React.useEffect(() => {
    if (!isReady || provider == null) return
    if (apiKey === '' || countryCode === '') return
    let aborted = false
    provider
      .getGiftCards({
        countryCode,
        brandName: query === '' ? undefined : query,
        currentPage: 1,
        perPage: 50
      })
      .then(response => {
        if (aborted) return
        const mapped: MarketItem[] = response.brands.map(b => ({
          title: b.brandName,
          footer: b.currency
        }))
        setItems(mapped)
      })
      .catch(() => {
        // Leave items as null to fall back to placeholders
      })
    return () => {
      aborted = true
    }
  }, [apiKey, countryCode, isReady, provider, query])

  const gradientColors = React.useMemo(
    () => [
      [theme.cardBaseColor, theme.cardBaseColor],
      [theme.modal, theme.cardBaseColor],
      [theme.modal, theme.modal],
      [theme.cardBaseColor, theme.modal]
    ],
    [theme]
  )

  const renderItem: ListRenderItem<MarketItem> = React.useCallback(
    ({ item, index }) => {
      const colors = gradientColors[index % gradientColors.length]
      return (
        <View style={{ flex: 1, margin: theme.rem(0.5) }}>
          <HomeTileCard
            title={item.title}
            footer={item.footer}
            gradientBackground={{ colors }}
            nodeBackground={null}
            onPress={() => {}}
          />
        </View>
      )
    },
    [gradientColors, theme]
  )

  const keyExtractor = (item: MarketItem, index: number): string =>
    `${item.title}-${index}`

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
      {({ insetStyle }) => (
        <SceneContainer
          headerTitle={lstrings.title_gift_card_market}
          headerTitleChildren={<RegionButton onPress={handleRegionSelect} />}
        >
          <View
            style={{
              paddingTop: insetStyle.paddingTop + theme.rem(0.5),
              paddingLeft: insetStyle.paddingLeft + theme.rem(0.5),
              paddingRight: insetStyle.paddingRight + theme.rem(0.5)
            }}
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
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingBottom: insetStyle.paddingBottom + theme.rem(0.5)
            }}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          />
        </SceneContainer>
      )}
    </SceneWrapper>
  )
}
