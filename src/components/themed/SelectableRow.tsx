import * as React from 'react'
import { type StyleProp, View, type ViewStyle } from 'react-native'

import {
  fixSides,
  mapSides,
  sidesToMargin,
  sidesToPadding
} from '../../util/sides'
import { EdgeCard } from '../cards/EdgeCard'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  /** When undefined, the row is dimmed and non-interactive */
  onPress?: () => void | Promise<void>
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
  const {
    icon,
    title,
    subTitle,
    minimumFontScale = 0.65,
    marginRem,
    onPress
  } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const isDisabled = onPress == null

  // Row content (shared between enabled and disabled states)
  const rowContent = (
    <View style={styles.rowContainer}>
      {/* HACK: Keeping the iconContainer instead of CardUi4's built-in icon prop because the prop's behavior is inconsistent in legacy use cases */}
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.textContainer}>
        <EdgeText numberOfLines={1}>{title}</EdgeText>
        {subTitle != null ? (
          <EdgeText
            style={styles.subTitle}
            numberOfLines={2}
            minimumFontScale={minimumFontScale}
          >
            {subTitle}
          </EdgeText>
        ) : null}
      </View>
    </View>
  )

  // Disabled: Use simple View mimicking EdgeCard appearance (avoids extra wrapper)
  if (isDisabled) {
    const margin = sidesToMargin(mapSides(fixSides(marginRem, 0.5), theme.rem))
    const padding = sidesToPadding(
      mapSides(fixSides(marginRem, 0.5), theme.rem)
    )
    const disabledStyle: StyleProp<ViewStyle> = [
      styles.disabledCard,
      margin,
      padding
    ]
    return <View style={disabledStyle}>{rowContent}</View>
  }

  // Enabled: Use EdgeCard for full interactivity
  return (
    <EdgeCard onPress={onPress} marginRem={marginRem}>
      {rowContent}
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
  },
  // Mimics EdgeCard appearance for disabled state
  disabledCard: {
    borderRadius: theme.cardBorderRadius,
    backgroundColor: theme.cardBaseColor,
    alignSelf: 'stretch',
    opacity: 0.3
  }
}))
