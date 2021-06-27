// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import Feather from 'react-native-vector-icons/Feather'

import { Fontello } from '../../../../../assets/vector'
import { type Theme, cacheStyles, useTheme } from '../../../../../components/services/ThemeContext'
import { EdgeText } from '../../../../../components/themed/EdgeText'

export type Props = {
  username: string,
  usersView: boolean,
  onPress: () => void
}

function AccountList(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { onPress, usersView, username } = props

  const arrowIconName = usersView ? 'chevron-up' : 'chevron-down'

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.list}>
        <View style={styles.iconUser}>
          <Fontello name="fioNames" size={theme.rem(1.5)} color={theme.iconPanel} />
        </View>
        <View style={styles.textContainer}>
          <EdgeText style={styles.text}>{username}</EdgeText>
        </View>
        <Feather name={arrowIconName} color={theme.iconPanel} size={theme.rem(1.5)} />
      </View>
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  list: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  iconUser: {
    marginRight: theme.rem(1.5)
  },
  textContainer: {
    marginRight: 'auto'
  },
  text: {
    fontFamily: theme.fontFaceBold
  }
}))

export default AccountList
