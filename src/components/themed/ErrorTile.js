// @flow
import * as React from 'react'

import s from '../../locales/strings.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText'
import { Tile } from './Tile.js'

type Props = {
  message: string,
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
