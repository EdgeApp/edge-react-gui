// @flow

import * as React from 'react'
import { ScrollView, TouchableHighlight, View } from 'react-native'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'

import { type Theme, cacheStyles, useTheme } from '../../../../../components/services/ThemeContext'
import { EdgeText } from '../../../../../components/themed/EdgeText'
export type Props = {
  onSwitchAccount: (username: string) => void,
  deleteLocalAccount: (username: string) => void,
  usernames: any
}

export default function SwitcherList(props: Props) {
  const { onSwitchAccount, deleteLocalAccount, usernames } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <ScrollView style={styles.container}>
      {usernames.map((username: string) => (
        <View key={username} style={styles.row}>
          <TouchableHighlight style={styles.textContainer} onPress={() => onSwitchAccount(username)}>
            <EdgeText style={styles.text}>{username}</EdgeText>
          </TouchableHighlight>
          <TouchableHighlight style={styles.icon} onPress={() => deleteLocalAccount(username)}>
            <View /* Hack, do not remove */>
              <MaterialIcon size={theme.rem(1.5)} name="close" color={theme.iconPanel} />
            </View>
          </TouchableHighlight>
        </View>
      ))}
    </ScrollView>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignSelf: 'stretch'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: theme.rem(2.5),
    paddingLeft: theme.rem(3)
  },
  textContainer: {
    marginRight: theme.rem(0.5)
  },
  text: {
    fontFamily: theme.fontFaceBold
  },
  icon: {
    // padding: scale(13)
    color: 'white'
  },
  underlay: {
    color: 'red'
  }
}))
