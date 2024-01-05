import * as React from 'react'
import { Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import { lstrings } from '../../locales/strings'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CardUi4 } from '../ui4/CardUi4'

interface Props {
  poweredByText: string
  iconUri?: string
  onPress: () => void
}

export const PoweredByCard = (props: Props) => {
  const { iconUri, poweredByText, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const iconSrc = iconUri == null ? {} : { uri: iconUri }

  return (
    <View style={styles.cardContainer}>
      <CardUi4 paddingRem={1} onPress={onPress}>
        <View style={styles.poweredByContainer}>
          <FastImage style={styles.poweredByIcon} source={iconSrc} resizeMode="contain" />
          <View style={styles.poweredByContainerColumn}>
            <View style={styles.poweredByContainerRow}>
              <Text style={styles.poweredByText}>{lstrings.plugin_powered_by_space}</Text>
              <Text style={styles.poweredByText}>{poweredByText}</Text>
            </View>
            <View style={styles.poweredByContainerRow}>
              <Text style={styles.tapToChangeText}>{lstrings.tap_to_change_provider}</Text>
            </View>
          </View>
          <FontAwesome5 name="chevron-right" color={theme.iconTappable} size={theme.rem(1)} />
        </View>
      </CardUi4>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    alignItems: 'center',
    flexDirection: 'row', // Make the card shrink
    justifyContent: 'center',
    marginVertical: theme.rem(0.5)
  },
  poweredByContainerRow: {
    flexDirection: 'row'
  },
  poweredByContainerColumn: {
    paddingHorizontal: theme.rem(0.5),
    flexDirection: 'column'
  },
  poweredByContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  poweredByText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  tapToChangeText: {
    fontSize: theme.rem(0.75),
    color: theme.deactivatedText
  },
  poweredByIcon: {
    aspectRatio: 1,
    width: theme.rem(2),
    height: theme.rem(2)
  }
}))
