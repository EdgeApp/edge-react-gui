// @flow

import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import { connect } from 'react-redux'

import { openDrawer } from '../../actions/ScenesActions.js'
import { Fontello } from '../../assets/vector/index.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

type DispatchProps = {
  openDrawer: () => void
}
type Props = DispatchProps

function SideMenuButtonComponent(props: Props) {
  const theme = useTheme()
  const { container } = getStyles(theme)
  return (
    <TouchableOpacity onPress={props.openDrawer} style={container}>
      <Fontello name="hamburgerButton" size={theme.rem(1)} color={theme.icon} />
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    height: 44, // This is a fixed height of the navigation header no matter what screen size. Default by router-flux
    justifyContent: 'center',
    paddingRight: theme.rem(1),
    paddingLeft: theme.rem(2.5)
  }
}))

export const SideMenuButton = connect(
  (state: RootState) => ({}),
  (dispatch: Dispatch): DispatchProps => ({
    openDrawer() {
      dispatch(openDrawer())
    }
  })
)(SideMenuButtonComponent)
