import * as React from 'react'
import { View } from 'react-native'

import { DividerLineUi4 } from '../common/DividerLineUi4'
import { DEFAULT_MARGIN_REM } from '../common/Margins'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  title: string
}

/**
 * @deprecated SceneHeaderUi4 should only be implemented by the SceneContainer
 * component where the `headerTitle` prop is passed to SceneHeaderUi4.
 * For the record, Sam H. is not 100% convinced of this inheritance approach,
 * he is compliant to this request by peer-review.
 */
export const SceneHeaderUi4 = (props: Props) => {
  const { title } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>{title == null ? null : <EdgeText style={styles.title}>{title}</EdgeText>}</View>
      <DividerLineUi4 extendRight />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    justifyContent: 'center',
    overflow: 'visible',
    paddingBottom: theme.rem(DEFAULT_MARGIN_REM)
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: theme.rem(DEFAULT_MARGIN_REM),
    marginBottom: theme.rem(DEFAULT_MARGIN_REM)
  },
  title: {
    fontSize: theme.rem(1.2),
    fontFamily: theme.fontFaceMedium
  }
}))
