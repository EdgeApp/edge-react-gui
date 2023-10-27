import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { lstrings } from '../../locales/strings'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ButtonBox } from '../themed/ThemedButtons'
import { Card } from './Card'

interface Props {
  message: string
  testIds: { title?: string; message: string; close: string }
  iconOrUri?: string | React.ReactNode
  title?: string
  onClose?: () => void
  onPress?: () => void
}

export function StatusCard(props: Props) {
  const { iconOrUri, message, title, testIds, onPress = () => {}, onClose } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <ButtonBox marginRem={0.5} onPress={onPress}>
      <Card>
        <View style={styles.cardContainer}>
          {typeof iconOrUri === 'string' ? <FastImage resizeMode="contain" source={{ uri: iconOrUri }} style={styles.icon} /> : iconOrUri}
          <View style={styles.textContainer}>
            {title == null ? null : (
              <EdgeText testID={testIds.title} numberOfLines={0} style={styles.title}>
                {title}
              </EdgeText>
            )}
            <EdgeText testID={testIds.message} numberOfLines={0}>
              {message}
            </EdgeText>
          </View>
          {onClose == null ? null : (
            <TouchableOpacity accessible={false} onPress={onClose}>
              <AntDesignIcon
                testID={testIds.close}
                name="close"
                color={theme.iconTappable}
                size={theme.rem(1)}
                style={styles.close}
                accessibilityHint={lstrings.close_hint}
              />
            </TouchableOpacity>
          )}
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
    padding: theme.rem(0.5)
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
  },
  close: {
    padding: theme.rem(0.5)
  }
}))
