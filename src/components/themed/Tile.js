// @flow

import Clipboard from '@react-native-community/clipboard'
import * as React from 'react'
import { ActivityIndicator, TouchableWithoutFeedback, View } from 'react-native'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'

import s from '../../locales/strings.js'
import { showToast } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

const textHeights = {
  small: 2,
  medium: 3,
  large: 0
}

type OwnProps = {
  body?: string,
  children?: React.Node,
  error?: boolean,
  onPress?: () => void,
  title: string,
  type: 'copy' | 'editable' | 'questionable' | 'loading' | 'static' | 'touchable',
  contentPadding?: boolean,
  maximumHeight?: 'small' | 'medium' | 'large'
}
type Props = OwnProps & ThemeProps

class TileComponent extends React.PureComponent<Props> {
  copy = () => {
    if (!this.props.body) return
    Clipboard.setString(this.props.body)
    showToast(s.strings.fragment_copied)
  }

  render() {
    const { body, title, contentPadding = true, children, theme, type, maximumHeight = 'medium', error } = this.props
    const styles = getStyles(theme)
    const onPress = type === 'copy' ? () => this.copy() : this.props.onPress
    const numberOfLines = textHeights[maximumHeight]

    if (type === 'loading') {
      return (
        <View>
          <View style={styles.container}>
            <View style={[styles.content, contentPadding ? styles.contentPadding : null]}>
              <EdgeText style={styles.textHeader}>{title}</EdgeText>
              <ActivityIndicator style={styles.loader} color={theme.primaryText} size="large" />
            </View>
          </View>
          <View style={styles.divider} />
        </View>
      )
    }
    return (
      <TouchableWithoutFeedback onPress={onPress} disabled={type === 'static'}>
        <View>
          <View style={styles.container}>
            <View style={[styles.content, contentPadding ? styles.contentPadding : null]}>
              {type === 'editable' && <FontAwesomeIcon name="edit" style={styles.editIcon} />}
              {type === 'copy' && <FontAwesomeIcon name="copy" style={styles.editIcon} />}
              {type === 'questionable' && <SimpleLineIcons name="question" style={styles.editIcon} />}
              <EdgeText style={error ? styles.textHeaderError : styles.textHeader}>{title}</EdgeText>
              {typeof body === 'string' && (
                <EdgeText style={styles.textBody} numberOfLines={numberOfLines} ellipsizeMode="tail">
                  {body}
                </EdgeText>
              )}
              {children}
            </View>
            {type === 'touchable' && (
              <View style={styles.iconContainer}>
                <FontAwesomeIcon name="chevron-right" style={styles.arrowIcon} />
              </View>
            )}
          </View>
          <View style={styles.divider} />
        </View>
      </TouchableWithoutFeedback>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    backgroundColor: theme.tileBackground,
    paddingHorizontal: theme.rem(1),
    marginTop: theme.rem(1),
    paddingBottom: theme.rem(1),
    flexDirection: 'row',
    alignItems: 'center'
  },
  content: {
    flex: 1
  },
  contentPadding: {
    paddingLeft: theme.rem(0.25)
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  arrowIcon: {
    color: theme.iconTappable,
    marginHorizontal: theme.rem(0.5),
    textAlign: 'center'
  },
  textHeader: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75),
    paddingBottom: theme.rem(0.25)
  },
  textHeaderError: {
    color: theme.dangerText,
    fontSize: theme.rem(0.75)
  },
  textBody: {
    color: theme.primaryText,
    fontSize: theme.rem(1)
  },
  editIcon: {
    position: 'absolute',
    color: theme.iconTappable,
    width: theme.rem(0.75),
    height: theme.rem(0.75),
    top: theme.rem(0.25),
    right: 0
  },
  loader: {
    marginTop: theme.rem(0.25)
  },
  divider: {
    height: theme.thinLineWidth,
    marginLeft: theme.rem(1),
    borderBottomWidth: theme.thinLineWidth,
    borderBottomColor: theme.lineDivider
  }
}))

export const Tile = withTheme(TileComponent)
