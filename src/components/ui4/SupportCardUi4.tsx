import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { openBrowserUri } from '../../util/WebUtils'
import { Space } from '../layout/Space'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ButtonsViewUi4 } from './ButtonsViewUi4'
import { CardUi4 } from './CardUi4'

interface Props {
  title: string
  body: string
  buttonText: string
  url: string
}

export function SupportCardUi4(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { title, body, buttonText, url } = props

  const handlePress = useHandler(() => {
    openBrowserUri(url)
  })

  return (
    <CardUi4 gradientBackground={theme.cardGradientLearn}>
      <Space around={0.5}>
        <EdgeText numberOfLines={1} style={styles.title}>
          {title}
        </EdgeText>
        <EdgeText numberOfLines={3} style={styles.body}>
          {body}
        </EdgeText>
        <ButtonsViewUi4 secondary={{ label: buttonText, onPress: handlePress }} />
      </Space>
    </CardUi4>
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
