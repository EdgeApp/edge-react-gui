// @flow

import { createInputModal, createSecureTextModal } from 'edge-components'
import * as React from 'react'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import { sprintf } from 'sprintf-js'

import { launchModal } from '../components/common/ModalProvider.js'
import { ButtonsModal } from '../components/modals/ButtonsModal.js'
import { showInfoModal } from '../components/modals/InfoModal'
import { RawTextModal } from '../components/modals/RawTextModal.js'
import { Airship, showError } from '../components/services/AirshipInstance.js'
import { getTheme } from '../components/services/ThemeContext.js'
import { CheckPasswordModal } from '../components/themed/CheckPasswordModal.js'
import { MANAGE_TOKENS, TRANSACTIONS_EXPORT } from '../constants/SceneKeys.js'
import s from '../locales/strings.js'
import Text from '../modules/UI/components/FormattedText/FormattedText.ui.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'
import { getWalletName } from '../util/CurrencyWalletHelpers.js'
import { showDeleteWalletModal } from './DeleteWalletModalActions.js'
import { showResyncWalletModal } from './ResyncWalletModalActions.js'
import { showSplitWalletModal } from './SplitWalletModalActions.js'
import { refreshWallet } from './WalletActions.js'

export type WalletListMenuKey = 'rename' | 'delete' | 'resync' | 'exportWalletTransactions' | 'getSeed' | 'split' | 'manageTokens' | 'viewXPub' | 'getRawKeys'

export function walletListMenuAction(walletId: string, option: WalletListMenuKey, currencyCode?: string) {
  switch (option) {
    case 'manageTokens': {
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const wallet = state.ui.wallets.byId[walletId]
        Actions.push(MANAGE_TOKENS, {
          guiWallet: wallet
        })
      }
    }

    case 'delete': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const wallets = state.ui.wallets.byId
        const wallet = wallets[walletId]

        if (Object.values(wallets).length === 1) {
          showInfoModal(s.strings.cannot_delete_last_wallet_modal_title, [
            s.strings.cannot_delete_last_wallet_modal_message_part_1,
            s.strings.cannot_delete_last_wallet_modal_message_part_2
          ])
          return
        }

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
        } else if (wallet.currencyCode && wallet.currencyCode.toLowerCase() === 'eth') {
          dispatch(showDeleteWalletModal(walletId, s.strings.fragmet_wallets_delete_eth_extra_message))
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
        const { currencyWallets } = state.core.account
        const wallet = currencyWallets[walletId]
        const xPub = wallet.displayPublicSeed
        const xPubExplorer = wallet.currencyInfo.xpubExplorer && xPub ? sprintf(wallet.currencyInfo.xpubExplorer, xPub) : ''
        dispatch({ type: 'OPEN_VIEWXPUB_WALLET_MODAL', data: { xPub, walletId, xPubExplorer } })
      }
    }

    case 'exportWalletTransactions': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const { currencyWallets } = state.core.account
        const wallet = currencyWallets[walletId]
        Actions.push(TRANSACTIONS_EXPORT, {
          sourceWallet: wallet,
          currencyCode
        })
      }
    }

    case 'getSeed': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const { account } = state.core
        const { currencyWallets } = account
        const wallet = currencyWallets[walletId]
        const message = `${s.strings.fragment_wallets_get_seed_wallet_first_confirm_message_mobile}\n${getWalletName(wallet)}`

        const passwordValid = await Airship.show(bridge => (
          <CheckPasswordModal
            bridge={bridge}
            buttonLabel={s.strings.fragment_wallets_get_seed_wallet}
            message={message}
            title={s.strings.fragment_wallets_get_seed_wallet}
          />
        ))

        if (passwordValid) {
          await Airship.show(bridge => (
            <ButtonsModal
              title={s.strings.fragment_wallets_get_seed_wallet}
              bridge={bridge}
              message={wallet.displayPrivateSeed || undefined}
              buttons={{ ok: { label: s.strings.string_ok_cap } }}
            />
          ))
        }
      }
    }

    case 'getRawKeys': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const theme = getTheme()
        const icon = <FontAwesomeIcon style={{ left: theme.rem(0.125) }} name="user-secret" color={theme.tileBackground} size={theme.rem(2)} />

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
            Airship.show(bridge => <RawTextModal bridge={bridge} body={seed} title={s.strings.string_raw_keys} icon={icon} disableCopy />)
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
          const { currencyWallets } = state.core.account
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
            icon: <FontAwesomeIcon name="edit" size={30} />,
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
