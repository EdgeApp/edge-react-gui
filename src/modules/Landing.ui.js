import React, { Component } from 'react'
import { View, Text, StyleSheet }  from 'react-native'
import { connect } from 'react-redux'

import TabBar from './TabBar/TabBar.ui'
import SideMenu from './SideMenu/SideMenu.ui'

class Landing extends Component {

  render () {
    return (
      <SideMenu>
        <View style={styles.container}>
          <Text>Sample!</Text>
          <TabBar />
        </View>
      </SideMenu>
    )
  }

}

const styles = StyleSheet.create({

  container: {
    flex:1,
    backgroundColor: 'green'
  },

  main: {
    flex: 1
  }

})

export default connect()(Landing)

