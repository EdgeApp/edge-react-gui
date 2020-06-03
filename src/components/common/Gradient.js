// @flow

import type { Node } from 'react'
import React, { PureComponent } from 'react'
import { StyleSheet } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { connect } from 'react-redux'

import { type EdgeTheme } from '../../reducers/ThemeReducer.js'
import type { State as StateType } from '../../types/reduxTypes.js'
import { getObjectDiff } from '../../util/utils'

export type OwnProps = {
  children?: Node,
  reverse?: boolean,
  style?: StyleSheet.Styles
}

type StateProps = {
  theme: EdgeTheme
}

type Props = OwnProps & StateProps

class GradientComponent extends PureComponent<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const diffElement = getObjectDiff(this.props, nextProps, { style: true, children: true })
    return !!diffElement
  }

  render() {
    const { children, reverse, theme, style } = this.props
    const colors = [theme.background1, theme.background2]
    const reverseColors = [theme.background2, theme.background1]
    return (
      <LinearGradient style={style} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} colors={reverse ? reverseColors : colors}>
        {children}
      </LinearGradient>
    )
  }
}

export const Gradient = connect((state: StateType): StateProps => ({ theme: state.theme }))(GradientComponent)
