import React, { Component } from 'react'
import { Text, View, StyleSheet, AlertIOS, Slider } from 'react-native'
import { connect } from 'react-redux'
// import styles from './styles.js'
import { Container, Content } from 'native-base'

const styles = StyleSheet.create({
  view: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  slider: {
    flex: 1,
    backgroundColor: 'blue',
    height: 50
  },
  thumb: {
    width: 300,
    height: 300,
    borderRadius: 5,
  }
})

class ABSlider extends Component {
  constructor (props) {
    super(props)

    this.state = {
      value: 10
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

  render () {
    console.log('rendering the slider')
    console.log('this.state.value: ' + this.state.value)

    return (
      <View style={styles.view}>
        <Slider
          onValueChange={this.onValueChange}
          style={styles.slider}
          animateTransitions
          thumbTintColor={'red'}
          animationType={'spring'}
          minimumValue={0}
          minimumTrackTintColor={'red'}
          maximumValue={10}
          maximumTrackTintColor={'red'}
          thumbTintColor={'red'}
          onSlidingComplete={this.onSlidingComplete}
          value={this.state.value}
        />
      </View>
    )
  }
}

export default connect()(ABSlider);
