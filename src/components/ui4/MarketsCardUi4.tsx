import { div, lt } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { formatFiatString } from '../../hooks/useFiatText'
import { toPercentString } from '../../locales/intl'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { asCoinranking, CoinRankingData } from '../../types/coinrankTypes'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { debugLog, LOG_COINRANK } from '../../util/logger'
import { fetchRates } from '../../util/network'
import { makePeriodicTask } from '../../util/PeriodicTask'
import { DECIMAL_PRECISION } from '../../util/utils'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { CardUi4 } from './CardUi4'
import { RowUi4 } from './RowUi4'

const LISTINGS_REFRESH_INTERVAL = 30000

interface Props {
  navigation: NavigationBase
  numRows: number
}

/**
 * Card that displays balance, deposit/send buttons, and a link to view assets
 */
export const MarketsCardUi4 = (props: Props) => {
  const { navigation, numRows } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const defaultIsoFiat = useSelector(state => `iso:${getDefaultFiat(state)}`)
  const defaultFiat = useSelector(state => getDefaultFiat(state))
  const fiatSymbol = React.useMemo(() => getSymbolFromCurrency(defaultFiat), [defaultFiat])

  const [coinRankingDatas, setCoinRankingDatas] = React.useState<CoinRankingData[]>([])

  const renderCoinRow = (coinRow: CoinRankingData, index: number) => {
    const { currencyCode, price, percentChange, imageUrl } = coinRow
    const key = `${index}-${currencyCode}`

    // Price & percent change string
    const percentChangeRaw = String(percentChange.hours24)
    const decimalChangeRaw = div(percentChangeRaw, '100', DECIMAL_PRECISION)

    const percentString = toPercentString(decimalChangeRaw, { plusSign: true, intlOpts: { noGrouping: true } })
    const percentStyle = lt(percentChangeRaw, '0') ? styles.negativeText : styles.positiveText

    const priceString = `${fiatSymbol}${formatFiatString({ fiatAmount: price.toString() })} `

    return (
      <RowUi4
        key={key}
        icon={imageUrl == null ? null : <FastImage style={styles.icon} source={{ uri: imageUrl }} />}
        onPress={() => navigation.navigate('coinRankingDetails', { coinRankingData: coinRow })}
        type="default"
      >
        <View style={styles.row}>
          <EdgeText>{currencyCode.toUpperCase() ?? 'N/A'}</EdgeText>
          <View style={styles.rowRight}>
            <EdgeText>{priceString}</EdgeText>
            <EdgeText style={percentStyle}>{percentString}</EdgeText>
          </View>
        </View>
      </RowUi4>
    )
  }

  /**
   * Fetch Markets Data
   */
  React.useEffect(() => {
    const task = makePeriodicTask(
      async () => {
        const fetchedData = []
        const url = `v2/coinrank?fiatCode=${defaultIsoFiat}&start=${1}&length=${numRows - 1}`
        const response = await fetchRates(url)
        if (!response.ok) {
          const text = await response.text()
          console.warn(text)
        }
        const replyJson = await response.json()
        const listings = asCoinranking(replyJson)
        for (let i = 0; i < listings.data.length; i++) {
          const rankIndex = i
          const row: CoinRankingData = listings.data[i]
          fetchedData[rankIndex] = row
        }

        setCoinRankingDatas(fetchedData)
      },
      LISTINGS_REFRESH_INTERVAL,
      {
        onError(error: unknown) {
          console.warn(error)
          debugLog(LOG_COINRANK, String(error))
        }
      }
    )
    task.start()

    // Cleanup logic:
    return () => task.stop()
  }, [defaultIsoFiat, numRows])

  return <CardUi4 sections>{coinRankingDatas.map((coinRow, index) => renderCoinRow(coinRow, index))}</CardUi4>
}

const getStyles = cacheStyles((theme: Theme) => ({
  icon: {
    width: theme.rem(2),
    height: theme.rem(2),
    margin: theme.rem(0.25)
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  negativeText: {
    color: theme.negativeTextMutedUi4
  },
  positiveText: {
    color: theme.positiveText
  }
}))
