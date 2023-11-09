import * as React from 'react'
import { View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { ClickableRow } from './ClickableRow'
import { EdgeText } from './EdgeText'

interface Props {
  onPress: () => void | Promise<void>
  title: string | React.ReactNode

  subTitle?: string
  icon?: React.ReactNode
  autoHeight?: boolean
  arrowTappable?: boolean
  underline?: boolean

  marginRem?: number[] | number
}

export class SelectableRowComponent extends React.PureComponent<Props & ThemeProps> {
  render() {
    const { icon, title, subTitle, arrowTappable, underline, autoHeight, marginRem, onPress, theme } = this.props
    const styles = getStyles(theme)

    return (
      <ClickableRow autoHeight={autoHeight} marginRem={marginRem} paddingRem={[0, 0.5]} underline={underline} onPress={onPress}>
        <View style={styles.rowContainer}>
          <View style={styles.iconContainer}>{icon}</View>
          <View style={styles.textContainer}>
            <EdgeText>{title}</EdgeText>
            {subTitle ? (
              <EdgeText style={styles.subTitle} numberOfLines={2}>
                {subTitle}
              </EdgeText>
            ) : null}
          </View>
          <IonIcon size={theme.rem(1.5)} color={arrowTappable ? theme.iconTappable : theme.icon} name="chevron-forward-outline" style={styles.chevron} />
        </View>
      </ClickableRow>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  rowContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  iconContainer: {
    margin: theme.rem(0.5)
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    margin: theme.rem(0.5)
  },
  subTitle: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75),
    marginTop: theme.rem(0.25)
  },
  chevron: {
    marginHorizontal: theme.rem(0)
  }
}))

export const SelectableRow = withTheme(SelectableRowComponent)
