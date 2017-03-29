import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

class Header extends Component {

  render () {
    console.log(this.props.routes)
    return (
      <View style={styles.container}>
        <Text style={styles.left}></Text>
        <Text style={styles.center}>Header</Text>
        <Text style={styles.right}>Help</Text>
      </View>
    )
  }

}

const styles = StyleSheet.create({

  container: {
    backgroundColor:'#eaeaea',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 35,

  },

  center: {
    flex: 1,
    fontSize: 16,
    textAlign: 'center'
  },

  left: {
    fontSize: 16,
    paddingLeft: 15,
    width: 50
  },

  right: {
    fontSize: 16,
    paddingRight: 15,
    width: 50
  },

});



export default connect( state => ({
  routes: state.routes
}) )(Header)
