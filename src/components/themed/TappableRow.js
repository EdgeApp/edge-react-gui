// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import { type SpaceProps, useSpaceStyle } from '../../hooks/useSpaceStyle.js'
import { memo } from '../../types/reactHooks.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

type OwnProps = {
  children: React.Node,
  onPress?: any => Promise<void> | void
}
type Props = OwnProps & SpaceProps

const TappableRowComponent = ({ children, onPress, ...spaceProps }: Props) => {
  const theme = useTheme()
  const spaceStyle = useSpaceStyle({ sideways: true, ...spaceProps })
  const styles = getStyles(theme)

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.container}>
        <View style={[styles.spacedContainer, spaceStyle]}>{children}</View>
        <FontAwesome5 name="chevron-right" size={theme.rem(1.25)} color={theme.iconTappable} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    flex: 1
  },
  spacedContainer: {
    flexDirection: 'row',
    flex: 1
  },
  chevron: {
    alignSelf: 'center',
    marginLeft: theme.rem(1.25)
  }
}))

export const TappableRow = memo(TappableRowComponent)
