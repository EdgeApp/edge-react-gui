import * as React from 'react'
import { Image, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { EdgeCard } from '../cards/EdgeCard'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ListModal } from './ListModal'

interface Item {
  key: string
  title: string
  icon: string | number | React.ReactNode
  body: string
}

interface Props {
  bridge: AirshipBridge<string | undefined>
  title: string
  items: Item[]
  selectedKey?: string
}

export function CardListModal(props: Props): React.ReactElement {
  const { bridge, items, selectedKey, title } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const renderRow = useHandler((item: Item) => {
    const { key, title: itemTitle, icon, body } = item

    const isSelected = selectedKey === key
    const accessibilityState = isSelected
      ? { checked: true }
      : { checked: false }
    const accessibilityHint = `${
      isSelected ? lstrings.on_hint : lstrings.off_hint
    } ${itemTitle}`

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
      <EdgeCard
        onPress={() => {
          bridge.resolve(key)
        }}
      >
        <View style={styles.card}>
          <View style={styles.iconContainer}>{iconElement}</View>
          <View style={styles.contentContainer}>
            <EdgeText style={styles.titleText} numberOfLines={1}>
              {itemTitle}
            </EdgeText>
            <EdgeText style={styles.bodyText}>{body}</EdgeText>
          </View>
          {isSelected ? (
            <IonIcon
              accessibilityActions={[{ name: 'activate', label: itemTitle }]}
              accessibilityHint={accessibilityHint}
              accessibilityRole="radio"
              accessibilityState={accessibilityState}
              color={theme.iconTappable}
              name="checkmark-circle"
              size={theme.rem(1.5)}
              style={styles.checkIcon}
            />
          ) : null}
        </View>
      </EdgeCard>
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
  card: {
    paddingHorizontal: theme.rem(0.5),
    paddingVertical: theme.rem(0.5),
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconContainer: {
    marginRight: theme.rem(0.75)
  },
  icon: {
    height: theme.rem(1.5),
    width: theme.rem(1.5)
  },
  contentContainer: {
    flex: 1
  },
  titleText: {
    fontSize: theme.rem(0.875),
    fontFamily: theme.fontFaceMedium,
    color: theme.primaryText,
    marginBottom: theme.rem(0.125)
  },
  bodyText: {
    fontSize: theme.rem(0.75),
    color: theme.positiveText
  },
  checkIcon: {
    marginLeft: theme.rem(0.5)
  }
}))
