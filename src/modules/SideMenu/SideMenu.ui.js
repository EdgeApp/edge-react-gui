import React, { Component } from 'react'
import { View, Text } from 'react-native'
import { connect } from 'react-redux'
import Drawer from 'react-native-drawer'

import { openSidebar, closeSidebar } from './SideMenu.action'

import ControlPanel from '../ControlPanel/ControlPanel.ui'

class SideMenuComponent extends Component {
  render () {
    return (
      <Drawer
        type="overlay"
        open={this.props.view}
        content={<ControlPanel />}
        openDrawerOffset={(viewport) => viewport.width * .25}
        tapToClose={true}
        panOpenMask={0.1}
        side="right"
        onOpen={() => this.props.dispatch(openSidebar())}
        onClose={() => this.props.dispatch(closeSidebar())}
      >
        { this.props.children }
      </Drawer>
    )
  }
}

export default connect( state => ({

  view: state.sidemenu.view

}) )(SideMenuComponent)
