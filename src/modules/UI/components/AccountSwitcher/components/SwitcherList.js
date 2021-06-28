// @flow

import * as React from 'react'
import { ScrollView, TouchableHighlight, View } from 'react-native'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'

import { type Theme, cacheStyles, useTheme } from '../../../../../components/services/ThemeContext'
import T from '../../FormattedText/FormattedText.ui'

export type Props = {
  onLogout: (username?: string) => void,
  deleteLocalAccount: () => void,
  usernames: any
}

export default function SwitcherList(props: Props) {
  const { onLogout, deleteLocalAccount, usernames } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <ScrollView style={styles.container}>
      {usernames.map((username: string) => (
        <View key={username} style={styles.row}>
          <TouchableHighlight style={styles.textContainer} underlayColor={styles.underlay.color} onPress={onLogout}>
            <T style={styles.text}>{username}</T>
          </TouchableHighlight>
          <TouchableHighlight style={styles.icon} underlayColor={styles.underlay.color} onPress={deleteLocalAccount}>
            <View /* Hack, do not remove */>
              <MaterialIcon size={20} name="close" />
            </View>
          </TouchableHighlight>
        </View>
      ))}
    </ScrollView>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    // backgroundColor: THEME.COLORS.WHITE,
    flex: 1
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderStyle: 'solid',
    // borderColor: THEME.COLORS.GRAY_4,
    borderBottomWidth: 0.5
  },
  textContainer: {
    flex: 1
    // paddingVertical: scale(13),
    // marginLeft: scale(20)
  },
  text: {
    // fontSize: scale(16)
  },
  icon: {
    // padding: scale(13)
  }
}))
