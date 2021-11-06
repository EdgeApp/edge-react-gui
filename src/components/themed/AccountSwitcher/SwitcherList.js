// @flow

import * as React from 'react'
import { ScrollView, TouchableHighlight, View } from 'react-native'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'

import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext'
import DropdownList from '../DropdownList'
import { EdgeText } from '../EdgeText'
import Separator from '../Separator'
import { SwitcherHeader } from './SwitcherHeader'
export type Props = {
  onSwitchAccount: (username: string) => void,
  deleteLocalAccount: (username: string) => void,
  usernames: string[]
}

export const SwitcherList = (props: Props) => {
  const { onSwitchAccount, deleteLocalAccount, usernames } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <ScrollView style={styles.container}>
      {usernames.map((username: string) => (
        <View key={username} style={styles.row}>
          <TouchableHighlight
            style={styles.textContainer}
            onPress={() => {
              onSwitchAccount(username)
            }}
          >
            <EdgeText style={styles.text}>{username}</EdgeText>
          </TouchableHighlight>
          <TouchableHighlight onPress={() => deleteLocalAccount(username)}>
            <View /* Hack, do not remove */>
              <MaterialIcon size={theme.rem(1.5)} name="close" color={theme.mainMenuIcon} />
            </View>
          </TouchableHighlight>
        </View>
      ))}
    </ScrollView>
    // <DropdownList
    //   onIsOpen={onSwitch}
    //   forceClose={forceClose}
    //   header={<SwitcherHeader username={usernames[0]} />}
    //   separator={<Separator style={styles.separator} />}
    //   isFetching={usernames.length === 0}
    //   list={
    //     <View style={styles.list}>
    //       <SwitcherList usernames={usernames} />
    //     </View>
    //   }
    // />
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
    paddingLeft: theme.rem(2)
  },
  textContainer: {
    marginRight: theme.rem(0.5)
  },
  text: {
    fontFamily: theme.fontFaceBold
  },
  separator: {
    marginBottom: theme.rem(1),
    marginTop: theme.rem(1.2),
    marginRight: theme.rem(-2)
  }
}))
