import {
  asMaybeInsufficientFundsError,
  asMaybeSwapAboveLimitError,
  asMaybeSwapBelowLimitError,
  asMaybeSwapCurrencyError,
  asMaybeSwapPermissionError,
  EdgeDenomination,
  EdgeSwapQuote,
  EdgeSwapRequest,
  EdgeSwapRequestOptions
} from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { convertNativeToDisplay } from '../../util/utils'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeAnim } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { InsufficientFeesModal } from '../modals/InsufficientFeesModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { SwapErrorDisplayInfo } from './SwapCreateScene'

export interface SwapProcessingParams {
  swapRequest: EdgeSwapRequest
  swapRequestOptions: EdgeSwapRequestOptions
  onCancel: () => void
  onDone: (quotes: EdgeSwapQuote[]) => void
}

interface Props extends EdgeSceneProps<'swapProcessing'> {}

const ANIM_DURATION = 5000

export function SwapProcessingScene(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { route, navigation } = props
  const { swapRequest, swapRequestOptions, onCancel, onDone } = route.params

  const account = useSelector(state => state.core.account)

  const fromDenomination = useDisplayDenom(swapRequest.fromWallet.currencyConfig, swapRequest.fromTokenId)
  const toDenomination = useDisplayDenom(swapRequest.toWallet.currencyConfig, swapRequest.toTokenId)

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
        const errorDisplayInfo = processSwapQuoteError({
          error,
          swapRequest,
          fromDenomination,
          toDenomination
        })

        navigation.navigate('swapTab', {
          screen: 'swapCreate',
          params: {
            fromWalletId: swapRequest.fromWallet.id,
            fromTokenId: swapRequest.fromTokenId,
            toWalletId: swapRequest.toWallet.id,
            toTokenId: swapRequest.toTokenId,
            errorDisplayInfo
          }
        })

        const insufficientFunds = asMaybeInsufficientFundsError(error)
        if (insufficientFunds != null && swapRequest.fromTokenId !== insufficientFunds.tokenId) {
          await Airship.show(bridge => (
            <InsufficientFeesModal bridge={bridge} coreError={insufficientFunds} navigation={navigation} wallet={swapRequest.fromWallet} />
          ))
        }
      }

      return () => {
        mounted.current = false
      }
    },
    [swapRequest, swapRequestOptions, onDone],
    'SwapProcessingScene'
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
            <ButtonsView
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

function processSwapQuoteError({
  error,
  swapRequest,
  fromDenomination,
  toDenomination
}: {
  error: unknown
  swapRequest: EdgeSwapRequest
  fromDenomination: EdgeDenomination
  toDenomination: EdgeDenomination
}): SwapErrorDisplayInfo | undefined {
  // Basic sanity checks (should never fail):
  if (error == null) return

  // Some plugins get the insufficient funds error wrong:
  const errorMessage = error instanceof Error ? error.message : String(error)

  // Check for known error types:
  const insufficientFunds = asMaybeInsufficientFundsError(error)
  if (insufficientFunds != null || errorMessage === 'InsufficientFundsError') {
    return {
      title: lstrings.exchange_insufficient_funds_title,
      message: lstrings.exchange_insufficient_funds_message
    }
  }

  const aboveLimit = asMaybeSwapAboveLimitError(error)
  if (aboveLimit != null) {
    const currentCurrencyDenomination = aboveLimit.direction === 'to' ? toDenomination : fromDenomination

    const { nativeMax } = aboveLimit
    const nativeToDisplayRatio = currentCurrencyDenomination.multiplier
    const displayMax = convertNativeToDisplay(nativeToDisplayRatio)(nativeMax)

    return {
      title: lstrings.exchange_generic_error_title,
      message: sprintf(lstrings.amount_above_limit, displayMax, currentCurrencyDenomination.name)
    }
  }

  const belowLimit = asMaybeSwapBelowLimitError(error)
  if (belowLimit) {
    const currentCurrencyDenomination = belowLimit.direction === 'to' ? toDenomination : fromDenomination

    const { nativeMin } = belowLimit
    const nativeToDisplayRatio = currentCurrencyDenomination.multiplier
    const displayMin = convertNativeToDisplay(nativeToDisplayRatio)(nativeMin)

    return {
      title: lstrings.exchange_generic_error_title,
      message: sprintf(lstrings.amount_below_limit, displayMin, currentCurrencyDenomination.name)
    }
  }

  const currencyError = asMaybeSwapCurrencyError(error)
  if (currencyError != null) {
    const fromCurrencyCode = getCurrencyCode(swapRequest.fromWallet, swapRequest.fromTokenId)
    const toCurrencyCode = getCurrencyCode(swapRequest.toWallet, swapRequest.toTokenId)

    return {
      title: lstrings.exchange_generic_error_title,
      message: sprintf(lstrings.ss_unable, fromCurrencyCode, toCurrencyCode)
    }
  }

  const permissionError = asMaybeSwapPermissionError(error)
  if (permissionError?.reason === 'geoRestriction') {
    return {
      title: lstrings.exchange_generic_error_title,
      message: lstrings.ss_geolock
    }
  }

  // Anything else:
  return {
    title: lstrings.exchange_generic_error_title,
    message: errorMessage
  }
}
