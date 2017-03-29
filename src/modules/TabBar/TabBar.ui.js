import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import Tabs from 'react-native-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Actions } from 'react-native-router-flux'

import { openSidebar, closeSidebar } from '../SideMenu/SideMenu.action'

class TabBar extends Component {

  _handleToggleSideBar = () => {
    this.props.dispatch(openSidebar())
  }

  render () {

    return (
        <Tabs
            style={styles.tab}
            iconStyle={styles.iconStyle}
        >
            <View style={styles.iconContainer} name="home" onSelect={ () => Actions.directory() }>
              <Icon color={'#5e6977'} name='home' size={44} />
              <Text style={styles.iconText}>Directory</Text>
            </View>
            <View style={styles.iconContainer} name="file-download">
              <Icon color={'#5e6977'} name='file-download' size={44} />
              <Text style={styles.iconText}>Request</Text>
            </View>
            <View style={styles.iconContainer} name="file-upload">
              <Icon color={'#5e6977'} name='file-upload' size={44} />
              <Text style={styles.iconText}>Scan</Text>
            </View>
            <View style={styles.iconContainer} name="swap-horiz" onSelect={ () => Actions.transactions()  }>
              <Icon color={'#5e6977'} name='swap-horiz' size={44} />
              <Text style={styles.iconText}>Transactions</Text>
            </View>
            <View style={styles.iconContainer} name="more-horiz" onSelect={ this._handleToggleSideBar }>
              <Icon color={'#5e6977'} name='more-horiz' size={44} />
              <Text style={styles.iconText}>More</Text>
            </View>
        </Tabs>
    )
  }

}

const styles = StyleSheet.create({
  tab: {
    backgroundColor:'#eaeaea',
    height:70,
    position: 'relative'
  },
  iconStyle: {
    height: 70,
    zIndex: 5
  },
  selectedStyle: {
    color:'#80C342'
  },
  iconContainer: {
    flex:1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconText: {
    fontSize: 12
  }
});



export default connect( state => ({
  sidemenu : state.sidemenu.view
}) )(TabBar)
