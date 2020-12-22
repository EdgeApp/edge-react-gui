// @flow

import * as React from 'react'
import { Image, StyleSheet, TouchableHighlight, View } from 'react-native'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import IonIcon from 'react-native-vector-icons/Ionicons'

import fioAddressListIcon from '../../../assets/images/list_fioAddress.png'
import { formatDate } from '../../../locales/intl.js'
import s from '../../../locales/strings.js'
import T from '../../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../../theme/variables/airbitz.js'
import type { FioAddress, FioDomain } from '../../../types/types'
import { scale } from '../../../util/scaling.js'

type FioAddressNameProps = {
  item: FioAddress,
  onPress: FioAddress => void
}

type FioDomainNameProps = {
  item: FioDomain,
  onPress: FioDomain => void
}

type FioNameProps = {
  name: string,
  expiration: string,
  icon: React.Node
}

const ionIconSize = THEME.rem(2.375)

const FioName = (props: FioNameProps) => {
  const { name, expiration, icon } = props

  return (
    <View style={styles.item}>
      <View style={styles.icon}>{icon}</View>
      <View style={styles.info}>
        <T style={styles.infoTitle}>{name}</T>
        <T style={styles.infoSubtitle}>
          {`${s.strings.fio_address_details_screen_expires} `}&nbsp;
          {formatDate(new Date(expiration))}
        </T>
      </View>
      <View style={styles.arrow}>
        <FontAwesomeIcon name="angle-right" size={THEME.rem(2)} />
      </View>
    </View>
  )
}

export const FioAddressRow = (props: FioAddressNameProps) => {
  const { item, onPress } = props

  return (
    <TouchableHighlight onPress={() => onPress(item)} underlayColor={`${THEME.COLORS.PRIMARY}${THEME.ALPHA.LOW}`}>
      <FioName name={item.name} expiration={item.expiration} icon={<Image source={fioAddressListIcon} style={styles.iconImg} />} />
    </TouchableHighlight>
  )
}

export const FioDomainRow = (props: FioDomainNameProps) => {
  const { item, onPress } = props

  return (
    <TouchableHighlight onPress={() => onPress(item)} underlayColor={`${THEME.COLORS.PRIMARY}${THEME.ALPHA.LOW}`}>
      <FioName
        name={item.name}
        expiration={item.expiration}
        icon={<IonIcon name="ios-at" style={styles.iconIon} color={THEME.COLORS.BLUE_3} size={ionIconSize} />}
      />
    </TouchableHighlight>
  )
}

const rawStyles = {
  item: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(15),
    borderBottomColor: THEME.COLORS.FIO_ADDRESS_LIST_BORDER_BOTTOM,
    borderBottomWidth: 1
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
    marginLeft: scale(5)
  },
  iconImg: {
    height: scale(40),
    width: scale(45)
  },
  iconIon: {
    height: scale(40),
    width: scale(45),
    paddingRight: scale(4),
    textAlign: 'center'
  },
  info: {
    flex: 4
  },
  infoTitle: {
    color: THEME.COLORS.FIO_ADDRESS_LIST_FONT,
    fontSize: scale(18)
  },
  infoSubtitle: {
    color: THEME.COLORS.FIO_ADDRESS_LIST_FONT,
    fontSize: scale(12)
  },
  arrow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto'
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
