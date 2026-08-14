import { eq } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { formatDate, formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import {
  type BookLevel,
  formatCentsPrice,
  getBestAskPrice,
  isSafeVenueUrl,
  type MarketLeg,
  type PredictionMarket
} from '../../plugins/prediction-markets/slipstreamTypes'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { openBrowserUri } from '../../util/WebUtils'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { SceneContainer } from '../layout/SceneContainer'
import { EdgeRow } from '../rows/EdgeRow'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export interface PredictionMarketDetailsParams {
  market: PredictionMarket
}

interface Props extends EdgeAppSceneProps<'predictionMarketDetails'> {}

const BOOK_LEVELS_SHOWN = 3

const PredictionMarketDetailsSceneComponent: React.FC<Props> = props => {
  const { route } = props
  const { market } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  const bestAsk = getBestAskPrice(market)

  return (
    <SceneWrapper scroll>
      <SceneContainer headerTitle={lstrings.title_prediction_markets}>
        {market.league != null ? (
          <EdgeText style={styles.leagueChip} disableFontScaling>
            {market.league.toUpperCase()}
          </EdgeText>
        ) : null}
        <EdgeText style={styles.title} numberOfLines={3}>
          {market.title}
        </EdgeText>

        <SectionHeader leftTitle={lstrings.prediction_markets_venue_prices} />
        <EdgeCard sections>
          {market.venue_prices.map(venuePrice => {
            const isBest =
              venuePrice.best_ask != null &&
              bestAsk != null &&
              eq(venuePrice.best_ask, bestAsk)
            return (
              <View key={venuePrice.venue} style={styles.venuePriceRow}>
                <View style={styles.venueNameContainer}>
                  <EdgeText style={styles.venueName}>
                    {venuePrice.venue}
                  </EdgeText>
                  {isBest ? (
                    <EdgeText style={styles.bestPriceTag} disableFontScaling>
                      {lstrings.prediction_markets_best_price}
                    </EdgeText>
                  ) : null}
                </View>
                <View style={styles.bidAskContainer}>
                  <EdgeText style={styles.bidAskLabel} disableFontScaling>
                    {lstrings.prediction_markets_bid}
                  </EdgeText>
                  <EdgeText style={styles.bidAskValue}>
                    {formatCentsPrice(venuePrice.best_bid)}
                  </EdgeText>
                  <EdgeText style={styles.bidAskLabel} disableFontScaling>
                    {lstrings.prediction_markets_ask}
                  </EdgeText>
                  <EdgeText style={styles.bidAskValue}>
                    {formatCentsPrice(venuePrice.best_ask)}
                  </EdgeText>
                </View>
              </View>
            )
          })}
        </EdgeCard>

        {market.book != null ? (
          <>
            <SectionHeader leftTitle={lstrings.prediction_markets_order_book} />
            <EdgeCard>
              <View style={styles.bookColumns}>
                <View style={styles.bookColumn}>
                  <EdgeText style={styles.bookColumnTitle} disableFontScaling>
                    {lstrings.prediction_markets_bids}
                  </EdgeText>
                  {market.book.bids
                    .slice(0, BOOK_LEVELS_SHOWN)
                    .map((level, index) => (
                      <BookLevelRow key={`bid-${index}`} level={level} isBid />
                    ))}
                </View>
                <View style={styles.bookColumn}>
                  <EdgeText style={styles.bookColumnTitle} disableFontScaling>
                    {lstrings.prediction_markets_asks}
                  </EdgeText>
                  {market.book.asks
                    .slice(0, BOOK_LEVELS_SHOWN)
                    .map((level, index) => (
                      <BookLevelRow
                        key={`ask-${index}`}
                        level={level}
                        isBid={false}
                      />
                    ))}
                </View>
              </View>
            </EdgeCard>
          </>
        ) : null}

        <SectionHeader leftTitle={lstrings.prediction_markets_market_details} />
        <EdgeCard sections>
          {market.legs.map(leg => (
            <MarketLegRow key={leg.venue + leg.market_id} leg={leg} />
          ))}
        </EdgeCard>
      </SceneContainer>
    </SceneWrapper>
  )
}

export const PredictionMarketDetailsScene = React.memo(
  PredictionMarketDetailsSceneComponent
)

interface BookLevelRowProps {
  level: BookLevel
  isBid: boolean
}

const BookLevelRow: React.FC<BookLevelRowProps> = props => {
  const { level, isBid } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.bookLevelRow}>
      <EdgeText
        style={isBid ? styles.bookPriceBid : styles.bookPriceAsk}
        disableFontScaling
      >
        {formatCentsPrice(level.price)}
      </EdgeText>
      <EdgeText style={styles.bookLevelDetail} disableFontScaling>
        {`${formatNumber(level.size, { toFixed: 0 })} · ${level.venue}`}
      </EdgeText>
    </View>
  )
}

interface MarketLegRowProps {
  leg: MarketLeg
}

const MarketLegRow: React.FC<MarketLegRowProps> = props => {
  const { leg } = props

  const bodyLines: string[] = []
  if (leg.volume_24h != null) {
    bodyLines.push(
      sprintf(
        lstrings.prediction_markets_volume_24h_1s,
        formatNumber(leg.volume_24h, { toFixed: 0 })
      )
    )
  }
  if (leg.resolution_date != null) {
    const resolutionDate = new Date(leg.resolution_date)
    if (!isNaN(resolutionDate.valueOf())) {
      bodyLines.push(
        sprintf(
          lstrings.prediction_markets_resolves_1s,
          formatDate(resolutionDate)
        )
      )
    }
  }

  // Live API responses are untrusted; only open https URLs on known venue
  // hosts, never deep-link schemes or the app's own claimed App Link hosts:
  const legUrl =
    leg.url != null && isSafeVenueUrl(leg.url) ? leg.url : undefined

  const handlePress = useHandler(() => {
    if (legUrl == null) return
    openBrowserUri(legUrl).catch((error: unknown) => {
      showError(error)
    })
  })

  return (
    <EdgeRow
      rightButtonType={legUrl != null ? 'touchable' : 'none'}
      title={leg.venue}
      body={bodyLines.length > 0 ? bodyLines.join('\n') : undefined}
      onPress={legUrl != null ? handlePress : undefined}
    />
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  leagueChip: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.6)
  },
  title: {
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1.1),
    marginBottom: theme.rem(0.5)
  },
  venuePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: theme.rem(0.5)
  },
  venueNameContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  venueName: {
    fontSize: theme.rem(0.9)
  },
  bestPriceTag: {
    color: theme.iconTappable,
    fontSize: theme.rem(0.6),
    marginLeft: theme.rem(0.5)
  },
  bidAskContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  bidAskLabel: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.65),
    marginRight: theme.rem(0.25)
  },
  bidAskValue: {
    fontSize: theme.rem(0.9),
    marginRight: theme.rem(0.75)
  },
  bookColumns: {
    flexDirection: 'row',
    margin: theme.rem(0.25)
  },
  bookColumn: {
    flex: 1
  },
  bookColumnTitle: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75),
    marginBottom: theme.rem(0.25)
  },
  bookLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.rem(0.25)
  },
  bookPriceBid: {
    color: theme.positiveText,
    fontSize: theme.rem(0.85),
    marginRight: theme.rem(0.5)
  },
  bookPriceAsk: {
    color: theme.negativeDeltaText,
    fontSize: theme.rem(0.85),
    marginRight: theme.rem(0.5)
  },
  bookLevelDetail: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.65)
  }
}))
