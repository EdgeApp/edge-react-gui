// @flow

import React, { type Node, PureComponent } from 'react'
import { Clipboard, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { connect } from 'react-redux'

import s from '../../locales/strings.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { type EdgeTheme } from '../../reducers/ThemeReducer.js'
import type { State as StateType } from '../../types/reduxTypes.js'
import { showToast } from '../services/AirshipInstance.js'

type OwnProps = {
  body?: string,
  children?: Node,
  error?: boolean,
  onPress?: () => void,
  title: string,
  type: 'editable' | 'static' | 'touchable' | 'copy'
}

type StateProps = {
  theme: EdgeTheme
}

type State = {
  styles: StyleSheet
}

type Props = OwnProps & StateProps

class TileComponent extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      styles: getStyles(props.theme)
    }
  }

  static getDerivedStateFromProps(props: Props) {
    return { styles: getStyles(props.theme) }
  }

  copy = () => {
    if (!this.props.body) return
    Clipboard.setString(this.props.body)
    showToast(s.strings.fragment_copied)
  }

  render() {
    const { body, children, error, title, type } = this.props
    const { styles } = this.state
    const onPress = type === 'copy' ? () => this.copy() : this.props.onPress
    return (
      <TouchableWithoutFeedback onPress={onPress} disabled={type === 'static'}>
        <View style={styles.container}>
          <View style={styles.content}>
            {type === 'editable' && <FontAwesome name="edit" style={styles.editIcon} />}
            {type === 'copy' && <FontAwesome name="copy" style={styles.editIcon} />}
            <Text style={error ? styles.textHeaderError : styles.textHeader}>{title}</Text>
            {typeof body === 'string' && <Text style={styles.textBody}>{body}</Text>}
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

export const Tile = connect((state: StateType): StateProps => ({ theme: state.theme }))(TileComponent)

const getStyles = (theme: EdgeTheme) => {
  return StyleSheet.create({
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
      top: theme.rem(0.75),
      right: theme.rem(0.75)
    }
  })
}
