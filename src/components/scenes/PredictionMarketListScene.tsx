import { useQuery } from '@tanstack/react-query'
import { eq } from 'biggystring'
import * as React from 'react'
import type { ListRenderItem } from 'react-native'
import { ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { fetchPredictionMarkets } from '../../plugins/prediction-markets/slipstreamApi'
import {
  formatCentsPrice,
  getBestAskPrice,
  PREDICTION_MARKET_CATEGORIES,
  type PredictionMarket,
  type PredictionMarketCategory
} from '../../plugins/prediction-markets/slipstreamTypes'
import { useSceneScrollHandler } from '../../state/SceneScrollState'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { AlertCardUi4 } from '../cards/AlertCard'
import { EdgeCard } from '../cards/EdgeCard'
import { EdgeAnim } from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { SceneContainer } from '../layout/SceneContainer'
import { FillLoader } from '../progress-indicators/FillLoader'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

const CATEGORY_LABELS: Record<PredictionMarketCategory, string> = {
  sports: lstrings.prediction_markets_category_sports,
  crypto: lstrings.prediction_markets_category_crypto,
  macro: lstrings.prediction_markets_category_macro,
  politics: lstrings.prediction_markets_category_politics
}

interface Props extends EdgeAppSceneProps<'predictionMarkets'> {}

const PredictionMarketListSceneComponent: React.FC<Props> = props => {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const [category, setCategory] =
    React.useState<PredictionMarketCategory>('sports')

  const handleScroll = useSceneScrollHandler()

  const { data, isLoading } = useQuery({
    queryKey: ['predictionMarkets', category],
    queryFn: async () => await fetchPredictionMarkets(category)
  })

  const handleCategoryPress = useHandler(
    (newCategory: PredictionMarketCategory) => {
      setCategory(newCategory)
    }
  )

  const renderItem: ListRenderItem<PredictionMarket> = React.useCallback(
    ({ item }) => {
      const handlePress = (): void => {
        navigation.navigate('predictionMarketDetails', { market: item })
      }
      const bestAsk = getBestAskPrice(item)
      return (
        <EdgeCard onPress={handlePress}>
          <View style={styles.cardHeader}>
            {item.league != null ? (
              <EdgeText style={styles.leagueChip} disableFontScaling>
                {item.league.toUpperCase()}
              </EdgeText>
            ) : null}
            <EdgeText style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </EdgeText>
          </View>
          <View style={styles.venueRow}>
            {item.venue_prices.map(venuePrice => {
              const isBest =
                venuePrice.best_ask != null &&
                bestAsk != null &&
                eq(venuePrice.best_ask, bestAsk)
              return (
                <View
                  key={venuePrice.venue}
                  style={isBest ? styles.venueCellBest : styles.venueCell}
                >
                  <EdgeText
                    style={isBest ? styles.venueNameBest : styles.venueName}
                    disableFontScaling
                  >
                    {venuePrice.venue}
                  </EdgeText>
                  <EdgeText
                    style={isBest ? styles.venuePriceBest : styles.venuePrice}
                    disableFontScaling
                  >
                    {formatCentsPrice(venuePrice.best_ask)}
                  </EdgeText>
                </View>
              )
            })}
          </View>
        </EdgeCard>
      )
    },
    [navigation, styles]
  )

  const keyExtractor = React.useCallback(
    (item: PredictionMarket): string => item.id,
    []
  )

  return (
    <SceneWrapper>
      {({ insetStyle, undoInsetStyle }) => (
        <SceneContainer
          undoInsetStyle={undoInsetStyle}
          headerTitle={lstrings.title_prediction_markets}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScrollView}
            contentContainerStyle={[
              styles.categoryContainer,
              { paddingLeft: insetStyle.paddingLeft + theme.rem(0.25) }
            ]}
          >
            {PREDICTION_MARKET_CATEGORIES.map((categoryOption, index) => {
              const isSelected = category === categoryOption
              return (
                <EdgeAnim
                  key={categoryOption}
                  enter={{
                    type: 'fadeInRight',
                    distance: 20,
                    delay: index * 30
                  }}
                >
                  <EdgeTouchableOpacity
                    style={styles.categoryButton}
                    onPress={() => {
                      handleCategoryPress(categoryOption)
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
                      {CATEGORY_LABELS[categoryOption]}
                    </EdgeText>
                  </EdgeTouchableOpacity>
                </EdgeAnim>
              )
            })}
          </ScrollView>
          {isLoading ? (
            <FillLoader />
          ) : data == null ? (
            <AlertCardUi4
              type="warning"
              title={lstrings.prediction_markets_error}
            />
          ) : (
            <>
              {data.isSampleData ? (
                <AlertCardUi4
                  type="warning"
                  title={lstrings.prediction_markets_sample_data}
                />
              ) : null}
              {data.markets.length === 0 ? (
                <EdgeText style={styles.emptyText}>
                  {lstrings.prediction_markets_empty}
                </EdgeText>
              ) : (
                <Animated.FlatList
                  contentContainerStyle={{
                    paddingTop: 0,
                    paddingLeft: insetStyle.paddingLeft + theme.rem(0.5),
                    paddingRight: insetStyle.paddingRight + theme.rem(0.5),
                    paddingBottom: insetStyle.paddingBottom + theme.rem(0.5)
                  }}
                  data={data.markets}
                  keyExtractor={keyExtractor}
                  renderItem={renderItem}
                  onScroll={handleScroll}
                  scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
                />
              )}
            </>
          )}
        </SceneContainer>
      )}
    </SceneWrapper>
  )
}

export const PredictionMarketListScene = React.memo(
  PredictionMarketListSceneComponent
)

const getStyles = cacheStyles((theme: Theme) => ({
  categoryScrollView: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: theme.rem(0.5)
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: theme.rem(0.5)
  },
  categoryButton: {
    paddingHorizontal: theme.rem(0.5),
    paddingVertical: theme.rem(0.25)
  },
  categoryText: {
    color: theme.deactivatedText,
    fontSize: theme.rem(0.85)
  },
  categoryTextSelected: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(0.85)
  },
  cardHeader: {
    margin: theme.rem(0.25)
  },
  leagueChip: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.6),
    marginBottom: theme.rem(0.25)
  },
  cardTitle: {
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(0.9)
  },
  venueRow: {
    flexDirection: 'row',
    margin: theme.rem(0.25),
    marginTop: theme.rem(0.5)
  },
  venueCell: {
    borderColor: theme.lineDivider,
    borderRadius: theme.rem(0.5),
    borderWidth: theme.thinLineWidth,
    marginRight: theme.rem(0.5),
    paddingHorizontal: theme.rem(0.5),
    paddingVertical: theme.rem(0.25),
    alignItems: 'center'
  },
  venueCellBest: {
    borderColor: theme.iconTappable,
    borderRadius: theme.rem(0.5),
    borderWidth: theme.thinLineWidth,
    marginRight: theme.rem(0.5),
    paddingHorizontal: theme.rem(0.5),
    paddingVertical: theme.rem(0.25),
    alignItems: 'center'
  },
  venueName: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.65)
  },
  venueNameBest: {
    color: theme.iconTappable,
    fontSize: theme.rem(0.65)
  },
  venuePrice: {
    fontSize: theme.rem(0.85)
  },
  venuePriceBest: {
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(0.85)
  },
  emptyText: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.85),
    margin: theme.rem(1),
    textAlign: 'center'
  }
}))
