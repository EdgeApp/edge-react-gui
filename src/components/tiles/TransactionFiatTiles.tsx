import { abs } from 'biggystring'
import { EdgeCurrencyWallet, EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { displayFiatAmount } from '../../hooks/useFiatText'
import { useHandler } from '../../hooks/useHandler'
import { useHistoricalRate } from '../../hooks/useHistoricalRate'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { convertCurrencyFromExchangeRates } from '../../selectors/WalletSelectors'
import { useSelector } from '../../types/reactRedux'
import { convertNativeToExchange } from '../../util/utils'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Tile } from '../tiles/Tile'

interface Props {
  transaction: EdgeTransaction
  wallet: EdgeCurrencyWallet
  onMetadataEdit: (metadata: EdgeMetadata) => void | Promise<void>
}

/**
 * Renders the fiat amount tiles for the TransactionDetailsScene.
 */
export function TransactionFiatTiles(props: Props) {
  const { transaction, wallet, onMetadataEdit } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  // Look up wallet stuff:
  const { currencyInfo } = wallet
  const isoFiatCurrencyCode = useWatch(wallet, 'fiatCurrencyCode')
  const fiatCurrencyCode = isoFiatCurrencyCode.replace('iso:', '')
  const fiatSymbol = getSymbolFromCurrency(fiatCurrencyCode)

  // Look up transaction stuff:
  const { currencyCode, date, metadata = {}, nativeAmount } = transaction
  const absoluteAmount = abs(nativeAmount)

  // Look up the current price:
  const exchangeDenom = useSelector(state => getExchangeDenomination(state, currencyInfo.pluginId, currencyCode))
  const absExchangeAmount = convertNativeToExchange(exchangeDenom.multiplier)(absoluteAmount)
  const currentFiat = useSelector(state =>
    parseFloat(convertCurrencyFromExchangeRates(state.exchangeRates, currencyCode, isoFiatCurrencyCode, absExchangeAmount))
  )

  // Look up the historical price:
  const isoDate = new Date(date * 1000).toISOString()
  const historicRate = useHistoricalRate(`${currencyCode}_${isoFiatCurrencyCode}`, isoDate)
  const historicFiat = historicRate * Number(absExchangeAmount)

  // Figure out which amount to show:
  const displayFiat = metadata.amountFiat == null || metadata.amountFiat === 0 ? historicFiat : Math.abs(metadata.amountFiat)

  // Percent difference:
  const percentChange = displayFiat === 0 ? 0 : (100 * (currentFiat - displayFiat)) / displayFiat

  // Convert to text:
  const currentFiatText = displayFiatAmount(currentFiat)
  const displayFiatText = displayFiatAmount(displayFiat)
  const percentText = abs(percentChange.toFixed(2))

  const handleEdit = useHandler(() => {
    Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={displayFiatText}
        inputLabel={fiatCurrencyCode}
        returnKeyType="done"
        keyboardType="numeric"
        submitLabel={lstrings.string_save}
        title={sprintf(lstrings.transaction_details_amount_in_fiat, fiatCurrencyCode)}
      />
    ))
      .then(async inputText => {
        if (inputText == null) return
        const amountFiat = parseFloat(inputText.replace(',', '.'))

        // Check for NaN, Infinity, and 0:
        if (amountFiat === 0 || JSON.stringify(amountFiat) === 'null') return
        await onMetadataEdit({ amountFiat })
      })
      .catch(showError)
  })

  return (
    <>
      <Tile type="editable" title={sprintf(lstrings.transaction_details_amount_in_fiat, fiatCurrencyCode)} onPress={handleEdit}>
        <View style={styles.tileRow}>
          <EdgeText>{fiatSymbol + ' '}</EdgeText>
          <EdgeText>{displayFiatText}</EdgeText>
        </View>
      </Tile>
      <Tile type="static" title={lstrings.transaction_details_amount_current_price}>
        <View style={styles.tileRow}>
          <EdgeText>{fiatSymbol + ' '}</EdgeText>
          <EdgeText style={styles.tileTextPrice}>{currentFiatText}</EdgeText>
          <EdgeText style={percentChange >= 0 ? styles.tileTextPriceChangeUp : styles.tileTextPriceChangeDown}>
            {(percentChange >= 0 ? percentText : `- ${percentText}`) + '%'}
          </EdgeText>
        </View>
      </Tile>
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  tileRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  tileTextPrice: {
    flex: 1,
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  tileTextPriceChangeUp: {
    color: theme.positiveText,
    fontSize: theme.rem(1)
  },
  tileTextPriceChangeDown: {
    color: theme.negativeText,
    fontSize: theme.rem(1)
  }
}))
