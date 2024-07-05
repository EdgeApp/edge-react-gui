import * as React from 'react'
import { View } from 'react-native'

import { EdgeCard } from '../cards/EdgeCard'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  onPress: () => void | Promise<void>
  title: string | React.ReactNode

  subTitle?: string
  icon?: React.ReactNode
  minimumFontScale?: number

  /** @deprecated Only to be used during the UI4 transition */
  marginRem?: number[] | number
}

/**
 * Modified from UI3.
 * Similar to a CardUi4/RowUi4 combination, but emphasizes the first row instead
 * of the second row with primary colors.
 */
export const SelectableRow = (props: Props) => {
  const { icon, title, subTitle, minimumFontScale = 0.65, marginRem, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <EdgeCard onPress={onPress} marginRem={marginRem}>
      <View style={styles.rowContainer}>
        {/* HACK: Keeping the iconContainer instead of CardUi4's built-in icon prop because the prop's behavior is inconsistent in legacy use cases */}
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.textContainer}>
          <EdgeText numberOfLines={1}>{title}</EdgeText>
          {subTitle ? (
            <EdgeText style={styles.subTitle} numberOfLines={2} minimumFontScale={minimumFontScale}>
              {subTitle}
            </EdgeText>
          ) : null}
        </View>
      </View>
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  rowContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  iconContainer: {
    margin: theme.rem(0.5)
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    margin: theme.rem(0.5)
  },
  subTitle: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75),
    marginTop: theme.rem(0.25)
  }
}))
