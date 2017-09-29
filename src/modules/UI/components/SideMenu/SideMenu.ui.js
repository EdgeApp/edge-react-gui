import React, {Component} from 'react'
import Drawer from 'react-native-drawer'
import ControlPanel from '../ControlPanel'

export default class SideMenu extends Component {
  onOpen = () => this.props.open()
  onClose = () => this.props.close()

  tweenHandler = (ratio) => ({
    drawer: {
      shadowColor: 'black',
      shadowOpacity: ratio,
      shadowRadius: 7
    },
    main: {
      opacity: 1
    },
    mainOverlay: {
      opacity: ratio / 2,
      backgroundColor: 'white'
    }
  })

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
        onOpen={this.props.open}
        onClose={this.props.close}
        elevation={2}
        tweenHandler={this.tweenHandler}>
        {this.props.children}
      </Drawer>
    )
  }
}

const drawerStyles = {
  drawer: {
    shadowColor: 'black',
    shadowOpacity: 0.6,
    shadowRadius: 3
  },
  main: {paddingLeft: 3}
}
