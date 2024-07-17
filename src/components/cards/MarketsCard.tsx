import { div, lt } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { getFiatSymbol } from '../../constants/WalletAndCurrencyConstants'
import { formatFiatString } from '../../hooks/useFiatText'
import { toPercentString } from '../../locales/intl'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { asCoinranking, CoinRankingData } from '../../types/coinrankTypes'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { EdgeAsset } from '../../types/types'
import { getCurrencyIconUris } from '../../util/CdnUris'
import { debugLog, LOG_COINRANK } from '../../util/logger'
import { fetchRates } from '../../util/network'
import { makePeriodicTask } from '../../util/PeriodicTask'
import { DECIMAL_PRECISION } from '../../util/utils'
import { EdgeRow } from '../rows/EdgeRow'
import { COINGECKO_SUPPORTED_FIATS } from '../scenes/CoinRankingScene'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

const LISTINGS_REFRESH_INTERVAL = 30000

const COINGECKO_TO_EDGE_ASSET: Record<string, EdgeAsset> = {
  bitcoin: { pluginId: 'bitcoin', tokenId: null },
  ethereum: { pluginId: 'ethereum', tokenId: null },
  tether: { pluginId: 'ethereum', tokenId: 'dac17f958d2ee523a2206206994597c13d831ec7' },
  binancecoin: { pluginId: 'binance', tokenId: null },
  solana: { pluginId: 'solana', tokenId: null },
  ripple: { pluginId: 'ripple', tokenId: null },
  'usd-coin': { pluginId: 'ethereum', tokenId: 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
  'avalanche-2': { pluginId: 'avalanche', tokenId: null },
  dogecoin: { pluginId: 'dogecoin', tokenId: null },
  polkadot: { pluginId: 'polkadot', tokenId: null },
  tron: { pluginId: 'tron', tokenId: null },
  'matic-network': { pluginId: 'polygon', tokenId: null },
  chainlink: { pluginId: 'ethereum', tokenId: '514910771af9ca656af840dff83e8264ecf986ca' },
  'wrapped-bitcoin': { pluginId: 'ethereum', tokenId: '2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
  'shiba-inu': { pluginId: 'ethereum', tokenId: '95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce' },
  uniswap: { pluginId: 'ethereum', tokenId: '1f9840a85d5af5bf1d1762f925bdaddc4201f984' }
}
interface Props {
  navigation: NavigationBase
  numRows: number
}

interface CoinRowProps {
  coinRow: CoinRankingData
  index: number
  navigation: NavigationBase
  fiatCurrencyCode: string
}

const CoinRow = (props: CoinRowProps) => {
  const { coinRow, index, navigation, fiatCurrencyCode } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const fiatSymbol = React.useMemo(() => getFiatSymbol(fiatCurrencyCode), [fiatCurrencyCode])

  const { assetId, currencyCode, price, percentChange, imageUrl } = coinRow
  const key = `${index}-${currencyCode}`

  // Price & percent change string
  const percentChangeRaw = String(percentChange.hours24)
  const decimalChangeRaw = div(percentChangeRaw, '100', DECIMAL_PRECISION)

  const percentString = toPercentString(decimalChangeRaw, { plusSign: true, intlOpts: { noGrouping: true } })
  const percentStyle = lt(percentChangeRaw, '0') ? styles.negativeText : styles.positiveText

  const priceString = `${fiatSymbol}${formatFiatString({ fiatAmount: price.toString() })} `

  // See if we have an Edge custom icons from a small list of top assets

  const imageSrc = React.useMemo(() => {
    let edgeIconUri
    const edgeAsset = COINGECKO_TO_EDGE_ASSET[assetId]
    if (edgeAsset != null) {
      const icon = getCurrencyIconUris(edgeAsset.pluginId, edgeAsset.tokenId)
      edgeIconUri = icon.symbolImage
    }
    const iconUrl = edgeIconUri ?? imageUrl
    return { uri: iconUrl }
  }, [assetId, imageUrl])

  return (
    <EdgeRow
      key={key}
      icon={<FastImage style={styles.icon} source={imageSrc} />}
      onPress={() => navigation.navigate('coinRankingDetails', { coinRankingData: coinRow, fiatCurrencyCode })}
      rightButtonType="none"
    >
      <View style={styles.rowBody}>
        <EdgeText>{currencyCode.toUpperCase() ?? 'N/A'}</EdgeText>
        <View style={styles.rowRight}>
          <EdgeText>{priceString}</EdgeText>
          <EdgeText style={percentStyle}>{percentString}</EdgeText>
        </View>
      </View>
    </EdgeRow>
  )
}

/**
 * Card that displays market summary info for top coins
 */
export const MarketsCardUi4 = (props: Props) => {
  const { numRows } = props
  const defaultFiat = useSelector(state => getDefaultFiat(state))
  const supportedFiatSetting = COINGECKO_SUPPORTED_FIATS[defaultFiat as keyof typeof COINGECKO_SUPPORTED_FIATS] != null ? defaultFiat : 'USD'

  const [coinRankingDatas, setCoinRankingDatas] = React.useState<CoinRankingData[]>([])

  /**
   * Fetch Markets Data
   */
  React.useEffect(() => {
    const task = makePeriodicTask(
      async () => {
        const fetchedData = []
        const url = `v2/coinrank?fiatCode=iso:${supportedFiatSetting}&start=${1}&length=${numRows - 1}`
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
  }, [supportedFiatSetting, numRows])

  return (
    <EdgeCard sections>
      {coinRankingDatas.map((coinRow, index) => (
        <CoinRow key={coinRow.assetId} coinRow={coinRow} fiatCurrencyCode={supportedFiatSetting} index={index} {...props} />
      ))}
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  icon: {
    width: theme.rem(2),
    height: theme.rem(2),
    marginRight: theme.rem(0.5)
  },
  rowBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexGrow: 1,
    flexShrink: 1,
    marginHorizontal: theme.rem(0.5)
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  negativeText: {
    color: theme.negativeDeltaText
  },
  positiveText: {
    color: theme.positiveText
  }
}))
