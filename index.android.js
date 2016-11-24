import React, { Component } from 'react';
import { AppRegistry } from 'react-native';

import Main from './src/MainContainer'

export default class airbitz_ui extends Component {
  render() {
    return (
		<Main />
    );
  }
}

AppRegistry.registerComponent('airbitz_ui', () => airbitz_ui);
