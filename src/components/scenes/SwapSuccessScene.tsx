import { EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import ConfettiCannon from 'react-native-confetti-cannon'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps } from '../../types/routerTypes'
import { needToShowConfetti } from '../../util/show-confetti'
import { SceneButtons } from '../buttons/SceneButtons'
import { EdgeAnim, fadeIn } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export interface SwapSuccessParams {
  edgeTransaction: EdgeTransaction
  walletId: string
}

interface Props extends EdgeAppSceneProps<'swapSuccess'> {}

const confettiProps = {
  count: 250,
  origin: { x: -50, y: -50 },
  fallSpeed: 4000
}

export const SwapSuccessScene = (props: Props) => {
  const { navigation, route } = props
  const { edgeTransaction, walletId } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)

  const [showButton, setShowButton] = React.useState(false)
  const [showConfetti, setShowConfetti] = React.useState(false)

  const userId = useSelector(state => state.core.account.id)
  const disklet = useSelector(state => state.core.disklet)

  const handleDone = useHandler(() => {
    setShowButton(false)
    // Reset swap navigation stack:
    navigation.navigate('edgeTabs', { screen: 'swapTab', params: { screen: 'swapCreate' } })
  })

  const handleTransactionDetails = useHandler(() => {
    // Reset swap navigation stack:
    navigation.navigate('edgeTabs', { screen: 'swapTab', params: { screen: 'swapCreate' } })
    // Navigate to transaction details:
    navigation.navigate('transactionDetails', { edgeTransaction, walletId, onDone: handleDone })
  })

  useAsyncEffect(
    async () => {
      const show: boolean = await needToShowConfetti(userId, disklet)

      if (show) {
        setShowConfetti(true)
        setTimeout(() => {
          setShowButton(true)
        }, 4500)
      } else {
        setShowButton(true)
      }
    },
    [],
    'SwapSuccessScene'
  )

  const renderConfetti = () => {
    if (!showConfetti) return null
    return <ConfettiCannon {...confettiProps} />
  }

  return (
    <SceneWrapper hasNotifications>
      <View style={styles.container}>
        <EdgeText style={styles.title}>{lstrings.exchange_congratulations}</EdgeText>
        <EdgeText style={styles.text} numberOfLines={2}>
          {lstrings.exchange_congratulations_success}
        </EdgeText>
        <EdgeText style={[styles.text, styles.textInfo]} numberOfLines={3}>
          {lstrings.exchange_congratulations_note}
        </EdgeText>
        <EdgeAnim style={styles.animOverlay} visible={showButton} enter={fadeIn}>
          <SceneButtons
            primary={{ label: lstrings.string_done_cap, onPress: handleDone }}
            secondary={{
              label: lstrings.transaction_details,
              onPress: handleTransactionDetails
            }}
          />
        </EdgeAnim>
        {renderConfetti()}
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  animOverlay: {
    position: 'absolute',
    height: '100%',
    width: '100%'
  },
  container: {
    flexGrow: 1,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    width: '100%',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: theme.rem(1.25),
    marginBottom: theme.rem(1.25)
  },
  text: {
    maxWidth: theme.rem(10),
    textAlign: 'center',
    fontWeight: '600',
    fontSize: theme.rem(0.75),
    marginBottom: theme.rem(1.5)
  },
  textInfo: {
    maxWidth: theme.rem(9.5)
  }
}))
