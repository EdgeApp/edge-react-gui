import * as React from 'react'
import { Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { lstrings } from '../../locales/strings'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CardUi4 } from '../ui4/CardUi4'
import { RowUi4 } from '../ui4/RowUi4'

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

  // TODO:
  // 1. This font styling doesn't match existing title+body text rows.
  // 3. Consider redesign of this card. Suggest title='Powered by:'
  //    body=poweredByText (tap to change is self-explanatory per the card's
  //    appearance)

  return (
    <CardUi4>
      <RowUi4 onPress={onPress} icon={<FastImage style={styles.poweredByIcon} source={iconSrc} />}>
        <View style={styles.poweredByContainerRow}>
          <Text style={styles.poweredByText}>{lstrings.plugin_powered_by_space}</Text>
          <Text style={styles.poweredByText}>{poweredByText}</Text>
        </View>
        <View style={styles.poweredByContainerRow}>
          <Text style={styles.tapToChangeText}>{lstrings.tap_to_change_provider}</Text>
        </View>
      </RowUi4>
    </CardUi4>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  poweredByContainerRow: {
    flexDirection: 'row',
    marginHorizontal: theme.rem(0.5)
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
