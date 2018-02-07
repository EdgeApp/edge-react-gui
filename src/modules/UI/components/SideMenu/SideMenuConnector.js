// @flow

import {connect} from 'react-redux'

import SideMenu from './SideMenu.ui'
import {openSideMenu, closeSideMenu} from './action'
import type {State, Dispatch} from '../../../ReduxTypes.js'

const mapStateToProps = (state: State) => ({
  view: state.ui.scenes.sideMenu.view
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  open: () => dispatch(openSideMenu()),
  close: () => dispatch(closeSideMenu())
})
export default connect(mapStateToProps, mapDispatchToProps)(SideMenu)
