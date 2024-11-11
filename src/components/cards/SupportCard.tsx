import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { openBrowserUri } from '../../util/WebUtils'
import { ButtonsView } from '../buttons/ButtonsView'
import { Space } from '../layout/Space'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  title: string
  body: string
  buttonText: string
  url: string
}

export function SupportCard(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { title, body, buttonText, url } = props

  const handlePress = useHandler(() => {
    openBrowserUri(url)
  })

  return (
    <EdgeCard gradientBackground={theme.cardGradientLearn}>
      <Space aroundRem={0.5}>
        <EdgeText numberOfLines={1} style={styles.title}>
          {title}
        </EdgeText>
        <EdgeText numberOfLines={3} style={styles.body}>
          {body}
        </EdgeText>
        <ButtonsView secondary={{ label: buttonText, onPress: handlePress }} />
      </Space>
    </EdgeCard>
  )
}
const getStyles = cacheStyles((theme: Theme) => ({
  title: {
    margin: theme.rem(0.25),
    textAlign: 'center',
    fontSize: theme.rem(1.5),
    fontFamily: theme.fontFaceMedium
  },
  body: {
    textAlign: 'center',
    fontSize: theme.rem(1),
    margin: theme.rem(0.5),
    marginHorizontal: theme.rem(0.25),
    marginBottom: theme.rem(1)
  }
}))
