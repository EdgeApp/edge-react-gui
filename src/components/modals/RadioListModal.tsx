import IonIcon from '@expo/vector-icons/Ionicons'
import * as React from 'react'
import { Image, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { UnscaledText } from '../text/UnscaledText'
import { EdgeText } from '../themed/EdgeText'
import { ListModal } from './ListModal'

interface Item {
  // Icon strings are image uri, numbers are local files:
  icon: string | number | React.ReactNode
  name: string
  text?: string
}

interface Props {
  bridge: AirshipBridge<string | undefined>
  title: string
  items: Item[]
  selected?: string
}

export function RadioListModal(props: Props) {
  const { bridge, items, selected, title } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const renderRow = useHandler((item: Item) => {
    const { name, icon, text } = item

    const isSelected = selected === name
    const radio = isSelected
      ? { icon: 'radio-button-on' as const, color: theme.iconTappable }
      : { icon: 'radio-button-off' as const, color: theme.iconTappable }
    const accessibilityState = isSelected
      ? { checked: true }
      : { checked: false }
    const accessibilityHint = `${
      isSelected ? lstrings.on_hint : lstrings.off_hint
    } ${name}`

    const iconElement =
      typeof icon === 'string' ? (
        <Image
          resizeMode="contain"
          source={{ uri: icon }}
          style={styles.icon}
        />
      ) : typeof icon === 'number' ? (
        <Image resizeMode="contain" source={icon} style={styles.icon} />
      ) : (
        icon
      )

    return (
      <EdgeTouchableOpacity
        onPress={() => {
          bridge.resolve(name)
        }}
      >
        <View style={styles.row}>
          <View style={styles.iconContainer}>{iconElement}</View>
          <EdgeText style={styles.rowText}>{name}</EdgeText>
          {text != null ? (
            <UnscaledText style={styles.text}>{text}</UnscaledText>
          ) : null}
          <IonIcon
            accessibilityActions={[{ name: 'activate', label: name }]}
            accessibilityHint={accessibilityHint}
            accessibilityRole="radio"
            accessibilityState={accessibilityState}
            color={radio.color}
            name={radio.icon}
            size={theme.rem(1.25)}
          />
        </View>
      </EdgeTouchableOpacity>
    )
  })

  return (
    <ListModal
      bridge={bridge}
      title={title}
      textInput={false}
      rowsData={items}
      rowComponent={renderRow}
      fullScreen={false}
    />
  )
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
