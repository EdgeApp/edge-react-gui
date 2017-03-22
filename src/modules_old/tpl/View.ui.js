const Device = require('../../lib/DeviceDetect')
const Orientation = require('react-native-orientation')
import React, { Component } from 'react'
import { LayoutAnimation, Text } from 'react-native'
import { Container, Content } from 'native-base'
import Loader from '../Loader/Loader.ui'
import ErrorModal from '../ErrorModal/ErrorModal.ui'

class TemplateView extends Component {

  componentWillMount () {
    if (!Device.isTablet) {
      Orientation.lockToPortrait()
    }
  }
  componentWillUpdate () {
    LayoutAnimation.spring()
  }
  renderHeader () {
    return null // (<Header><Text>Replace Me</Text></Header>)
  }
  renderFooter () {
    return null // (<Footer><Text>Replace Me</Text></Footer>)
  }
  renderContent () {
    return (<Text>Replace Me</Text>)
  }
  renderContainer () {
    return (
      <Container>
        {this.renderHeader()}
        <Content>{this.renderContent()}</Content>
        {this.renderFooter()}
        <Loader />
        <ErrorModal />
      </Container>
    )
  }
  render () {
    return this.renderContainer()
  }
}

export default TemplateView
