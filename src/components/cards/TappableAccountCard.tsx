import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { PaymentMethod } from '../../controllers/action-queue/WyreClient'
import { CurrencyRow } from '../data/row/CurrencyRow'
import { PaymentMethodRow } from '../data/row/PaymentMethodRow'
import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { TappableCard } from './TappableCard'

interface TappableAccountCardProps {
  emptyLabel: string
  onPress: () => void
  selectedAsset: SelectableAsset
}

export interface SelectableAsset {
  wallet?: EdgeCurrencyWallet
  tokenId?: string
  paymentMethod?: PaymentMethod
}

const TappableAccountCardComponent = (props: TappableAccountCardProps) => {
  const { emptyLabel, onPress, selectedAsset } = props
  const { paymentMethod, tokenId, wallet } = selectedAsset
  const theme = useTheme()
  const styles = getStyles(theme)

  const handlePress = React.useCallback(() => onPress(), [onPress])

  const renderInitial = () => (paymentMethod == null && wallet == null ? <EdgeText style={styles.textInitial}>{emptyLabel}</EdgeText> : null)

  const renderAccount = () => (
    <View style={styles.currencyRow}>
      {paymentMethod ? (
        <PaymentMethodRow paymentMethod={paymentMethod} pluginId="wyre" marginRem={[0, 0.5, 0, 0.5]} />
      ) : wallet ? (
        <CurrencyRow tokenId={tokenId} wallet={wallet} marginRem={[0, 0.5, 0, 0.5]} />
      ) : null}
    </View>
  )

  return (
    <TappableCard onPress={handlePress} marginRem={0.5} paddingRem={0.5}>
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
