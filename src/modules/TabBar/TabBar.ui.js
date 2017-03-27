import React, { Component } from 'react'
import { Tabs, Tab, Icon } from 'react-native-elements'
import { connect } from 'react-redux'

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
      <Tabs>
        <Tab
          titleStyle={{fontWeight: 'bold', fontSize: 10}}
          selectedTitleStyle={{marginTop: -1, marginBottom: 6}}
          selected={true}
          title='Home'
          renderIcon={() => <Icon containerStyle={{justifyContent: 'center', alignItems: 'center', marginTop: 12}} color={'#5e6977'} name='home' size={33} />}
          renderSelectedIcon={() => <Icon color={'#6296f9'} name='whatshot' size={30} />}
          onPress={() => this.changeTab('home')}>
        </Tab>
        <Tab
          titleStyle={{fontWeight: 'bold', fontSize: 10}}
          selectedTitleStyle={{marginTop: -1, marginBottom: 6}}
          selected={false}
          title='Home'
          renderIcon={() => <Icon containerStyle={{justifyContent: 'center', alignItems: 'center', marginTop: 12}} color={'#5e6977'} name='home' size={33} />}
          renderSelectedIcon={() => <Icon color={'#6296f9'} name='whatshot' size={30} />}
          onPress={() => this.changeTab('home')}>
        </Tab>
      </Tabs>
    )
  }

}

export default connect()(TabBar)
