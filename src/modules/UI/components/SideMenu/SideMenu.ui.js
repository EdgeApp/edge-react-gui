import React, {Component} from 'react'
import {connect} from 'react-redux'
import Drawer from 'react-native-drawer'

import {openSidebar, closeSidebar} from './action'

import ControlPanel from '../ControlPanel'

class SideMenuComponent extends Component {
  render () {
    return (
      <Drawer
        type='overlay'
        style={drawerStyles}
        content={<ControlPanel />}
        open={this.props.view}
        openDrawerOffset={0.20}
        tapToClose
        panCloseMask={0.99}
        panOpenMask={0.1}
        captureGestures={false}
        negotiatePan
        side='right'
        onOpen={() => this.props.dispatch(openSidebar())}
        onClose={() => this.props.dispatch(closeSidebar())}
        elevation={2}
        tweenHandler={ratio => ({
          main: {
            opacity: 1
          },
          mainOverlay: {
            opacity: ratio / 2,
            backgroundColor: '#FFF'
          }
        })}
      >
        {this.props.children}
      </Drawer>
    )
  }
}

const drawerStyles = {
  drawer: {
    shadowColor: '#000000',
    shadowOpacity: 0.8,
    shadowRadius: 3
  },
  main: {paddingLeft: 3}
}

const mapStateToProps = state => ({
  view: state.ui.scenes.sideMenu.view
})

export default connect(mapStateToProps)(SideMenuComponent)
