// @flow

import * as React from 'react'
import { Clipboard, TouchableWithoutFeedback, View } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'

import s from '../../locales/strings.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { type ThemeProps, cacheStyles, withTheme } from '../../theme/ThemeContext.js'
import { showToast } from '../services/AirshipInstance.js'

type OwnProps = {
  body?: string,
  children?: React.Node,
  error?: boolean,
  onPress?: () => void,
  title: string,
  type: 'editable' | 'static' | 'touchable' | 'copy'
}
type Props = OwnProps & ThemeProps

class TileComponent extends React.PureComponent<Props> {
  copy = () => {
    if (!this.props.body) return
    Clipboard.setString(this.props.body)
    showToast(s.strings.fragment_copied)
  }

  render() {
    const { body, children, error, theme, title, type } = this.props
    const styles = getStyles(theme)
    const onPress = type === 'copy' ? () => this.copy() : this.props.onPress
    return (
      <TouchableWithoutFeedback onPress={onPress} disabled={type === 'static'}>
        <View style={styles.container}>
          <View style={styles.content}>
            {type === 'editable' && <FontAwesome name="edit" style={styles.editIcon} />}
            {type === 'copy' && <FontAwesome name="copy" style={styles.editIcon} />}
            <Text style={error ? styles.textHeaderError : styles.textHeader}>{title}</Text>
            {typeof body === 'string' && (
              <Text style={styles.textBody} numberOfLines={3}>
                {body}
              </Text>
            )}
            {children}
          </View>
          {type === 'touchable' && (
            <View style={styles.iconContainer}>
              <FontAwesome name="chevron-right" style={styles.arrowIcon} />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    )
  }
}

const getStyles = cacheStyles(theme => ({
  container: {
    width: '100%',
    backgroundColor: theme.tileBackground,
    marginBottom: theme.rem(0.125),
    padding: theme.rem(0.5),
    flexDirection: 'row',
    alignItems: 'center'
  },
  content: {
    flex: 1
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  arrowIcon: {
    color: theme.primaryText,
    height: theme.rem(1),
    marginHorizontal: theme.rem(0.5),
    textAlign: 'center'
  },
  textHeader: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75),
    margin: theme.rem(0.25)
  },
  textHeaderError: {
    color: theme.accentTextNegative,
    fontSize: theme.rem(0.75),
    margin: theme.rem(0.25)
  },
  textBody: {
    color: theme.primaryText,
    fontSize: theme.rem(1),
    margin: theme.rem(0.25)
  },
  editIcon: {
    position: 'absolute',
    color: theme.tileIcon,
    width: theme.rem(0.75),
    height: theme.rem(0.75),
    top: theme.rem(0.25),
    right: theme.rem(0.25)
  }
}))

export const Tile = withTheme(TileComponent)
