import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { cacheStyles } from 'react-native-patina'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { useHandler } from '../../hooks/useHandler'
import { styled } from '../hoc/styled'
import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  iconUri: string
  title: string
  message: string
  onPress: () => void | Promise<void>
  onClose?: () => void | Promise<void>
}

const NotificationCardComponent = (props: Props) => {
  const { iconUri, title, message, onClose, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

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
        <View>
          <TitleText>{title}</TitleText>
          <MessageText numberOfLines={3}>{message}</MessageText>
        </View>
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
    alignItems: 'center',
    backgroundColor: theme.modal,
    borderRadius: theme.rem(0.5),
    elevation: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: theme.rem(0.5),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: theme.rem(0.5),
    margin: theme.rem(0.25)
  }
}))

const Icon = styled(FastImage)(theme => ({
  height: theme.rem(2.5),
  width: theme.rem(2.5),
  marginRight: theme.rem(0.25)
}))

const TitleText = styled(EdgeText)(theme => ({
  color: theme.warningIcon,
  marginHorizontal: theme.rem(0.25),
  fontSize: theme.rem(0.75),
  fontFamily: theme.fontFaceBold
}))

const MessageText = styled(EdgeText)(theme => ({
  color: theme.warningIcon,
  marginHorizontal: theme.rem(0.25),
  fontSize: theme.rem(0.75)
}))

const Contents = styled(TouchableOpacity)((theme: Theme) => ({
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  margin: theme.rem(0.25)
}))

const CloseButton = styled(TouchableOpacity)((theme: Theme) => ({
  margin: theme.rem(0.25)
}))

export const NotificationCard = React.memo(NotificationCardComponent)
