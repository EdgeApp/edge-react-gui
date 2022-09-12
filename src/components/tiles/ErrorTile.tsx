import * as React from 'react'

import s from '../../locales/strings'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Tile } from './Tile'

type Props = {
  message: string
  numberOfLines?: number
}

export const ErrorTile = (props: Props) => {
  const { message, numberOfLines = 3 } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <Tile type="static" title={s.strings.send_scene_error_title}>
      <EdgeText style={styles.errorMessage} numberOfLines={numberOfLines}>
        {message}
      </EdgeText>
    </Tile>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  errorMessage: {
    color: theme.dangerText
  }
}))
