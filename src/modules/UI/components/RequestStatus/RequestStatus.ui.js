// @flow

import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { AddressTextWithBlockExplorerModal } from '../../../../components/common/AddressTextWithBlockExplorerModal'
import s from '../../../../locales/strings.js'
import { THEME } from '../../../../theme/variables/airbitz.js'
import T from '../FormattedText/FormattedText.ui.js'

type RequestStateProps = {
  requestAddress: string,
  addressExplorer: string | null
}

export const RequestStatus = (props: RequestStateProps) => {
  const requestAddress = props.requestAddress
  const addressExplorer = props.addressExplorer

  return (
    <View style={styles.view}>
      <Text style={styles.text}>{s.strings.request_qr_your_receiving_wallet_address}</Text>

      <AddressTextWithBlockExplorerModal address={requestAddress} addressExplorer={addressExplorer}>
        <T numberOfLines={1} ellipsizeMode="middle" style={styles.text}>
          {requestAddress}
        </T>
      </AddressTextWithBlockExplorerModal>
    </View>
  )
}

const styles = StyleSheet.create({
  view: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  text: {
    color: THEME.COLORS.WHITE,
    margin: 10
  }
})
