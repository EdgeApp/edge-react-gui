import * as React from 'react'

import { lstrings } from '../../locales/strings'
import { EdgeRow } from '../rows/EdgeRow'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  message: string
  numberOfLines?: number
}

export const ErrorTile = (props: Props) => {
  const { message, numberOfLines = 3 } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <EdgeRow title={lstrings.send_scene_error_title}>
      <EdgeText style={styles.errorMessage} numberOfLines={numberOfLines}>
        {message}
      </EdgeText>
    </EdgeRow>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  errorMessage: {
    color: theme.dangerText
  }
}))
