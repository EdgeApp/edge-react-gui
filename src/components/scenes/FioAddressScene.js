// @flow

import React, { Component } from 'react'
import { Image, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import fioAddressDetailsIcon from '../../assets/images/details_fioAddress.png'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { Button } from '../../modules/UI/components/ControlPanel/Component/Button/Button.ui'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import styles from '../../styles/scenes/FioAddressStyle'

type Props = {}

export class FioAddressScene extends Component<Props> {
  render () {
    return (
      <SafeAreaView>
        <Gradient style={styles.view}>
          <View style={styles.icon}>
            <Image source={fioAddressDetailsIcon} />
          </View>
        </Gradient>
        <View style={styles.mainView}>
          <T style={styles.firstText}>{s.strings.fio_address_first_screen_title}</T>
          <View style={styles.itemList}>
            <Icon style={styles.dot} type={Constants.ENTYPO} name={Constants.DOT_SINGLE} size={26} />
            <T>{s.strings.fio_address_first_screen_item_1}</T>
          </View>
          <View style={styles.itemList}>
            <Icon style={styles.dot} type={Constants.ENTYPO} name={Constants.DOT_SINGLE} size={26} />
            <T>{s.strings.fio_address_first_screen_item_2}</T>
          </View>
          <View style={styles.itemList}>
            <Icon style={styles.dot} type={Constants.ENTYPO} name={Constants.DOT_SINGLE} size={26} />
            <T>{s.strings.fio_address_first_screen_item_3}</T>
          </View>
          <T style={styles.lastText}>{s.strings.fio_address_first_screen_end}</T>
          <T style={styles.link}>{s.strings.fio_address_learn_more}</T>
        </View>
        <View style={styles.buttonBox}>
          <Button onPress={() => Actions[Constants.FIO_ADDRESS_REGISTER]()} style={styles.toggleButton} underlayColor={styles.underlay.color}>
            <Button.Center>
              <Button.Text>
                <T>{s.strings.fio_address_list_screen_button_register}</T>
              </Button.Text>
            </Button.Center>
          </Button>
        </View>
      </SafeAreaView>
    )
  }
}
