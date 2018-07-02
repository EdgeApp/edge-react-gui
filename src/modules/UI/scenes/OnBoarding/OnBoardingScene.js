// @flow
import React, { Component } from 'react'
import { Modal, View, Text } from 'react-native'
import { OnBoardingSceneStyles } from '../../../../styles/indexStyles.js'
import Swiper from 'react-native-swiper'
type Props= {
  finishOnBoarding(): void
}

type State = {

}

export default class WalletList extends Component<Props, State> {
  onModalClose =() => {
    console.log('swiper: modalClose ')
  }
  slideChanged = (index: number) => {
    console.log('swiper: index changed ', index)
  }
  render () {
    const styles = OnBoardingSceneStyles
    return <Modal style={styles.modalContainer} isVisible={true} onRequestClose={this.onModalClose}>
      <Swiper style={styles.wrapper} showsButtons={false} loop={false} index={0} onIndexChanged={this.slideChanged}>
        <View style={styles.slide1}>
          <Text style={styles.text}>Hello Swiper</Text>
        </View>
        <View style={styles.slide2}>
          <Text style={styles.text}>Beautiful</Text>
        </View>
        <View style={styles.slide3}>
          <Text style={styles.text}>And simple</Text>
        </View>
      </Swiper>
    </Modal>
  }
}
