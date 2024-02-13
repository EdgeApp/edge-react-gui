import * as React from 'react'
import { View } from 'react-native'

import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props {
  children: React.ReactNode | React.ReactNode[]

  // For scene-level usage where we want the line to extend all the way to the
  // right
  extendRight?: boolean

  /** @deprecated Only to be used during the UI4 transition */
  marginRem?: number[] | number

  /** @deprecated Only to be used during the UI4 transition */
  dividerMarginRem?: number[] | number
}

const DEFAULT_MARGIN_REM = 0.5

/**
 * View that automatically adds horizontal dividers between each child, aligned
 * in a column layout. Adds no dividers if only one child is given.
 *
 * wideSpacing is meant for sectioning out a scene where more spacing is needed
 * between sections.
 */
export const SectionView = (props: Props): JSX.Element | null => {
  const { children, extendRight = false, marginRem, dividerMarginRem } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const margin = marginRem != null ? sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem)) : extendRight ? styles.marginScene : styles.marginCard
  const dividerMargin =
    dividerMarginRem != null
      ? sidesToMargin(mapSides(fixSides(dividerMarginRem, 0), theme.rem))
      : extendRight
      ? styles.dividerMarginScene
      : styles.dividerMarginCard

  const nonNullChildren = React.Children.map(children, child => {
    if (child != null) {
      return child
    }
  })
  const numChildren = React.Children.count(nonNullChildren)

  if (children == null || numChildren === 0) return null

  // Add a line divider between each child if there's more than one:
  return (
    <View style={[styles.container, margin]}>
      {numChildren === 1
        ? nonNullChildren
        : React.Children.map(nonNullChildren, (child, index) => {
            if (index < numChildren - 1) {
              return (
                <>
                  {child}
                  <View style={[styles.divider, dividerMargin]} />
                </>
              )
            }
            return child
          })}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1
  },
  marginCard: {
    marginVertical: theme.rem(0)
  },
  marginScene: {
    marginVertical: theme.rem(DEFAULT_MARGIN_REM)
  },
  divider: {
    height: theme.thinLineWidth,
    borderBottomWidth: theme.thinLineWidth,
    borderBottomColor: theme.lineDivider
  },
  dividerMarginScene: {
    marginVertical: theme.rem(DEFAULT_MARGIN_REM),
    marginLeft: theme.rem(1),
    marginRight: -theme.rem(DEFAULT_MARGIN_REM)
  },
  dividerMarginCard: {
    margin: theme.rem(DEFAULT_MARGIN_REM)
  }
}))
