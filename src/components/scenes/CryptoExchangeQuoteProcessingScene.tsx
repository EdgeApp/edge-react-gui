import { asMaybeInsufficientFundsError, EdgeSwapQuote, EdgeSwapRequest, EdgeSwapRequestOptions } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { processSwapQuoteError, selectWalletForExchange } from '../../actions/CryptoExchangeActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { EdgeAnim } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { InsufficientFeesModal } from '../modals/InsufficientFeesModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ButtonsViewUi4 } from '../ui4/ButtonsViewUi4'

export interface ExchangeQuoteProcessingParams {
  swapRequest: EdgeSwapRequest
  swapRequestOptions: EdgeSwapRequestOptions
  onCancel: () => void
  onDone: (quotes: EdgeSwapQuote[]) => void
}

interface Props extends EdgeSceneProps<'exchangeQuoteProcessing'> {}

const ANIM_DURATION = 5000

export function CryptoExchangeQuoteProcessingScene(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { route, navigation } = props
  const { swapRequest, swapRequestOptions, onCancel, onDone } = route.params

  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)

  const [isLongWait, setIsLongWait] = React.useState(false)

  const mounted = React.useRef<boolean>(true)

  // Set text to 'Locating a swap is taking longer than usual' if we have been
  // waiting for 20 seconds
  React.useEffect(() => {
    setTimeout(() => {
      if (!mounted.current) return
      setIsLongWait(true)
    }, 10000)

    return () => {
      mounted.current = false
    }
  }, [])

  useAsyncEffect(
    async () => {
      try {
        const quotes = await account.fetchSwapQuotes(swapRequest, swapRequestOptions)
        if (mounted.current) onDone(quotes)
      } catch (error: unknown) {
        navigation.navigate('exchangeTab', { screen: 'exchange' })

        const insufficientFunds = asMaybeInsufficientFundsError(error)
        if (insufficientFunds != null && swapRequest.fromTokenId !== insufficientFunds.tokenId) {
          const { tokenId } = insufficientFunds
          const currencyCode = getCurrencyCode(swapRequest.fromWallet, tokenId)

          await Airship.show(bridge => (
            <InsufficientFeesModal
              bridge={bridge}
              coreError={insufficientFunds}
              navigation={navigation}
              wallet={swapRequest.fromWallet}
              onSwap={() => {
                dispatch({ type: 'SHIFT_COMPLETE' })
                dispatch(selectWalletForExchange(swapRequest.fromWallet.id, currencyCode, 'to')).catch(err => showError(err))
              }}
            />
          ))
        }

        dispatch(processSwapQuoteError(error, swapRequest))
      }

      return () => {
        mounted.current = false
      }
    },
    [swapRequest, swapRequestOptions, onDone],
    'CryptoExchangeQuoteProcessingScene'
  )

  return (
    <SceneWrapper>
      <View style={styles.outerContainer}>
        <View style={styles.container}>
          <EdgeAnim enter={{ type: 'fadeInUp', distance: 90, duration: ANIM_DURATION }}>
            <EdgeText style={styles.title}>{lstrings.hang_tight}</EdgeText>
          </EdgeAnim>
          <EdgeAnim enter={{ type: 'fadeInUp', distance: 60, duration: ANIM_DURATION }}>
            <EdgeText style={styles.findingText} numberOfLines={3}>
              {isLongWait ? lstrings.exchange_slow : lstrings.trying_to_find}
            </EdgeText>
          </EdgeAnim>
          <EdgeAnim enter={{ type: 'fadeInDown', distance: 90, duration: ANIM_DURATION }}>
            <ActivityIndicator size="large" style={styles.spinner} color={theme.iconTappable} />
          </EdgeAnim>
        </View>
        {!isLongWait ? null : (
          <EdgeAnim style={styles.button} enter={{ type: 'fadeInDown', distance: 90 }}>
            <ButtonsViewUi4
              absolute
              primary={{
                label: lstrings.string_cancel_cap,
                onPress: () => {
                  mounted.current = false
                  onCancel()
                }
              }}
              layout="column"
              parentType="scene"
            />
          </EdgeAnim>
        )}
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  outerContainer: { flexGrow: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  spinner: {
    marginTop: theme.rem(3)
  },
  title: {
    width: '100%',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: theme.rem(1.5),
    marginBottom: theme.rem(1.25)
  },
  findingText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: theme.rem(1)
  },
  button: {
    marginVertical: theme.rem(1)
  }
}))
