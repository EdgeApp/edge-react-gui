// @flow

import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import { connect } from 'react-redux'

import { openDrawer } from '../../actions/ScenesActions.js'
import { Fontello } from '../../assets/vector/index.js'
import { type Dispatch } from '../../types/reduxTypes.js'
import { useTheme } from '../services/ThemeContext.js'

type Props = {
  openDrawer(): void
}

function SideMenuButtonComponent(props: Props) {
  const theme = useTheme()
  return (
    <TouchableOpacity onPress={props.openDrawer} style={{ paddingHorizontal: theme.rem(0.75) }}>
      <Fontello name="hamburgerButton" size={theme.rem(1)} color={theme.icon} />
    </TouchableOpacity>
  )
}

export const SideMenuButton = connect(null, (dispatch: Dispatch): Props => ({
  openDrawer() {
    dispatch(openDrawer())
  }
}))(SideMenuButtonComponent)
