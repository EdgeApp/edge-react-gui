// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../ReduxTypes.js'
import { closeSideMenu, openSideMenu } from './action'
import SideMenu from './SideMenu.ui'

const mapStateToProps = (state: State) => ({
  view: state.ui.scenes.sideMenu.view
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  open: () => dispatch(openSideMenu()),
  close: () => dispatch(closeSideMenu())
})
export default connect(mapStateToProps, mapDispatchToProps)(SideMenu)
