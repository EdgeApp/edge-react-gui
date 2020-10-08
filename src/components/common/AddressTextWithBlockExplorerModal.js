// @flow

import * as React from 'react'
import { Alert, Linking, TouchableOpacity } from 'react-native'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { ButtonsModal } from '../modals/ButtonsModal.js'
import { Airship } from '../services/AirshipInstance.js'

type AddressTextWithBlockExplorerModalProps = {
  address: string,
  addressExplorer: string | null,
  children: React.Node
}

const AddressTextWithBlockExplorerModal = (props: AddressTextWithBlockExplorerModalProps) => {
  const { address, addressExplorer, children } = props
  const addressModal = async () => {
    if (addressExplorer) {
      const modal = await Airship.show(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={s.strings.modal_addressexplorer_message}
          message={address}
          buttons={{
            confirm: { label: s.strings.string_ok_cap },
            cancel: { label: s.strings.string_cancel_cap, type: 'secondary' }
          }}
        />
      ))
      return modal === 'confirm' ? Linking.openURL(sprintf(addressExplorer, address)) : null
    }
    return Alert.alert(s.strings.modal_addressexplorer_null)
  }
  return <TouchableOpacity onPress={addressModal}>{children}</TouchableOpacity>
}

export { AddressTextWithBlockExplorerModal }
