// @flow

import React from 'react'
import { Image, TouchableHighlight, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import fioAddressListIcon from '../../../assets/images/list_fioAddress.png'
import * as Constants from '../../../constants/indexConstants'
import { intl } from '../../../locales/intl'
import s from '../../../locales/strings.js'
import T from '../../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Icon } from '../../../modules/UI/components/Icon/Icon.ui'
import { styles } from '../../../styles/scenes/FioAddressListStyle'
import { THEME } from '../../../theme/variables/airbitz'
import type { FioAddress, FioDomain } from '../../../types/types'
import { scale } from '../../../util/scaling.js'

type FioNameProps = {
  item: FioAddress | FioDomain,
  onPress: (fioAddress: string, expiration: string) => void,
  isDomain?: boolean
}

const ionIconSize = THEME.rem(2.375)

export const FioName = (props: FioNameProps) => {
  const { item, isDomain, onPress } = props

  return (
    <TouchableHighlight onPress={() => onPress(`${item.name}`, item.expiration)} underlayColor={styles.underlay.color}>
      <View style={styles.item}>
        <View style={styles.icon}>
          {isDomain ? (
            <IonIcon name="ios-at" style={styles.iconIon} color={THEME.COLORS.BLUE_3} size={ionIconSize} />
          ) : (
            <Image source={fioAddressListIcon} style={styles.iconImg} />
          )}
        </View>
        <View style={styles.info}>
          <T style={styles.infoTitle}>{item.name}</T>
          <T style={styles.infoSubtitle}>
            {`${s.strings.fio_address_details_screen_expires} `}&nbsp;
            {intl.formatExpDate(item.expiration)}
          </T>
        </View>
        <View style={styles.arrow}>
          <Icon type={Constants.FONT_AWESOME} name={Constants.ANGLE_RIGHT} size={scale(30)} />
        </View>
      </View>
    </TouchableHighlight>
  )
}
