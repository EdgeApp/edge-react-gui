import Clipboard from '@react-native-clipboard/clipboard'
import * as React from 'react'
import { ActivityIndicator, StyleProp, View, ViewStyle } from 'react-native'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { triggerHaptic } from '../../util/haptic'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { showToast } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

const textHeights = {
  small: 2,
  medium: 3,
  large: 0
}

export type RowActionIcon = 'copy' | 'editable' | 'questionable' | 'none' | 'touchable' | 'delete'

interface Props {
  body?: string
  children?: React.ReactNode
  error?: boolean
  icon?: React.ReactNode
  loading?: boolean
  maximumHeight?: 'small' | 'medium' | 'large'
  rightButtonType?: RowActionIcon
  title?: string
  onLongPress?: () => Promise<void> | void
  onPress?: () => Promise<void> | void
  /** @deprecated Only to be used during the UI4 transition */
  marginRem?: number[] | number
}

export const EdgeRow = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { body, title, children, maximumHeight = 'medium', error, icon, loading, marginRem, onLongPress, onPress } = props
  const { rightButtonType = onLongPress == null && onPress == null ? 'none' : 'touchable' } = props

  const margin = sidesToMargin(mapSides(fixSides(marginRem, 0.5), theme.rem))

  const numberOfLines = textHeights[maximumHeight]

  // TODO: Merge styles.containerTemp into styles.container permanently.
  // Explicitly setting the container style here to avoid unit test snapshot
  // diffs.
  const containerStyle: StyleProp<ViewStyle> = React.useMemo(() => [styles.container, margin], [styles.container, margin])

  const handlePress = useHandler(async () => {
    if (rightButtonType === 'copy' && body != null) {
      triggerHaptic('impactLight')
      Clipboard.setString(body)
      showToast(lstrings.fragment_copied)
    } else if (onPress != null) {
      triggerHaptic('impactLight')
      await onPress()
    }
  })

  const handleLongPress = useHandler(async () => {
    if (onLongPress != null) {
      triggerHaptic('impactLight')
      await onLongPress()
    }
  })

  const rightButtonVisible = rightButtonType !== 'none'
  const isTappable = onPress != null || onLongPress != null

  const content = (
    <>
      {icon == null ? null : icon}
      <View style={[styles.content, rightButtonVisible ? styles.tappableIconMargin : styles.fullWidth]}>
        {title == null ? null : (
          <EdgeText ellipsizeMode="tail" style={error ? styles.textHeaderError : styles.textHeader}>
            {title}
          </EdgeText>
        )}
        {loading ? (
          <ActivityIndicator style={styles.loader} color={theme.primaryText} size="large" />
        ) : children != null ? (
          children
        ) : body != null ? (
          <EdgeText style={styles.textBody} numberOfLines={numberOfLines} ellipsizeMode="tail">
            {body}
          </EdgeText>
        ) : null}
      </View>
      {
        // If right action icon button is visible, only the icon dims on row tap
        rightButtonVisible ? (
          <EdgeTouchableOpacity style={styles.tappableIconContainer} accessible={false} onPress={handlePress} onLongPress={handleLongPress} disabled={loading}>
            {rightButtonType === 'touchable' ? <FontAwesome5 name="chevron-right" style={styles.tappableIcon} size={theme.rem(1)} /> : null}
            {rightButtonType === 'editable' ? <FontAwesomeIcon name="edit" style={styles.tappableIcon} size={theme.rem(1)} /> : null}
            {rightButtonType === 'copy' ? <FontAwesomeIcon name="copy" style={styles.tappableIcon} size={theme.rem(1)} /> : null}
            {rightButtonType === 'delete' ? <FontAwesomeIcon name="times" style={styles.tappableIcon} size={theme.rem(1)} /> : null}
            {rightButtonType === 'questionable' ? <SimpleLineIcons name="question" style={styles.tappableIcon} size={theme.rem(1)} /> : null}
          </EdgeTouchableOpacity>
        ) : null
      }
    </>
  )

  // The entire row dims on tap if not handled by the right action icon button.
  // TODO: If a right button is specified, onPress/onLogPress is ignored! Refine
  // API and possibly restructure JSX.
  return isTappable && !rightButtonVisible ? (
    <EdgeTouchableOpacity style={containerStyle} accessible={false} onPress={handlePress} onLongPress={handleLongPress} disabled={loading}>
      {content}
    </EdgeTouchableOpacity>
  ) : (
    <View style={containerStyle}>{content}</View>
  )
}

// TODO: Adjust margin/padding so everything combines with correct layout no
// matter the combination of UI4 components.
const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    backgroundColor: theme.tileBackground,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    flexShrink: 1
  },
  content: {
    flexDirection: 'column',
    flexShrink: 1
  },
  fullWidth: {
    flexGrow: 1
  },
  tappableIcon: {
    color: theme.iconTappable,
    marginLeft: theme.rem(0.5),
    textAlign: 'center'
  },
  tappableIconContainer: {
    // Positioned absolutely with full width to increase tappable area
    // overlapping the content, improving ease of tappability.
    position: 'absolute',
    right: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  tappableIconMargin: {
    // Extra invisible space to align the content when the right tappable icon
    // is visible, since the right tappable icon + TouchableOpaicty is
    // positioned absolutely.
    marginRight: theme.rem(1.5)
  },
  textHeader: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75),
    paddingRight: theme.rem(1) // TODO: Remove
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
