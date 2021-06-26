// @flow

import * as React from 'react'
import { Image } from 'react-native'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'

import accountIcon from '../../../../../assets/images/sidenav/accounts.png'
import { type Theme, cacheStyles, useTheme } from '../../../../../components/services/ThemeContext'
import { EdgeText } from '../../../../../components/themed/EdgeText'
import { Button } from './Button/Button.ui'

export type Props = {
  username: string,
  usersView: boolean,
  onPress: () => void
}

function AccountList(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { onPress, usersView, username } = props

  const arrowIcon = usersView ? 'keyboard-arrow-up' : 'keyboard-arrow-down'

  return (
    <Button onPress={onPress} style={styles.toggleButton} underlayColor={styles.underlay.color}>
      <Button.Row>
        <Button.Left>
          <Image style={styles.iconImage} resizeMode="contain" source={accountIcon} />
        </Button.Left>

        <Button.Center>
          <Button.Text>
            <EdgeText>{username}</EdgeText>
          </Button.Text>
        </Button.Center>

        <Button.Right>
          <MaterialIcon style={styles.toggleIcon} name={arrowIcon} />
        </Button.Right>
      </Button.Row>
    </Button>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  iconImage: {
    width: theme.rem(1.5),
    height: theme.rem(1.5)
  },
  toggleButton: {
    backgroundColor: theme.primaryButton,
    height: theme.rem(2.5),
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  toggleIcon: {
    fontSize: theme.rem(1)
  },
  underlay: {
    color: theme.underlayColor
  }
}))

export default AccountList
