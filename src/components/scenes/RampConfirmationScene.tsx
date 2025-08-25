import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { SceneContainer } from '../layout/SceneContainer'
import { EdgeRow } from '../rows/EdgeRow'
import { SafeSlider } from '../themed/SafeSlider'

export interface RampConfirmationParams {
  fiatCurrencyCode: string
  fiatAmount: string
  cryptoCurrencyCode: string
  cryptoAmount: string
  direction: 'buy' | 'sell'
  onConfirm: () => void
  onCancel: () => void
}

interface Props extends EdgeAppSceneProps<'rampConfirmation'> {}

export const RampConfirmationScene: React.FC<Props> = props => {
  const { navigation, route } = props
  const {
    fiatCurrencyCode,
    fiatAmount,
    cryptoCurrencyCode,
    cryptoAmount,
    direction,
    onConfirm,
    onCancel
  } = route.params

  const handleSlideComplete = useHandler(async (reset: () => void) => {
    onConfirm()
    reset()
  })

  React.useEffect(() => {
    return navigation.addListener('beforeRemove', e => {
      // If we're going back and haven't confirmed, call onCancel
      if (e.data.action.type === 'GO_BACK') {
        const routeName = navigation.getState()?.routes?.slice(-1)?.[0]?.name
        if (routeName === 'rampConfirmation') {
          onCancel()
        }
      }
    })
  }, [navigation, onCancel])

  const directionText =
    direction === 'buy'
      ? sprintf(lstrings.buy_1s, cryptoCurrencyCode)
      : sprintf(lstrings.sell_1s, cryptoCurrencyCode)

  const confirmationText =
    direction === 'buy'
      ? sprintf(lstrings.confirm_buy_1s, cryptoCurrencyCode)
      : sprintf(lstrings.confirm_sell_1s, cryptoCurrencyCode)

  const sourceAmount = direction === 'buy' ? fiatAmount : cryptoAmount
  const sourceCurrency =
    direction === 'buy' ? fiatCurrencyCode : cryptoCurrencyCode
  const targetAmount = direction === 'buy' ? cryptoAmount : fiatAmount
  const targetCurrency =
    direction === 'buy' ? cryptoCurrencyCode : fiatCurrencyCode

  const sourceAmountText = `${sourceAmount} ${sourceCurrency}`
  const targetAmountText = `${targetAmount} ${targetCurrency}`

  return (
    <SceneWrapper scroll>
      <SceneContainer headerTitle={directionText}>
        <SectionHeader leftTitle={confirmationText} />
        <EdgeCard sections>
          <EdgeRow title={lstrings.string_amount} body={sourceAmountText} />
          <EdgeRow
            title={
              direction === 'buy'
                ? lstrings.received
                : lstrings.trade_option_total_label
            }
            body={targetAmountText}
          />
        </EdgeCard>

        <SafeSlider disabled={false} onSlidingComplete={handleSlideComplete} />
      </SceneContainer>
    </SceneWrapper>
  )
}
