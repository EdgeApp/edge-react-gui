import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import Animated from 'react-native-reanimated'

import { fadeInDownAnimation, LAYOUT_ANIMATION } from '../../constants/animationConstants'
import { useAsyncValue } from '../../hooks/useAsyncValue'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { QrCode } from '../themed/QrCode'

interface Props {
  address: string
  currencyCode: string
  wallet: EdgeCurrencyWallet

  nativeAmount?: string
  onPress?: (encodedUri?: string) => void
}

export const AddressQr = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { address, currencyCode, wallet, nativeAmount, onPress = () => {} } = props

  const [encodedUri] = useAsyncValue(
    async () => await wallet.encodeUri({ publicAddress: address, currencyCode, nativeAmount }),
    [address, currencyCode, nativeAmount, wallet]
  )

  return (
    <Animated.View style={styles.container} layout={LAYOUT_ANIMATION} entering={fadeInDownAnimation()}>
      <QrCode data={encodedUri} onPress={() => onPress(encodedUri)} marginRem={0} />
    </Animated.View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    aspectRatio: 1,
    height: '100%',
    width: '100%',
    alignSelf: 'center'
  }
}))
