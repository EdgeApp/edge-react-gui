import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { BlurBackgroundNoRoundedCorners } from '../common/BlurBackground'
import { EdgeAnim, fadeInDown10 } from '../common/EdgeAnim'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import type { ButtonInfo } from './ButtonsView'
import { EdgeButton } from './EdgeButton'

interface Props {
  primary: ButtonInfo
  tertiary?: ButtonInfo
}

// Renders KAV buttons content:
// - If only primary: one full-width primary button
// - If tertiary provided: two mini buttons (tertiary left, primary right)
export const KavButtons: React.FC<Props> = props => {
  const { primary, tertiary } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const handlePrimaryPress = useHandler(() => {
    const res = primary.onPress?.()
    Promise.resolve(res).catch(() => {})
  })
  const handleTertiaryPress = useHandler(() => {
    const res = tertiary?.onPress?.()
    Promise.resolve(res).catch(() => {})
  })

  if (tertiary == null) {
    return (
      <EdgeButton
        type="primary"
        layout="fullWidth"
        label={primary.label}
        onPress={handlePrimaryPress}
        disabled={primary.disabled}
        spinner={primary.spinner}
        testID={primary.testID}
      />
    )
  }

  return (
    <EdgeAnim enter={fadeInDown10} style={styles.container}>
      <BlurBackgroundNoRoundedCorners />
      <EdgeButton
        type="tertiary"
        mini
        label={tertiary.label}
        // We don't want row layout because the buttons will fill the entire
        // space
        layout="column"
        onPress={handleTertiaryPress}
        disabled={tertiary.disabled}
        spinner={tertiary.spinner}
        testID={tertiary.testID}
        marginRem={[0.25, 0, 0, 0]} // HACK: The column configuration is the only way to avoid full-width hitslop, but it tightens tertiary spacing to make it look evenly spaced. This undos that spacing.
      />
      <EdgeButton
        type="primary"
        mini
        label={primary.label}
        // We don't want row layout because the buttons will fill the entire
        // space
        layout="column"
        onPress={handlePrimaryPress}
        disabled={primary.disabled}
        spinner={primary.spinner}
        testID={primary.testID}
      />
    </EdgeAnim>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.rem(0.5)
  },
  tertiary: {
    marginTop: theme.rem(0.25)
  }
}))
