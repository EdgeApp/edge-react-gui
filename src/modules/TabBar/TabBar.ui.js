import React, { Component } from 'react'
import { View, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
// import Tabs from 'react-native-tabs';
import { Actions } from 'react-native-router-flux'

import { Footer, FooterTab, Button, Icon, Text } from 'native-base'

import { openSidebar, closeSidebar } from '../SideMenu/SideMenu.action'

// class TabBar extends Component {
//
//   _handleToggleSideBar = () => {
//     this.props.dispatch(openSidebar())
//   }
//
//   render () {
//
//     return (
//       <Footer >
//         <FooterTab>
//           <Button>
//             <Text>Apps</Text>
//           </Button>
//           <Button>
//             <Text>Camera</Text>
//           </Button>
//           <Button active>
//             <Text>Navigate</Text>
//           </Button>
//           <Button>
//             <Text>Contact</Text>
//           </Button>
//         </FooterTab>
//       </Footer>
//
//         <Tabs
//             style={styles.tab}
//             iconStyle={styles.iconStyle}
//         >
//             <View style={styles.iconContainer} name="home" onSelect={ () => Actions.directory() }>
//               <Icon color={'#5e6977'} name='home' size={44} />
//               <Text style={styles.iconText}>Directory</Text>
//             </View>
//             <View style={styles.iconContainer} name="file-download">
//               <Icon color={'#5e6977'} name='file-download' size={44} />
//               <Text style={styles.iconText}>Request</Text>
//             </View>
//             <View style={styles.iconContainer} name="file-upload">
//               <Icon color={'#5e6977'} name='file-upload' size={44} />
//               <Text style={styles.iconText}>Scan</Text>
//             </View>
//             <View style={styles.iconContainer} name="swap-horiz" onSelect={ () => Actions.transactions()  }>
//               <Icon color={'#5e6977'} name='swap-horiz' size={44} />
//               <Text style={styles.iconText}>Transactions</Text>
//             </View>
//             <View style={styles.iconContainer} name="more-horiz" onSelect={ this._handleToggleSideBar }>
//               <Icon color={'#5e6977'} name='more-horiz' size={44} />
//               <Text style={styles.iconText}>More</Text>
//             </View>
//         </Tabs>
//     )
//   }
//
// }

class TabBar extends Component {

  _handleToggleSideBar = () => {
    this.props.dispatch(openSidebar())
  }

  render () {
    console.log(this.props.sidemenu)
    return (
        <Footer>
          <FooterTab>
            <Button onPress={ () => Actions.directory() }>
              <Icon name='home' />
              <Text>Directory</Text>
            </Button>
            <Button>
              <Icon name='download' />
              <Text>Request</Text>
            </Button>
            <Button>
              <Icon name='arrow-round-up' />
              <Text>Scan</Text>
            </Button>
            <Button onPress={ () => Actions.transactions() }>
              <Icon name='swap' />
              <Text>Transactions</Text>
            </Button>
            <Button onPress={ this._handleToggleSideBar } active={ this.props.sidemenu ? true : false }>
              <Icon name='menu' />
              <Text>More</Text>
            </Button>
          </FooterTab>
        </Footer>
    )
  }

}

export default connect( state => ({

  sidemenu : state.sidemenu.view

}) )(TabBar)
