import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { cacheStyles } from 'react-native-patina'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { useHandler } from '../../hooks/useHandler'
import { toLocaleDate, toLocaleTime } from '../../locales/intl'
import { getThemedIconUri } from '../../util/CdnUris'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  date: Date
  message: string
  title: string
  type: 'warning' | 'info'
  pinned?: boolean
  iconUri?: string

  onPress: () => void | Promise<void>
  onClose?: () => void | Promise<void>
}

export const NotificationCenterRow = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { date, title, type, message, pinned = false, onPress, onClose } = props
  const { iconUri = type === 'warning' ? getThemedIconUri(theme, 'notifications/icon-warning') : getThemedIconUri(theme, 'notifications/icon-info') } = props

  return (
    <View style={styles.columnContainer}>
      <EdgeText style={styles.dateText}>{toLocaleDate(date)}</EdgeText>
      <View style={styles.rowContainer}>
        <View style={pinned ? styles.noDot : styles.dot} />
        <NotificationCenterCard date={date} message={message} title={title} type={type} iconUri={iconUri} onPress={onPress} onClose={onClose} />
      </View>
    </View>
  )
}

interface NotificationCenterCardProps {
  date: Date
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

  const { date, title, type, message, onPress, onClose } = props
  const { iconUri = type === 'warning' ? getThemedIconUri(theme, 'notifications/icon-warning') : getThemedIconUri(theme, 'notifications/icon-info') } = props

  const handlePress = useHandler(async () => {
    await onPress()
  })

  const handleClose = useHandler(async () => {
    if (onClose != null) await onClose()
  })

  return (
    <View style={styles.cardContainer}>
      <EdgeTouchableOpacity style={styles.touchable} onPress={handlePress}>
        <FastImage style={styles.icon} source={{ uri: iconUri }} />
        <View style={styles.cardContentContainer}>
          <View style={styles.titleContainer}>
            <EdgeText style={styles.titleText} numberOfLines={3}>
              {title}
            </EdgeText>
            <EdgeText style={styles.timeText}>{toLocaleTime(date)}</EdgeText>
          </View>
          <EdgeText style={styles.messageText} numberOfLines={3}>
            {message}
          </EdgeText>
        </View>
      </EdgeTouchableOpacity>
      {onClose == null ? null : (
        <EdgeTouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <AntDesignIcon color={theme.iconTappable} name="close" size={theme.rem(1.25)} />
        </EdgeTouchableOpacity>
      )}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.cardBaseColor,
    borderRadius: theme.cardBorderRadius,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: theme.rem(0.5),
    marginTop: 0,
    marginRight: theme.rem(0.5)
  },
  cardContentContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  touchable: {
    flex: 1,
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    margin: theme.rem(0.25)
  },
  messageText: {
    marginHorizontal: theme.rem(0.25),
    fontSize: theme.rem(0.75),
    alignSelf: 'stretch'
  },
  titleText: {
    color: theme.primaryText,
    marginBottom: theme.rem(0.25),
    marginLeft: theme.rem(0.25),
    fontSize: theme.rem(0.75),
    fontFamily: theme.fontFaceBold,
    alignSelf: 'stretch',
    flexShrink: 1
  },
  titleContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between'
  },
  timeText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText,
    marginLeft: theme.rem(0.25)
  },
  closeButton: {
    margin: theme.rem(0.25)
  },
  icon: {
    height: theme.rem(3),
    width: theme.rem(3),
    marginRight: theme.rem(0.25)
  },

  dateText: {
    fontSize: theme.rem(0.75),
    marginLeft: theme.rem(1.5)
  },
  columnContainer: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    marginRight: theme.rem(0.5),
    marginVertical: theme.rem(0.25)
  },
  rowContainer: {
    flexDirection: 'row',
    alignSelf: 'stretch',
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
