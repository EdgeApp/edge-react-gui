// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import { memo } from '../../types/reactHooks.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { Card } from './Card'

type Props = {
  children: React.Node,
  nonTappable?: boolean,
  onPress?: any => Promise<void> | void,
  warning?: boolean,
  marginRem?: number[] | number,
  paddingRem?: number[] | number
}

/**
 * An (optionally) tappable card that displays its children in up to two left/right
 * sections. If the card is configured to be tappable, a chevron is drawn on the
 * right side of the card.
 */
const TappableCardComponent = ({ children, nonTappable = false, onPress, ...cardProps }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <TouchableOpacity onPress={onPress}>
      <Card {...cardProps}>
        <View style={styles.container}>
          <View style={styles.childrenContainer}>{children}</View>
          {nonTappable ? null : <FontAwesome5 name="chevron-right" size={theme.rem(1.25)} color={theme.iconTappable} style={styles.chevron} />}
        </View>
      </Card>
    </TouchableOpacity>
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

export const TappableCard = memo(TappableCardComponent)
