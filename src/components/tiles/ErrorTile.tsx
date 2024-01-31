import * as React from 'react'

import { lstrings } from '../../locales/strings'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { RowUi4 } from '../ui4/RowUi4'

interface Props {
  message: string
  numberOfLines?: number
}

export const ErrorTile = (props: Props) => {
  const { message, numberOfLines = 3 } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <RowUi4 title={lstrings.send_scene_error_title}>
      <EdgeText style={styles.errorMessage} numberOfLines={numberOfLines}>
        {message}
      </EdgeText>
    </RowUi4>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  errorMessage: {
    color: theme.dangerText
  }
}))
