// @flow

import * as React from 'react'
import { Image, TouchableOpacity, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { ListModal } from './ListModal.js'

type Props = {
  bridge: AirshipBridge<string | void>,
  title: string,
  items: Array<{ icon: string | number | React.Node, name: string }>, // Icon strings are image uri, numbers are local files
  selected?: string
}

export function RadioListModal(props: Props) {
  const { bridge, items, selected, title } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  function renderRow({ name, icon }): React.Node {
    const imageIcon = typeof icon === 'string' ? { uri: icon } : icon
    const radio = selected === name ? { icon: 'ios-radio-button-on', color: theme.iconTappable } : { icon: 'ios-radio-button-off', color: theme.iconTappable }

    return (
      <TouchableOpacity onPress={() => bridge.resolve(name)}>
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            {typeof icon === 'number' || typeof icon === 'string' ? <Image resizeMode="contain" source={imageIcon} style={styles.icon} /> : icon}
          </View>
          <EdgeText style={styles.rowText}>{name}</EdgeText>
          <IonIcon name={radio.icon} color={radio.color} size={theme.rem(1.25)} />
        </View>
      </TouchableOpacity>
    )
  }

  return <ListModal bridge={bridge} title={title} textInput={false} rowsData={items} rowComponent={renderRow} />
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    margin: theme.rem(0.5)
  },
  iconContainer: {
    marginLeft: theme.rem(0.5),
    marginRight: theme.rem(1)
  },
  icon: {
    height: theme.rem(1.25),
    width: theme.rem(1.25)
  },
  rowText: {
    flexGrow: 1
  }
}))
