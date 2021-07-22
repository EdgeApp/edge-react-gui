// @flow
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { Fontello } from '../../../assets/vector'
import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../EdgeText'

export type Props = {
  title: string,
  route?: string,
  onPress?: () => void,
  iconName: string
}

function PanelRow(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { route, title, onPress, iconName } = props

  const goToScene = (scene: string, sceneProps?: any) => {
    const { currentScene, drawerClose } = Actions

    if (currentScene !== scene) {
      Actions.jump(scene, sceneProps)
    } else if (sceneProps) {
      Actions.refresh(sceneProps)
    }

    drawerClose()
  }

  const onPressHandler = () => {
    if (route) goToScene(route)
    if (onPress) onPress()
  }

  return (
    <TouchableOpacity onPress={onPressHandler}>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Fontello name={iconName} size={theme.rem(1.5)} color={theme.iconPanel} />
        </View>
        <View>
          <EdgeText style={styles.text}>{title}</EdgeText>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.rem(1.5)
  },
  row: {
    color: 'white',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: theme.rem(2.75),
    paddingRight: theme.rem(3)
  },
  text: {
    fontFamily: theme.fontFaceBold
  },
  iconSize: {
    width: theme.rem(2),
    height: theme.rem(2)
  },
  touchableCheckboxInterior: {
    justifyContent: 'center',
    alignItems: 'center'
  }
}))

export default PanelRow
