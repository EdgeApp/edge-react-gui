import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { cacheStyles, useTheme } from '../services/ThemeContext'
import { PillButton } from './PillButton'

export interface AmountPercentButtonsProps {
  /** Runs the scene's fee-aware max flow. The 100% pill hides without it. */
  onMaxPress?: () => void | Promise<void>
  /** Receives '25', '50', or '75'. */
  onPercentPress: (percent: string) => void
  /** Shows a spinner in the 100% pill while the max amount computes. */
  maxPending?: boolean
  /** Disables the 25%, 50%, and 75% pills. */
  partialDisabled?: boolean
}

const PARTIAL_PERCENTS = ['25', '50', '75']

/** A row of pills that pick a share of the balance as the amount. */
export const AmountPercentButtons: React.FC<AmountPercentButtonsProps> = (
  props: AmountPercentButtonsProps
) => {
  const {
    maxPending = false,
    onMaxPress,
    onPercentPress,
    partialDisabled = false
  } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      {PARTIAL_PERCENTS.map(percent => (
        <PartialPill
          key={percent}
          disabled={partialDisabled}
          percent={percent}
          onPress={onPercentPress}
        />
      ))}
      {onMaxPress == null ? null : (
        <PillButton
          aroundRem={0}
          disabled={maxPending}
          label={maxPending ? undefined : percentLabel('100')}
          testID="amountPercent100"
          onPress={onMaxPress}
        >
          {maxPending ? (
            <ActivityIndicator color={theme.iconTappable} size="small" />
          ) : null}
        </PillButton>
      )}
    </View>
  )
}

interface PartialPillProps {
  disabled: boolean
  percent: string
  onPress: (percent: string) => void
}

const PartialPill: React.FC<PartialPillProps> = (props: PartialPillProps) => {
  const { disabled, percent, onPress } = props

  const handlePress = useHandler(() => {
    onPress(percent)
  })

  return (
    <PillButton
      aroundRem={0}
      disabled={disabled}
      label={percentLabel(percent)}
      testID={`amountPercent${percent}`}
      onPress={handlePress}
    />
  )
}

const getStyles = cacheStyles((theme: ReturnType<typeof useTheme>) => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginHorizontal: theme.rem(0.5),
    marginTop: theme.rem(0.5)
  }
}))

const percentLabel = (percent: string): string =>
  sprintf(lstrings.percent_amount_1s, percent)
