// @flow

import Clipboard from '@react-native-community/clipboard'
import * as React from 'react'
import { ActivityIndicator, Animated, TouchableWithoutFeedback, View } from 'react-native'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import s from '../../locales/strings.js'
import { showToast } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type OwnProps = {
  body?: string,
  children?: React.Node,
  error?: boolean,
  onPress?: () => void,
  title: string,
  type: 'editable' | 'static' | 'touchable' | 'copy' | 'loading'
}
type Props = OwnProps & ThemeProps

type LocalState = {
  animation: any
}

class TileComponent extends React.PureComponent<Props, LocalState> {
  state: LocalState = {
    animation: new Animated.Value(0)
  }

  copy = () => {
    if (!this.props.body) return
    Clipboard.setString(this.props.body)
    showToast(s.strings.fragment_copied)
  }

  expand = ({ nativeEvent }) => {
    if (nativeEvent.layout.height) Animated.spring(this.state.animation, { toValue: nativeEvent.layout.height }).start()
  }

  render() {
    const { body, title, children, theme, type, error } = this.props
    const styles = getStyles(theme)
    const onPress = type === 'copy' ? () => this.copy() : this.props.onPress
    if (type === 'loading') {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <EdgeText style={styles.textHeader}>{title}</EdgeText>
            <ActivityIndicator style={styles.loader} color={theme.primaryText} size="large" />
          </View>
        </View>
      )
    }
    return (
      <TouchableWithoutFeedback onPress={onPress} disabled={type === 'static'}>
        <Animated.View style={[styles.animatedContainer, { height: this.state.animation._value ? this.state.animation : 'auto' }]}>
          <View onLayout={this.expand}>
            <View style={styles.container}>
              <View style={styles.content}>
                {type === 'editable' && <FontAwesomeIcon name="edit" style={styles.editIcon} />}
                {type === 'copy' && <FontAwesomeIcon name="copy" style={styles.editIcon} />}
                <EdgeText style={error ? styles.textHeaderError : styles.textHeader}>{title}</EdgeText>
                {typeof body === 'string' && (
                  <EdgeText style={styles.textBody} numberOfLines={3} adjustsFontSizeToFit={false}>
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
        </Animated.View>
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
  animatedContainer: {
    overflow: 'hidden'
  },
  content: {
    flex: 1
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  arrowIcon: {
    color: theme.iconTappable,
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
    color: theme.dangerText,
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
    color: theme.iconTappable,
    width: theme.rem(0.75),
    height: theme.rem(0.75),
    top: theme.rem(0.5),
    right: theme.rem(0.25)
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
