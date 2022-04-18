// @flow
import { hook } from 'cavy'
import * as React from 'react'
import { View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ClickableRow } from './ClickableRow'
import { EdgeText } from './EdgeText'

type Props = {|
  onPress: () => void | (() => Promise<void>),
  title: string | React.Node,

  subTitle?: string,
  icon?: React.Node,
  autoWidth?: boolean,
  autoWidthContent?: boolean,
  arrowTappable?: boolean,
  underline?: boolean,

  marginRem?: number[] | number,
  paddingRem?: number[] | number
|}

export class SelectableRowComponent extends React.PureComponent<Props & ThemeProps> {
  render() {
    const {
      icon,
      title,
      subTitle,
      arrowTappable,
      underline,
      autoWidth = false,
      autoWidthContent = autoWidth,
      marginRem,
      paddingRem,
      onPress,
      theme
    } = this.props
    const styles = getStyles(theme)

    return (
      <ClickableRow onPress={onPress} underline={underline} marginRem={marginRem} paddingRem={paddingRem}>
        <View style={[styles.rowContainer, autoWidth ? styles.autoWidth : null]}>
          <View style={autoWidthContent ? styles.iconTitleContainerAutoWidth : styles.iconTitleContainer}>
            {icon}
            <View style={[styles.title, autoWidthContent ? styles.titleAutoWidth : null]}>
              <EdgeText>{title}</EdgeText>
              {subTitle ? (
                <EdgeText style={styles.subTitle} numberOfLines={2}>
                  {subTitle}
                </EdgeText>
              ) : null}
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
  autoWidth: {
    width: 'auto',
    maxWidth: '100%'
  },
  iconTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconTitleContainerAutoWidth: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    width: '100%',
    flexDirection: 'column',
    marginLeft: theme.rem(1.25)
  },
  titleAutoWidth: {
    width: 'auto',
    maxWidth: '75%',
    marginLeft: theme.rem(0.75),
    marginRight: theme.rem(0.75)
  },
  subTitle: {
    maxWidth: '85%',
    color: theme.deactivatedText,
    fontSize: theme.rem(0.75),
    marginTop: theme.rem(0.25)
  },
  iconStyle: {
    marginRight: theme.rem(-0.5)
  }
}))

export const SelectableRow = hook(withTheme(SelectableRowComponent))
