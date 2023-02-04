import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { PaymentMethod } from '../../controllers/action-queue/WyreClient'
import { CurrencyRow, CustomAsset } from '../data/row/CurrencyRow'
import { PaymentMethodRow } from '../data/row/PaymentMethodRow'
import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { TappableCard } from './TappableCard'

interface TappableAccountCardProps {
  emptyLabel: string
  marginRem?: number[] | number
  selectedAsset: SelectableAsset
  onPress: () => void
}

export interface SelectableAsset {
  customAsset?: CustomAsset
  paymentMethod?: PaymentMethod
  tokenId?: string
  wallet?: EdgeCurrencyWallet
}

const TappableAccountCardComponent = (props: TappableAccountCardProps) => {
  const { emptyLabel, onPress, selectedAsset, marginRem } = props
  const { paymentMethod, tokenId, wallet, customAsset } = selectedAsset
  const theme = useTheme()
  const styles = getStyles(theme)

  const handlePress = React.useCallback(() => onPress(), [onPress])

  const renderInitial = () => (paymentMethod == null && wallet == null ? <EdgeText style={styles.textInitial}>{emptyLabel}</EdgeText> : null)

  const renderAccount = () => (
    <View style={styles.currencyRow}>
      {paymentMethod ? (
        <PaymentMethodRow paymentMethod={paymentMethod} pluginId="wyre" marginRem={[0, 0.5, 0, 0.5]} />
      ) : wallet ? (
        <CurrencyRow tokenId={tokenId} wallet={wallet} customAsset={customAsset} marginRem={[0, 0.5, 0, 0.5]} />
      ) : null}
    </View>
  )

  return (
    <TappableCard onPress={handlePress} paddingRem={0.5} marginRem={marginRem}>
      {renderInitial()}
      {renderAccount()}
    </TappableCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    currencyRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: theme.rem(0.5),
      marginBottom: theme.rem(0.5)
    },
    textInitial: {
      alignSelf: 'flex-start',
      fontSize: theme.rem(0.75),
      fontFamily: theme.fontFaceMedium,
      margin: theme.rem(1)
    }
  }
})

export const TappableAccountCard = React.memo(TappableAccountCardComponent)
