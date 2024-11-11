import * as React from 'react'
import { View } from 'react-native'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeCard } from './EdgeCard'

interface Props {
  children: React.ReactNode
  disabled?: boolean
  onPress: () => void
  warning?: boolean
  marginRem?: number[] | number
  paddingRem?: number[] | number
}

/**
 * An (optionally) tappable card that displays its children in up to two left/right
 * sections.
 */
const TappableCardComponent = ({ children, disabled = false, onPress, ...cardProps }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const renderTouchableChildren = () => (
    <View style={styles.container}>
      <View style={styles.childrenContainer}>{children}</View>
      {onPress == null ? null : (
        <FontAwesome5 name="chevron-right" size={theme.rem(1.25)} color={disabled ? theme.deactivatedText : theme.iconTappable} style={styles.chevron} />
      )}
    </View>
  )

  return (
    <EdgeCard {...cardProps}>
      {disabled ? renderTouchableChildren() : <EdgeTouchableOpacity onPress={onPress}>{renderTouchableChildren()}</EdgeTouchableOpacity>}
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row'
  },
  childrenContainer: {
    flexDirection: 'row',
    flex: 1
  },
  chevron: {
    alignSelf: 'center'
  }
}))

export const TappableCard = React.memo(TappableCardComponent)
