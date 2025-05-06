import * as React from 'react'
import LinearGradient from 'react-native-linear-gradient'

import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { DEFAULT_MARGIN_REM } from './Margins'

interface Props {
  /** Extend to the right outside of the container. For scene-level usage. */
  extendRight?: boolean
  /** @deprecated Only to be used during the UI4 transition */
  marginRem?: number[] | number

  /** Unused by current Edge themes, but supported for third-party integrations. */
  colors?: string[]
}

const start = { x: 0, y: 0.5 }
const end = { x: 1, y: 0.5 }

/**
 * A simple horizontal divider line for separating content sections.
 * Uses the theme's thinLineWidth and lineDivider color for consistent styling.
 */
export const DividerLine = (props: Props): JSX.Element => {
  const { extendRight = false, marginRem } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const { colors = theme.dividerLineColors } = props

  const margin = marginRem != null ? sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem)) : extendRight ? styles.extendRight : styles.default

  return <LinearGradient colors={colors} start={start} end={end} style={[styles.divider, margin]} />
}

const getStyles = cacheStyles((theme: Theme) => ({
  divider: {
    height: theme.thinLineWidth,
    borderBottomWidth: theme.thinLineWidth,
    borderBottomColor: theme.lineDivider
  },
  extendRight: {
    marginVertical: theme.rem(DEFAULT_MARGIN_REM),
    marginLeft: theme.rem(1),
    marginRight: -theme.rem(1)
  },
  default: {
    margin: theme.rem(DEFAULT_MARGIN_REM)
  }
}))
