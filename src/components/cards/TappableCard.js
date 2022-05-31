// @flow

import * as React from 'react'
import { View } from 'react-native'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import { memo } from '../../types/reactHooks.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { Card } from './Card'

/**
 * An (optionally) tappable card that displays its children in up to two left/right
 * sections. If the card is configured to be tappable, a chevron is drawn on the
 * right side of the card.
 */
const TappableCardComponent = ({
  nonTappable = false,
  leftChildren,
  rightChildren
}: {
  nonTappable?: boolean,
  leftChildren: React.Node,
  rightChildren?: React.Node
}) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <Card>
      <View style={styles.cardContainer}>
        <View style={styles.leftContainer}>{leftChildren}</View>
        <View style={styles.rightContainer}>{rightChildren}</View>
        {nonTappable ? null : <FontAwesome5 name="chevron-right" size={theme.rem(1.25)} color={theme.iconTappable} style={styles.chevron} />}
      </View>
    </Card>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  leftContainer: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'flex-start'
  },
  rightContainer: {
    flex: 1,
    alignSelf: 'flex-end',
    justifyContent: 'flex-end'
  },
  chevron: {
    alignSelf: 'center',
    marginLeft: theme.rem(1.25)
  }
}))

export const TappableCard = memo(TappableCardComponent)
