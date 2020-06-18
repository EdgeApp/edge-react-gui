// @flow

import { createInputModal, createSecureTextModal, createSimpleConfirmModal, Icon } from 'edge-components'
import React from 'react'
import { Actions } from 'react-native-router-flux'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { sprintf } from 'sprintf-js'

import { launchModal } from '../components/common/ModalProvider.js'
import { RawTextModal } from '../components/modals/RawTextModal.js'
import { Airship, showError } from '../components/services/AirshipInstance.js'
import * as Constants from '../constants/indexConstants'
import s from '../locales/strings.js'
import Text from '../modules/UI/components/FormattedText/FormattedText.ui.js'
import * as WALLET_SELECTORS from '../modules/UI/selectors.js'
import { B } from '../styles/common/textStyles.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { getWalletName } from '../util/CurrencyWalletHelpers.js'
import { showDeleteWalletModal } from './DeleteWalletModalActions.js'
import { showResyncWalletModal } from './ResyncWalletModalActions.js'
import { showSplitWalletModal } from './SplitWalletModalActions.js'
import { refreshWallet } from './WalletActions.js'

export type WalletListMenuKey =
  | 'sort'
  | 'rename'
  | 'delete'
  | 'resync'
  | 'exportWalletTransactions'
  | 'getSeed'
  | 'split'
  | 'manageTokens'
  | 'viewXPub'
  | 'getRawKeys'

export function walletListMenuAction(walletId: string, option: WalletListMenuKey) {
  switch (option) {
    case 'manageTokens': {
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const wallet = WALLET_SELECTORS.getWallet(state, walletId)
        Actions.manageTokens({ guiWallet: wallet })
      }
    }

    case 'delete': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const wallet = WALLET_SELECTORS.getWallet(state, walletId)
        const type = wallet.type.replace('wallet:', '')
        let fioAddress = ''

        if (type === 'fio') {
          const engine = state.core.account.currencyWallets[walletId]
          if (engine != null) {
            try {
              const fioAddresses = await engine.otherMethods.getFioAddressNames()
              fioAddress = fioAddresses.length ? fioAddresses[0] : ''
            } catch (e) {
              fioAddress = ''
            }
          }
        }
        if (fioAddress) {
          dispatch(showDeleteWalletModal(walletId, s.strings.fragmet_wallets_delete_fio_extra_message_mobile))
        } else {
          dispatch(showDeleteWalletModal(walletId))
        }
      }
    }

    case 'resync': {
      return (dispatch: Dispatch) => {
        dispatch(showResyncWalletModal(walletId))
      }
    }

    case 'split': {
      return (dispatch: Dispatch) => {
        dispatch(showSplitWalletModal(walletId))
      }
    }

    case 'viewXPub': {
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const { currencyWallets = {} } = state.core.account
        const wallet = currencyWallets[walletId]
        const xPub = wallet.getDisplayPublicSeed()
        const xPubExplorer = wallet.currencyInfo.xpubExplorer && xPub ? sprintf(wallet.currencyInfo.xpubExplorer, xPub) : ''
        dispatch({ type: 'OPEN_VIEWXPUB_WALLET_MODAL', data: { xPub, walletId, xPubExplorer } })
      }
    }

    case 'exportWalletTransactions': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const { currencyWallets = {} } = state.core.account
        const wallet = currencyWallets[walletId]
        Actions[Constants.TRANSACTIONS_EXPORT]({ sourceWallet: wallet })
      }
    }

    case 'getSeed': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const { theme } = state
        const icon = <FontAwesome style={{ left: theme.rem(0.125) }} name="user-secret" color={theme.tileBackground} size={theme.rem(2)} />

        const { account } = state.core
        const { currencyWallets = {} } = account
        const wallet = currencyWallets[walletId]

        try {
          const input = {
            label: s.strings.confirm_password_text,
            autoCorrect: false,
            returnKeyType: 'go',
            initialValue: '',
            autoFocus: true
          }
          const yesButton = {
            title: s.strings.fragment_wallets_get_seed_wallet
          }
          const noButton = {
            title: s.strings.string_cancel_cap
          }

          const validateInput = async input => {
            const isPassword = await account.checkPassword(input)
            if (isPassword) {
              dispatch({ type: 'PASSWORD_USED' })
              return {
                success: true,
                message: ''
              }
            } else {
              return {
                success: false,
                message: s.strings.password_reminder_invalid
              }
            }
          }

          const getSeedModal = createSecureTextModal({
            icon,
            title: s.strings.fragment_wallets_get_seed_wallet,
            message: (
              <Text>
                {s.strings.fragment_wallets_get_seed_wallet_first_confirm_message_mobile}
                <B>{getWalletName(wallet)}</B>
              </Text>
            ),
            input,
            yesButton,
            noButton,
            validateInput
          })
          const resolveValue = await launchModal(getSeedModal)
          if (resolveValue) {
            const seed = wallet.getDisplayPrivateSeed()
            const modal = createSimpleConfirmModal({
              title: s.strings.fragment_wallets_get_seed_wallet,
              message: seed,
              buttonText: s.strings.string_ok,
              icon
            })
            await launchModal(modal)
          }
        } catch (error) {
          showError(error)
        }
      }
    }

    case 'getRawKeys': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const { theme } = state
        const icon = <FontAwesome style={{ left: theme.rem(0.125) }} name="user-secret" color={theme.tileBackground} size={theme.rem(2)} />

        const { account } = state.core

        try {
          const input = {
            label: s.strings.confirm_password_text,
            autoCorrect: false,
            returnKeyType: 'go',
            initialValue: '',
            autoFocus: true
          }
          const yesButton = {
            title: s.strings.string_get_raw_keys
          }
          const noButton = {
            title: s.strings.string_cancel_cap
          }

          const validateInput = async input => {
            const isPassword = await account.checkPassword(input)
            if (isPassword) {
              dispatch({ type: 'PASSWORD_USED' })
              return {
                success: true,
                message: ''
              }
            } else {
              return {
                success: false,
                message: s.strings.password_reminder_invalid
              }
            }
          }

          const getSeedModal = createSecureTextModal({
            icon,
            title: s.strings.string_get_raw_keys,
            message: <Text>{s.strings.fragment_wallets_get_raw_key_wallet_confirm_message}</Text>,
            input,
            yesButton,
            noButton,
            validateInput
          })
          const resolveValue = await launchModal(getSeedModal)

          if (resolveValue) {
            const keys = account.allKeys.find(key => key.id === walletId)
            const seed = keys ? JSON.stringify(keys.keys, null, 2) : ''
            Airship.show(bridge => <RawTextModal bridge={bridge} body={seed} title={s.strings.string_raw_keys} icon={icon} />)
          }
        } catch (error) {
          showError(error)
        }
      }
    }

    case 'rename': {
      return async (dispatch: Dispatch, getState: GetState) => {
        try {
          const state = getState()
          const { currencyWallets = {} } = state.core.account
          const wallet = currencyWallets[walletId]
          const walletName = wallet.name
          const input = {
            label: s.strings.fragment_wallets_rename_wallet,
            autoCorrect: false,
            returnKeyType: 'go',
            initialValue: walletName,
            autoFocus: true
          }
          const yesButton = {
            title: s.strings.string_done_cap
          }
          const noButton = {
            title: s.strings.string_cancel_cap
          }
          const renameWalletModal = createInputModal({
            icon: <Icon type={Constants.FONT_AWESOME} name={Constants.RENAME} size={30} />,
            title: s.strings.fragment_wallets_rename_wallet,
            input,
            yesButton,
            noButton
          })
          const resolveValue = await launchModal(renameWalletModal)
          if (resolveValue) {
            await wallet.renameWallet(resolveValue)
            dispatch(refreshWallet(walletId))
          }
        } catch (error) {
          showError(error)
        }
      }
    }

    default:
      return (dispatch: Dispatch) => undefined
  }
}
