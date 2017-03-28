import React, { Component } from 'react'
import { View, Text } from 'react-native'
import { connect } from 'react-redux'
import Drawer from 'react-native-drawer'

class ControlPanel extends Component {
  render () {
    return (
      <View style={{backgroundColor: '#e5e5e5', flex: 1, marginBottom: 70}}>
        <Text>Oh Yeah</Text>
      </View>
    )
  }
}

class SideMenuComponent extends Component {
  closeControlPanel = () => {
    this._drawer.close()
  };
  openControlPanel = () => {
    this._drawer.open()
  };
  render () {
    return (
      <Drawer
        type="overlay"
        open={this.props.view}
        content={<ControlPanel />}
        openDrawerOffset={100}
        styles={drawerStyles}
        panOpenMask={0.5}
        panCloseMask={0.5}
        captureGestures={true}
        tweenHandler={Drawer.tweenPresets.parallax}
        side="right"
      >
        { this.props.children }
      </Drawer>
    )
  }
}

const drawerStyles = {
  drawer: { shadowColor: '#000000', shadowOpacity: 0.8, shadowRadius: 3},
  main: {paddingLeft: 3},
}

export default connect( state => ({
  view: state.sidemenu.view
}) )(SideMenuComponent)
