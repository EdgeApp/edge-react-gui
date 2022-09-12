import * as React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ListModal } from './ListModal'

type Props = {
  bridge: AirshipBridge<string | undefined>
  title: string
  items: Array<{ icon: string | number | React.ReactNode; name: string; text?: string }> // Icon strings are image uri, numbers are local files
  selected?: string
}

export function RadioListModal(props: Props) {
  const { bridge, items, selected, title } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  function renderRow({ name, icon, text }): React.ReactNode {
    const imageIcon = typeof icon === 'string' ? { uri: icon } : icon
    const radio = selected === name ? { icon: 'ios-radio-button-on', color: theme.iconTappable } : { icon: 'ios-radio-button-off', color: theme.iconTappable }

    return (
      <TouchableOpacity onPress={() => bridge.resolve(name)}>
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            {typeof icon === 'number' || typeof icon === 'string' ? <Image resizeMode="contain" source={imageIcon} style={styles.icon} /> : icon}
          </View>
          <EdgeText style={styles.rowText}>{name}</EdgeText>
          {text != null ? <Text style={styles.text}>{text}</Text> : null}
          <IonIcon name={radio.icon} color={radio.color} size={theme.rem(1.25)} />
        </View>
      </TouchableOpacity>
    )
  }

  return <ListModal bridge={bridge} title={title} textInput={false} rowsData={items} rowComponent={renderRow} fullScreen={false} />
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
  text: {
    color: theme.secondaryText,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(0.75),
    marginRight: theme.rem(0.5),
    includeFontPadding: false
  },
  rowText: {
    flexGrow: 1
  }
}))
