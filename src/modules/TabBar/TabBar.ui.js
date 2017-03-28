import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import Tabs from 'react-native-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons'

import { openSidebar } from '../SideMenu/SideMenu.action'

class TabBar extends Component {

  constructor() {
    super()
    this.state = {
      selectedTab: 'profile',
    }
  }

  changeTab (selectedTab) {
    this.setState({selectedTab})
  }

  render () {
    const { selectedTab } = this.state

    return (
        <Tabs
            selected={this.state.page}
            style={styles.tab}
            iconStyle={styles.iconStyle}
            onSelect={el=>this.setState({page:el.props.name})}
        >
            <View style={styles.iconContainer} name="home">
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
            <View style={styles.iconContainer} name="swap-horiz">
              <Icon color={'#5e6977'} name='swap-horiz' size={44} />
              <Text style={styles.iconText}>Transactions</Text>
            </View>
            <View style={styles.iconContainer} name="more-horiz">
              <Icon color={'#5e6977'} name='more-horiz' size={44} />
              <Text style={styles.iconText}>More</Text>
            </View>
        </Tabs>
    )
  }

}

const styles = StyleSheet.create({
  tab: {
    backgroundColor:'white',
    height:70
  },
  iconStyle: {
    height: 70
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



export default connect()(TabBar)
