import React, { Component } from 'react'
import { connect } from 'react-redux'
import { SideMenu, List, ListItem } from 'react-native-elements'

class SideMenuComponent extends Component {

  constructor () {
    super()
    this.state = {
      isOpen: false
    }
    this.toggleSideMenu = this.toggleSideMenu.bind(this)
  }

  toggleSideMenu () {
    this.setState({
      isOpen: !this.state.isOpen
    })
  }

  render () {
    return (
      <SideMenu
        isOpen={false}
        style={{ bacgroundColor: '#ededed' }}
      >
        {this.props.children}
      </SideMenu>
    )
  }

}

export default connect()(SideMenuComponent)
