import React, { Component } from 'react'
import { Text, View, StyleSheet, AlertIOS } from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import { Container, Content } from 'native-base'
var Slider = require('react-native-slider')

class ABSlider extends Component {
  constructor (props) {
    super(props)

    this.state = {
      value: 10,
      sliderDisabled: props.sliderDisabled
    }
  }

  resetSlider = () => {
    this.setState({ value: 10 })
  };

  onSlidingComplete = (value) => {
    console.log('onSlidingComplete')
    if(value <= 1) {
      alert("Transaction Sent!")
      console.log("Transaction Sent!")
    } else {
      alert("Transaction NOT Sent!")
      this.setState({ value: 10 })
      console.log("Transaction NOT Sent!")
    }
  };

  onValueChange = value => {
    this.setState({value})
    console.log("Value: " + this.state.value)
  };

  render() {
    return (
      <Slider
        disabled={this.props.sliderDisabled}
        onValueChange={this.onValueChange}
        onSlidingComplete={this.onSlidingComplete}
        minimumValue={0}
        maximumValue={10}
        value={this.state.value}
        style={styles.slider}
        trackStyle={styles.track}
        thumbStyle={styles.thumb}
        minimumTrackTintColor='transparent'
        maximumTrackTintColor='transparent'
      />
    )
  }
}

export default connect()(ABSlider);
