// @flow

import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'
import { ScrollView } from 'react-native-gesture-handler'

import { logoutRequest } from '../../actions/LoginActions.js'
import { useHandler } from '../../hooks/useHandler.js'
import s from '../../locales/strings.js'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { ModalMessage } from '../themed/ModalParts.js'
import { ConfirmContinueModal } from './ConfirmContinueModal.js'

type Props = {
  bridge: AirshipBridge<boolean>
}

export function DeleteAccountModal(props: Props) {
  const { bridge } = props
  const account = useSelector(state => state.core.account)
  const context = useSelector(state => state.core.context)
  const dispatch = useDispatch()

  const handleDelete = useHandler(async () => {
    await account.deleteRemoteAccount()
    await dispatch(logoutRequest())
    await context.deleteLocalAccount(account.username)
    return true
  })

  return (
    <ConfirmContinueModal bridge={bridge} title={s.strings.delete_account_title} isSkippable warning onPress={handleDelete}>
      <ScrollView style={{ flexGrow: 1 }}>
        <ModalMessage>{s.strings.delete_account_funds}</ModalMessage>
        {/*
        // You will also lose access to the following applications using the Edge login system:
        <ModalMessage>{s.strings.delete_account_edge_login}</ModalMessage>
        */}
        <ModalMessage>{s.strings.delete_account_partner}</ModalMessage>
        <ModalMessage>{s.strings.delete_account_devices}</ModalMessage>
        <ModalMessage>{s.strings.delete_account_username}</ModalMessage>
        <ModalMessage>{s.strings.delete_account_support}</ModalMessage>
      </ScrollView>
    </ConfirmContinueModal>
  )
}
