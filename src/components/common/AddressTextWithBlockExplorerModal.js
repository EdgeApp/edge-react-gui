// @flow

import { createYesNoModal } from 'edge-components'
import type { Node } from 'react'
import React from 'react'
import { Alert, Linking, TouchableOpacity } from 'react-native'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui.js'
import { launchModal } from './ModalProvider.js'

type AddressTextWithBlockExplorerModalProps = {
  address: string,
  addressExplorer: string | null,
  children: Node
}

const AddressTextWithBlockExplorerModal = (props: AddressTextWithBlockExplorerModalProps) => {
  const { address, addressExplorer, children } = props
  const addressModal = async () => {
    if (addressExplorer) {
      const modal = createYesNoModal({
        title: s.strings.modal_addressexplorer_message,
        message: address,
        icon: <Icon type={Constants.ION_ICONS} name={Constants.WALLET_ICON} size={30} />,
        noButtonText: s.strings.string_cancel_cap,
        yesButtonText: s.strings.string_ok_cap
      })
      return (await launchModal(modal)) ? Linking.openURL(sprintf(addressExplorer, address)) : null
    }
    return Alert.alert(s.strings.modal_addressexplorer_null)
  }
  return <TouchableOpacity onPress={addressModal}>{children}</TouchableOpacity>
}

export { AddressTextWithBlockExplorerModal }
