// @flow

import { type Theme } from '../components/services/ThemeContext'
import { unpackEdges } from '../util/edges'

type Spacing = number[] | number

export function useSpacing(marginSpacing: Spacing = 1, paddingSpacing: Spacing = 1, theme: Theme) {
  const marginRem = unpackEdges(marginSpacing)
  const paddingRem = unpackEdges(paddingSpacing)

  return {
    marginBottom: theme.rem(marginRem.bottom),
    marginLeft: theme.rem(marginRem.left),
    marginRight: theme.rem(marginRem.right),
    marginTop: theme.rem(marginRem.top),
    paddingBottom: theme.rem(paddingRem.bottom),
    paddingLeft: theme.rem(paddingRem.left),
    paddingRight: theme.rem(paddingRem.right),
    paddingTop: theme.rem(paddingRem.top)
  }
}
