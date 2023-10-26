import * as React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { lstrings } from '../../locales/strings'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { Card } from './Card'

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
      <TouchableOpacity onPress={onPress}>
        <Card paddingRem={0.5}>
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

            <IonIcon name="chevron-forward" size={theme.rem(1)} color={theme.iconTappable} />
          </View>
        </Card>
      </TouchableOpacity>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    paddingTop: theme.rem(1),
    paddingBottom: theme.rem(1),
    alignItems: 'center'
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
