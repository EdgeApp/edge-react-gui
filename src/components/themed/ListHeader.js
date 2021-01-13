// @flow

import * as React from 'react'
import { View } from 'react-native'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type Props = {
  title: string,
  withTopMargin?: boolean
}

class ListHeaderComponent extends React.PureComponent<Props & ThemeProps> {
  render() {
    const styles = getStyles(this.props.theme)
    return (
      <View style={[styles.container, this.props.withTopMargin ? styles.topMargin : null]}>
        <EdgeText style={styles.title}>{this.props.title}</EdgeText>
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    justifyContent: 'center',
    marginLeft: theme.rem(1),
    marginBottom: theme.rem(0.5),
    paddingBottom: theme.rem(1),
    borderBottomWidth: theme.thinLineWidth,
    borderBottomColor: theme.lineDivider
  },
  topMargin: {
    marginTop: theme.rem(1)
  },
  title: {
    fontSize: theme.rem(1.25),
    fontWeight: '600'
  }
}))

export const ListHeader = withTheme(ListHeaderComponent)
