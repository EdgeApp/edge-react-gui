// @flow

import React, { type Node, PureComponent } from 'react'
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { connect } from 'react-redux'

import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { type EdgeTheme } from '../../reducers/ThemeReducer.js'
import type { State as StateType } from '../../types/reduxTypes.js'

type OwnProps = {
  body?: string,
  children?: Node,
  error?: boolean,
  onPress?: () => void,
  title: string,
  type: 'editable' | 'static' | 'touchable'
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

  render() {
    const { body, children, error, onPress, title, type } = this.props
    const { styles } = this.state
    return (
      <TouchableWithoutFeedback onPress={onPress} disabled={type === 'static'}>
        <View style={styles.container}>
          {type === 'editable' && <FontAwesome name="edit" style={styles.editIcon} />}
          <Text style={error ? styles.textHeaderError : styles.textHeader}>{title}</Text>
          {typeof body === 'string' && <Text style={styles.textBody}>{body}</Text>}
          {children}
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
      padding: theme.rem(0.5)
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
