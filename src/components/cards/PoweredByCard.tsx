import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { lstrings } from '../../locales/strings'
import { ChevronRightIcon } from '../icons/ThemedIcons'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

interface Props {
  poweredByText: string
  iconUri?: string
  // When omitted, the card is not tappable: no chevron and no
  // "tap to change provider" hint are shown (e.g. a fixed-provider swap).
  onPress?: () => Promise<void> | void
}

/**
 * Small card that displays "Powered by {provider}" with an optional logo.
 * Tapping the card triggers `onPress` to change the active provider. When
 * `onPress` is omitted the card is static (no chevron) to indicate the
 * provider cannot be changed.
 */
export const PoweredByCard: React.FC<Props> = (props: Props) => {
  const { iconUri, poweredByText, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const iconSrc = iconUri == null ? {} : { uri: iconUri }
  const tappable = onPress != null

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
            {tappable ? (
              <View style={styles.poweredByContainerRow}>
                <EdgeText style={styles.tapToChangeText}>
                  {lstrings.tap_to_change_provider}
                </EdgeText>
              </View>
            ) : null}
          </View>
          {tappable ? (
            <ChevronRightIcon color={theme.iconTappable} size={theme.rem(1)} />
          ) : null}
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
