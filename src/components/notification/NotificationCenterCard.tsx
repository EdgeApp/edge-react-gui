import * as React from 'react'
import { Platform, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { cacheStyles } from 'react-native-patina'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { useHandler } from '../../hooks/useHandler'
import { getThemedIconUri } from '../../util/CdnUris'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  message: string
  title: string
  type: 'warning' | 'info'
  pinned?: boolean
  iconUri?: string

  onPress: () => void | Promise<void>
  // TODO: Consolidate close based on deviceNotifInfo key and where the card
  // is used. Reuse in NotificationView Card
  onClose?: () => void | Promise<void>
}

export const NotificationCenterRow = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { title, type, message, pinned = false, onPress, onClose } = props
  const { iconUri = type === 'warning' ? getThemedIconUri(theme, 'notifications/icon-warning') : getThemedIconUri(theme, 'notifications/icon-info') } = props

  return (
    <Animated.View style={styles.columnContainer}>
      <EdgeText style={styles.dateText}>test</EdgeText>
      <View style={styles.rowContainer}>
        <View style={pinned ? styles.noDot : styles.dot} />
        <NotificationCenterCard message={message} title={title} type={type} iconUri={iconUri} onPress={onPress} />
      </View>
    </Animated.View>
  )
}

interface NotificationCenterCardProps {
  message: string
  title: string
  type: 'warning' | 'info'

  /** If true, no close button is present, and the notification will remain
   * visible if the body is tapped. Default false. */
  iconUri?: string

  onPress: () => void | Promise<void>
  onClose?: () => void | Promise<void>
}

const NotificationCenterCard = (props: NotificationCenterCardProps) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { title, type, message, onPress, onClose } = props
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
  })

  const handleClose = useHandler(async () => {
    if (onClose != null) await onClose()

    // TODO: maybe not needed
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
      <EdgeTouchableOpacity style={styles.touchable} onPress={handlePress}>
        <FastImage style={styles.icon} source={{ uri: iconUri }} />
        <View style={styles.cardContentContainer}>
          <EdgeText style={styles.titleText}>{title}</EdgeText>
          {/* Android font scaling is too aggressive. 
              Android prioritizes font shrinking much more before trying to add
              newlines, while iOS prioritizes newlines before shrinking text.
              We already use smaller text here so we shouldn't shrink it
              more */}
          <EdgeText style={styles.messageText} numberOfLines={3} disableFontScaling={Platform.OS === 'android'}>
            {message}
          </EdgeText>
        </View>
      </EdgeTouchableOpacity>
      {onClose == null ? null : (
        <EdgeTouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <AntDesignIcon color={theme.iconTappable} name="close" size={theme.rem(1.25)} />
        </EdgeTouchableOpacity>
      )}
    </Animated.View>
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
  cardContentContainer: {
    flexShrink: 1,
    flexGrow: 1,
    justifyContent: 'center'
  },
  touchable: {
    flexShrink: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    margin: theme.rem(0.25)
  },
  messageText: {
    marginHorizontal: theme.rem(0.25),
    fontSize: theme.rem(0.75)
  },
  titleText: {
    color: theme.primaryText,
    marginHorizontal: theme.rem(0.25),
    marginBottom: theme.rem(0.25),
    fontSize: theme.rem(0.75),
    fontFamily: theme.fontFaceBold
  },
  closeButton: {
    margin: theme.rem(0.25)
  },
  icon: {
    height: theme.rem(3.5),
    width: theme.rem(3.5),
    marginRight: theme.rem(0.25)
  },

  dateText: {
    fontSize: theme.rem(0.75),
    marginLeft: theme.rem(1.5)
  },
  columnContainer: {
    marginRight: theme.rem(1)
  },
  rowContainer: {
    flexDirection: 'row',
    flexShrink: 1,
    flexGrow: 1,
    alignItems: 'center'
  },
  dot: {
    width: theme.rem(0.5),
    height: theme.rem(0.5),
    backgroundColor: 'red',
    margin: theme.rem(0.5),
    borderRadius: theme.rem(0.25)
  },
  noDot: {
    margin: theme.rem(1)
  }
}))
