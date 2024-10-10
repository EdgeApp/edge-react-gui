import * as React from 'react'
import { Platform, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { ShadowedView } from 'react-native-fast-shadow'
import { cacheStyles } from 'react-native-patina'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { useHandler } from '../../hooks/useHandler'
import { getThemedIconUri } from '../../util/CdnUris'
import { BlurBackground } from '../common/BlurBackground'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { styled } from '../hoc/styled'
import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  message: string
  title: string
  type: 'warning' | 'info'
  /** If true, no close button is present, and the notification will remain
   * visible if the body is tapped. Default false. */
  persistent?: boolean
  iconUri?: string

  onPress: () => void | Promise<void>

  /** If provided, adds a close button to the right. */
  onClose?: () => void | Promise<void>
}

const NotificationCardComponent = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { title, type, message, persistent = false, onClose, onPress } = props
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
    if (!persistent) setVisible(false)
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
    <ShadowedView style={Platform.OS === 'android' ? styles.shadowAndroid : styles.shadowIos}>
      <BlurBackground />
      <Animated.View style={[styles.cardContainer, animatedStyle]}>
        <TouchableContents onPress={handlePress}>
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
        </TouchableContents>
        {onClose != null ? (
          <TouchableCloseButton onPress={handleClose}>
            <AntDesignIcon color={theme.iconTappable} name="close" size={theme.rem(1.25)} />
          </TouchableCloseButton>
        ) : null}
      </Animated.View>
    </ShadowedView>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    alignItems: 'center',
    backgroundColor: theme.cardBaseColor,
    borderRadius: theme.cardBorderRadius,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: theme.rem(0.5),
    marginTop: 0
  },
  shadowIos: {
    borderRadius: theme.cardBorderRadius,
    marginVertical: theme.rem(0.25),
    // TODO: Design approval that we don't need to make ios/android specific
    // adjustments here.
    ...theme.notifcationCardShadow
  },
  shadowAndroid: {
    overflow: 'hidden',
    borderRadius: theme.cardBorderRadius,
    marginVertical: theme.rem(0.25),
    // TODO: Design approval that we don't need to make ios/android specific
    // adjustments here.
    ...theme.notifcationCardShadow
  }
}))

const Icon = styled(FastImage)(theme => ({
  height: theme.rem(3.5),
  width: theme.rem(3.5),
  marginRight: theme.rem(0.25)
}))

const TitleText = styled(EdgeText)<{ type: 'warning' | 'info' }>(theme => props => ({
  color: props.type === 'warning' ? theme.warningIcon : theme.primaryText,
  marginHorizontal: theme.rem(0.25),
  marginBottom: theme.rem(0.25),
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

const TouchableContents = styled(EdgeTouchableOpacity)((theme: Theme) => ({
  flexShrink: 1,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  margin: theme.rem(0.25)
}))

const TouchableCloseButton = styled(EdgeTouchableOpacity)((theme: Theme) => ({
  margin: theme.rem(0.25)
}))

export const NotificationCard = React.memo(NotificationCardComponent)
