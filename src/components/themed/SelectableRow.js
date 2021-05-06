// @flow

import * as React from 'react'
import { View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ClickableRow } from './ClickableRow'
import { EdgeText } from './EdgeText'

type Props = {
  onPress: () => void | (() => Promise<void>),
  title: string,
  subTitle: string,
  icon?: React.Node,
  selected?: boolean,
  arrowTappable?: boolean,
  underline?: boolean,

  marginRem?: number[] | number,
  paddingRem?: number[] | number
}

class SelectableRowComponent extends React.PureComponent<Props & ThemeProps> {
  render() {
    const { icon, title, subTitle, arrowTappable, underline, marginRem, paddingRem, onPress, theme } = this.props
    const styles = getStyles(theme)

    return (
      <ClickableRow onPress={onPress} underline={underline} marginRem={marginRem} paddingRem={paddingRem}>
        <View style={styles.rowContainer}>
          <View style={styles.iconTitleContainer}>
            {icon}
            <View style={styles.title}>
              <EdgeText>{title}</EdgeText>
              <EdgeText style={styles.subTitle} numberOfLines={2}>
                {subTitle}
              </EdgeText>
            </View>
          </View>
          <IonIcon size={theme.rem(1.5)} color={arrowTappable ? theme.iconTappable : theme.icon} name="chevron-forward-outline" style={styles.iconStyle} />
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
  iconTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    width: '100%',
    flexDirection: 'column',
    marginLeft: theme.rem(1.25)
  },
  subTitle: {
    maxWidth: '85%',
    color: theme.deactivatedText,
    fontSize: theme.rem(0.75),
    marginTop: theme.rem(0.25)
  },
  iconStyle: {
    marginRight: theme.rem(-0.5)
    // position: 'absolute',
    // paddingHorizontal: theme.rem(0.75)
  }
}))

export const SelectableRow = withTheme(SelectableRowComponent)
