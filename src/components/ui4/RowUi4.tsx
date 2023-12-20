import Clipboard from '@react-native-clipboard/clipboard'
import * as React from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { triggerHaptic } from '../../util/haptic'
import { showError, showToast } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

const textHeights = {
  small: 2,
  medium: 3,
  large: 0
}

export type RowType = 'copy' | 'editable' | 'questionable' | 'loading' | 'default' | 'touchable' | 'delete'

interface Props {
  body?: string
  children?: React.ReactNode
  error?: boolean
  onLongPress?: () => Promise<void> | void
  onPress?: () => Promise<void> | void
  title?: string
  type?: RowType
  maximumHeight?: 'small' | 'medium' | 'large'
  icon?: React.ReactNode
}

export const RowUi4 = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { body, title, children, maximumHeight = 'medium', error, icon, onLongPress, onPress } = props
  const { type = onLongPress == null && onPress == null ? 'default' : 'touchable' } = props

  const numberOfLines = textHeights[maximumHeight]

  const handlePress = useHandler(async () => {
    if (type === 'copy' && body != null) {
      triggerHaptic('impactLight')
      Clipboard.setString(body)
      showToast(lstrings.fragment_copied)
    } else if (onPress != null) {
      triggerHaptic('impactLight')
      try {
        await onPress()
      } catch (err) {
        showError(err)
      }
    }
  })

  const handleLongPress = useHandler(async () => {
    if (onLongPress != null) {
      triggerHaptic('impactLight')
      try {
        await onLongPress()
      } catch (err) {
        showError(err)
      }
    }
  })

  const content = (
    <View style={styles.container}>
      {icon == null ? null : <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.content}>
        {title == null ? null : (
          <EdgeText disableFontScaling ellipsizeMode="tail" style={error ? styles.textHeaderError : styles.textHeader}>
            {title}
          </EdgeText>
        )}
        {children == null ? (
          body == null ? null : (
            <EdgeText style={styles.textBody} numberOfLines={numberOfLines} ellipsizeMode="tail">
              {body}
            </EdgeText>
          )
        ) : (
          children
        )}
      </View>
      <View style={styles.rightButtonContainer}>
        {type === 'touchable' && <FontAwesome5 name="chevron-right" style={styles.tappableIcon} size={theme.rem(1)} />}
        {type === 'editable' && <FontAwesomeIcon name="edit" style={styles.tappableIcon} size={theme.rem(1)} />}
        {type === 'copy' && <FontAwesomeIcon name="copy" style={styles.tappableIcon} size={theme.rem(1)} />}
        {type === 'delete' && <FontAwesomeIcon name="times" style={styles.tappableIcon} size={theme.rem(1)} />}
        {type === 'questionable' && <SimpleLineIcons name="question" style={styles.tappableIcon} size={theme.rem(1)} />}
      </View>
    </View>
  )

  return type === 'loading' ? (
    <View style={styles.container}>
      <View style={styles.content}>
        <EdgeText style={styles.textHeader}>{title}</EdgeText>
        <ActivityIndicator style={styles.loader} color={theme.primaryText} size="large" />
      </View>
    </View>
  ) : type === 'touchable' ? (
    <TouchableOpacity accessible={false} onPress={handlePress} onLongPress={handleLongPress} disabled={handlePress == null && handleLongPress == null}>
      {content}
    </TouchableOpacity>
  ) : (
    content
  )
}

// TODO: Adjust margin/padding so everything combines with correct layout no
// matter the combination of UI4 components.
const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    backgroundColor: theme.tileBackground,
    paddingHorizontal: theme.rem(0.5),
    paddingVertical: theme.rem(0.25),
    flexDirection: 'row',
    alignItems: 'center'
  },
  content: {
    flex: 1
  },
  iconContainer: {
    marginRight: theme.rem(0.5)
  },
  rightButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  tappableIcon: {
    color: theme.iconTappable,
    marginLeft: theme.rem(0.5),
    textAlign: 'center'
  },
  textHeader: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75),
    paddingBottom: theme.rem(0.25),
    paddingRight: theme.rem(1)
  },
  textHeaderError: {
    color: theme.dangerText,
    fontSize: theme.rem(0.75)
  },
  textBody: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  loader: {
    marginTop: theme.rem(0.25)
  }
}))
