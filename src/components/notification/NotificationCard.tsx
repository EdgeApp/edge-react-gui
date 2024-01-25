import * as React from 'react'
import { Platform, TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { cacheStyles } from 'react-native-patina'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { useHandler } from '../../hooks/useHandler'
import { getThemedIconUri } from '../../util/CdnUris'
import { styled } from '../hoc/styled'
import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  message: string
  title: string
  type: 'warning' | 'info'
  iconUri?: string

  onPress: () => void | Promise<void>
  onClose?: () => void | Promise<void>
}

const NotificationCardComponent = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { title, type, message, onClose, onPress } = props
  const { iconUri = type === 'warning' ? getThemedIconUri(theme, 'notifications/icon-warning') : getThemedIconUri(theme, 'notifications/icon-info') } = props

  const opacity = useSharedValue(1)
  const [visible, setVisible] = React.useState(true)
  const [nullComponent, setNullComponent] = React.useState(false)

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }))

  // Delayed null return of the component, after fade-out completes
  const handleNullComponent = useHandler(() => {
    setNullComponent(true)
  })

  const handlePress = useHandler(async () => {
    await onPress()
    setVisible(false)
  })

  const handleClose = useHandler(async () => {
    if (onClose != null) await onClose()
    setVisible(false)
  })

  // Handle fade-in, fade-out
  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 500 }, () => {
        runOnJS(() => {
          setNullComponent(false)
        })
      })
    } else {
      opacity.value = withTiming(0, { duration: 500 }, () => {
        runOnJS(handleNullComponent)()
      })
    }
  }, [handleNullComponent, opacity, visible])

  return nullComponent ? null : (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <Contents onPress={handlePress}>
        <Icon source={{ uri: iconUri }} />
        <TextView>
          <TitleText type={type}>{title}</TitleText>
          {/* Android font scaling is too aggressive. 
              Android prioritizes font shrinking much more before trying to add
              newlines, while iOS prioritizes newlines before shrinking text.
              We already use smaller text here so we shouldn't shrink it
              more */}
          <MessageText type={type} numberOfLines={3} disableFontScaling={Platform.OS === 'android'}>
            {message}
          </MessageText>
        </TextView>
      </Contents>
      {onClose != null ? (
        <CloseButton onPress={handleClose}>
          <AntDesignIcon color={theme.iconTappable} name="close" size={theme.rem(1.25)} />
        </CloseButton>
      ) : null}
    </Animated.View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: theme.rem(0.5)
      },
      android: {
        elevation: 5
      }
    }),
    alignItems: 'center',
    backgroundColor: theme.modal,
    borderRadius: theme.rem(0.5),
    flexDirection: 'row',
    justifyContent: 'center',
    padding: theme.rem(0.5),
    margin: theme.rem(0.5)
  }
}))

const Icon = styled(FastImage)(theme => ({
  height: theme.rem(2.5),
  width: theme.rem(2.5),
  marginRight: theme.rem(0.25)
}))

const TitleText = styled(EdgeText)<{ type: 'warning' | 'info' }>(theme => props => ({
  color: props.type === 'warning' ? theme.warningIcon : theme.primaryText,
  marginHorizontal: theme.rem(0.25),
  fontSize: theme.rem(0.75),
  fontFamily: theme.fontFaceBold
}))

const MessageText = styled(EdgeText)<{ type: 'warning' | 'info' }>(theme => props => ({
  color: props.type === 'warning' ? theme.warningIcon : theme.secondaryText,
  marginHorizontal: theme.rem(0.25),
  fontSize: theme.rem(0.75)
}))

const TextView = styled(View)(theme => ({
  flexShrink: 1,
  width: '100%'
}))

const Contents = styled(TouchableOpacity)((theme: Theme) => ({
  flexShrink: 1,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  margin: theme.rem(0.25)
}))

const CloseButton = styled(TouchableOpacity)((theme: Theme) => ({
  margin: theme.rem(0.25)
}))

export const NotificationCard = React.memo(NotificationCardComponent)
