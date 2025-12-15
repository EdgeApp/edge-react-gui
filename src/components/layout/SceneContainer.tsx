import * as React from 'react'
import { View } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { DividerLineUi4 } from '../common/DividerLineUi4'
import { DEFAULT_MARGIN_REM } from '../common/Margins'
import type { UndoInsetStyle } from '../common/SceneWrapper'
import { type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  headerTitle?: string
  headerTitleChildren?: React.ReactNode
  children?: React.ReactNode
  undoInsetStyle?: UndoInsetStyle
}

export const SceneContainer: React.FC<Props> = (props: Props) => {
  const { children, headerTitle, headerTitleChildren, undoInsetStyle } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const contentInsets = React.useMemo(
    () => ({
      ...undoInsetStyle,
      flex: 1,
      marginTop: 0,
      // Built-in padding if we're not using undoInsetStyle
      paddingHorizontal:
        undoInsetStyle == null ? theme.rem(DEFAULT_MARGIN_REM) : 0,
      paddingBottom: undoInsetStyle == null ? theme.rem(DEFAULT_MARGIN_REM) : 0
    }),
    [theme, undoInsetStyle]
  )

  return (
    <>
      {headerTitle != null ? (
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <EdgeText style={styles.title}>{headerTitle}</EdgeText>
            {headerTitleChildren}
          </View>
          <DividerLineUi4 extendRight />
        </View>
      ) : null}
      <View style={contentInsets}>{children}</View>
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  headerContainer: {
    justifyContent: 'center',
    overflow: 'visible',
    paddingLeft: theme.rem(DEFAULT_MARGIN_REM)
  },
  title: {
    fontSize: theme.rem(1.2),
    fontFamily: theme.fontFaceMedium
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: theme.rem(DEFAULT_MARGIN_REM),
    marginBottom: theme.rem(DEFAULT_MARGIN_REM)
  }
}))
