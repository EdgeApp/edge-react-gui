import React from 'react'
import { View } from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

const FloatingCardComponent = () => {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.floatingCard}>
      <View style={styles.icon}>
        <MaterialIcons name="info-outline" size={theme.rem(2.5)} color={theme.warningIcon} />
        <View>
          <EdgeText style={styles.text}>Please back up your account.</EdgeText>
          <EdgeText style={styles.text} numberOfLines={3}>
            Without a backup, you risk losing your funds!
          </EdgeText>
        </View>
      </View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  floatingCard: {
    position: 'absolute',
    alignSelf: 'center',
    // left: theme.rem(1),
    // right: theme.rem(1),
    width: '100%',
    bottom: theme.rem(4.5),
    height: theme.rem(3.5),
    backgroundColor: theme.modal,
    borderRadius: theme.rem(0.5),
    shadowOffset: { width: 0, height: theme.rem(0.125) },
    shadowOpacity: 0.25,
    shadowRadius: theme.rem(0.5),
    elevation: 5,
    justifyContent: 'center'
  },
  icon: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: theme.rem(0.5)
  },
  text: {
    color: theme.warningIcon,
    marginLeft: theme.rem(0.5),
    fontSize: theme.rem(0.75)
  }
}))

export const FloatingCard = React.memo(FloatingCardComponent)
