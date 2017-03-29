import React, { Component } from 'react'
import { View, Text } from 'react-native'
import { connect } from 'react-redux'
import Drawer from 'react-native-drawer'

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
        styles={drawerStyles}
        panOpenMask={0.1}
        side="right"
      >
        { this.props.children }
      </Drawer>
    )
  }
}

const drawerStyles = {
  drawer: {
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
}

export default connect( state => ({

  view: state.sidemenu.view

}) )(SideMenuComponent)
