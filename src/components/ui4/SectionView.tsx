import * as React from 'react'
import { View } from 'react-native'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props {
  children: React.ReactNode | React.ReactNode[]
  wideSpacing?: boolean // For scene-level usage where wider spacing is required
}

/**
 * View that automatically adds horizontal dividers between each child, aligned
 * in a column layout. Adds no dividers if only one child is given.
 *
 * wideSpacing is meant for sectioning out a scene where more spacing is needed
 * between sections.
 */
export const SectionView = (props: Props): JSX.Element | null => {
  const { children, wideSpacing = false } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const nonNullChildren = React.Children.map(children, child => {
    if (child != null) {
      return child
    }
  })
  const numChildren = React.Children.count(nonNullChildren)

  if (children == null || numChildren === 0) return null

  // Add a line divider between each child if there's more than one:
  return (
    <View style={styles.container}>
      {numChildren === 1
        ? nonNullChildren
        : React.Children.map(nonNullChildren, (child, index) => {
            if (index < numChildren - 1) {
              return (
                <>
                  {child}
                  <View style={[styles.divider, { marginVertical: theme.rem(wideSpacing ? 0.5 : 0) }]} />
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
    flex: 1
  },
  divider: {
    height: theme.thinLineWidth,
    marginHorizontal: theme.rem(0.5),
    marginVertical: theme.rem(0.5),
    borderBottomWidth: theme.thinLineWidth,
    borderBottomColor: theme.lineDivider
  }
}))
