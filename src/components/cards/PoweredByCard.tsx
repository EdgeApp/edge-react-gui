import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import { lstrings } from '../../locales/strings'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  poweredByText: string
  iconUri?: string
  onPress: () => Promise<void> | void
}

/**
 * Small card that displays "Powered by {provider}" with an optional logo.
 * Tapping the card triggers `onPress` to change the active provider.
 */
export const PoweredByCard: React.FC<Props> = (props: Props) => {
  const { iconUri, poweredByText, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const iconSrc = iconUri == null ? {} : { uri: iconUri }

  return (
    <View style={styles.cardContainer}>
      <EdgeCard onPress={onPress}>
        <View style={styles.poweredByContainer}>
          <FastImage
            style={styles.poweredByIcon}
            source={iconSrc}
            resizeMode="contain"
          />
          <View style={styles.poweredByContainerColumn}>
            <View style={styles.poweredByContainerRow}>
              <EdgeText style={styles.poweredByText}>
                {lstrings.plugin_powered_by_space}
              </EdgeText>
              <EdgeText style={styles.poweredByText}>{poweredByText}</EdgeText>
            </View>
            <View style={styles.poweredByContainerRow}>
              <EdgeText style={styles.tapToChangeText}>
                {lstrings.tap_to_change_provider}
              </EdgeText>
            </View>
          </View>
          <FontAwesome5
            name="chevron-right"
            color={theme.iconTappable}
            size={theme.rem(1)}
          />
        </View>
      </EdgeCard>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    alignItems: 'center',
    flexDirection: 'row', // Make the card shrink
    justifyContent: 'center'
  },
  poweredByContainerRow: {
    flexDirection: 'row'
  },
  poweredByContainerColumn: {
    paddingHorizontal: theme.rem(0.5),
    flexDirection: 'column'
  },
  poweredByContainer: {
    marginHorizontal: theme.rem(0.25),
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
