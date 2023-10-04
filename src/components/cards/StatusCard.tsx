import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ButtonBox } from '../themed/ThemedButtons'
import { Card } from './Card'

interface Props {
  message: string
  title: string
  iconOrUri?: string | React.ReactNode
  onPress?: () => void
}

export function StatusCard(props: Props) {
  const { iconOrUri, message, title, onPress = () => {} } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <ButtonBox marginRem={[0, 0.5, 0, 0.5]} onPress={onPress}>
      <Card>
        <View style={styles.cardContainer}>
          {typeof iconOrUri === 'string' ? <FastImage resizeMode="contain" source={{ uri: iconOrUri }} style={styles.icon} /> : iconOrUri}
          <View style={styles.textContainer}>
            <EdgeText testID="statusCardTitle" numberOfLines={0} style={styles.title}>
              {title}
            </EdgeText>
            <EdgeText testID="statusCardMessage" numberOfLines={0}>
              {message}
            </EdgeText>
          </View>
        </View>
      </Card>
    </ButtonBox>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  textContainer: {
    flexDirection: 'column',
    flex: 1,
    paddingRight: theme.rem(0.25)
  },
  icon: {
    width: theme.rem(3),
    height: theme.rem(3),
    marginRight: theme.rem(0.5)
  },
  title: {
    fontFamily: theme.fontFaceMedium,
    marginBottom: theme.rem(0.25),
    marginRight: theme.rem(0.5)
  }
}))
