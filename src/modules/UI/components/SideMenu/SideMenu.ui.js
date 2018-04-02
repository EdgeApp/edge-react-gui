/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import Drawer from 'react-native-drawer'

import THEME from '../../../../theme/variables/airbitz'
import ControlPanel from '../ControlPanel'

export default class SideMenu extends Component {
  onOpen = this.props.open
  onClose = this.props.close

  tweenHandler = ratio => ({
    drawer: {
      shadowColor: THEME.COLORS.BLACK,
      shadowOpacity: ratio,
      shadowRadius: 7
    },
    main: {
      opacity: 1
    },
    mainOverlay: {
      opacity: ratio / 2,
      backgroundColor: THEME.COLORS.WHITE
    }
  })

  render () {
    return (
      <Drawer
        type="overlay"
        style={drawerStyles}
        content={<ControlPanel />}
        open={this.props.view}
        openDrawerOffset={0.2}
        tapToClose
        panCloseMask={0.99}
        panOpenMask={0.1}
        captureGestures={false}
        negotiatePan
        side="right"
        onOpen={this.props.open}
        onClose={this.props.close}
        elevation={2}
        tweenHandler={this.tweenHandler}
      >
        {this.props.children}
      </Drawer>
    )
  }
}

const drawerStyles = {
  drawer: {
    shadowColor: THEME.COLORS.BLACK,
    shadowOpacity: THEME.OPACITY.MID,
    shadowRadius: 3
  },
  main: {
    paddingLeft: 3
  }
}
