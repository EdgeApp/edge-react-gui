// @flow

import React from 'react'
import { Image, TouchableHighlight, View } from 'react-native'

import fioAddressListIcon from '../../assets/images/list_fioAddress.png'
import * as Constants from '../../constants/indexConstants'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import styles from '../../styles/scenes/FioAddressListStyle'
import type { FioAddress } from '../../types/types'
import { scale } from '../../util/scaling.js'

type FioAddressItemProps = {
  address: FioAddress,
  onFioAddressPress: (fioAddress: string, expiration: string) => void
}

const FioAddressItem = (props: FioAddressItemProps) => {
  const { address, onFioAddressPress } = props

  return (
    <TouchableHighlight onPress={() => onFioAddressPress(`${address.fio_address}`, address.expiration)}>
      <View style={styles.item}>
        <View style={styles.icon}>
          <Image source={fioAddressListIcon} style={styles.iconImg} />
        </View>
        <View style={styles.info}>
          <T style={styles.infoTitle}>{address.fio_address}</T>
          <T style={styles.infoSubtitle}>
            {`${s.strings.fio_address_details_screen_expires} `}&nbsp;
            {intl.formatExpDate(address.expiration)}
          </T>
        </View>
        <View style={styles.arrow}>
          <Icon type={Constants.FONT_AWESOME} name={Constants.ANGLE_RIGHT} size={scale(30)} />
        </View>
      </View>
    </TouchableHighlight>
  )
}

export default FioAddressItem
