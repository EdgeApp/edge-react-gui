// @flow

import { Icon, createInputModal, createSecureTextModal, createSimpleConfirmModal } from 'edge-components'
import React from 'react'
import { Actions } from 'react-native-router-flux'
import FAIcon from 'react-native-vector-icons/FontAwesome'

import { refreshWallet } from '../actions/WalletActions.js'
import { launchModal } from '../components/common/ModalProvider.js'
import * as Constants from '../constants/indexConstants'
import s from '../locales/strings.js'
import * as ACCOUNT_API from '../modules/Core/Account/api.js'
import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import type { Dispatch, GetState } from '../modules/ReduxTypes'
import { displayErrorAlert } from '../modules/UI/components/ErrorAlert/actions'
import Text from '../modules/UI/components/FormattedText'
import * as WALLET_SELECTORS from '../modules/UI/selectors.js'
import { THEME } from '../theme/variables/airbitz.js'
import { showDeleteWalletModal } from './DeleteWalletModalActions.js'
import { showResyncWalletModal } from './ResyncWalletModalActions.js'
import { showSplitWalletModal } from './SplitWalletModalActions.js'

export const walletRowOption = (walletId: string, option: string, archived: boolean) => {
  if (option === 'archive' && archived) {
    option = 'activate'
  }
  switch (option) {
    case 'restore':
    case 'activate': {
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const account = CORE_SELECTORS.getAccount(state)

        ACCOUNT_API.activateWalletRequest(account, walletId).catch(error => console.log(error))
      }
    }

    case 'archive': {
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const account = CORE_SELECTORS.getAccount(state)

        ACCOUNT_API.archiveWalletRequest(account, walletId).catch(error => console.log(error))
      }
    }

    case 'addToken': {
      return (dispatch: Dispatch) => {
        dispatch({ type: 'ADD_TOKEN', data: { walletId } })
      }
    }

    case 'manageTokens': {
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const wallet = WALLET_SELECTORS.getWallet(state, walletId)
        Actions.manageTokens({ guiWallet: wallet })
      }
    }

    case 'delete': {
      return (dispatch: Dispatch) => {
        dispatch(showDeleteWalletModal(walletId))
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
        const wallet = CORE_SELECTORS.getWallet(state, walletId)
        const xPub = wallet.getDisplayPublicSeed()
        dispatch({ type: 'OPEN_VIEWXPUB_WALLET_MODAL', data: { xPub, walletId } })
      }
    }

    case 'exportWalletTransactions': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const wallet = state.core.wallets.byId[walletId]
        Actions[Constants.TRANSACTIONS_EXPORT]({ sourceWallet: wallet })
      }
    }

    case 'getSeed': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const walletName = CORE_SELECTORS.getWalletName(state, walletId)
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
            const account = CORE_SELECTORS.getAccount(state)
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
            icon: (
              <FAIcon
                style={{ position: 'relative', left: 1 }}
                type={Constants.FONT_AWESOME}
                name={Constants.GET_SEED}
                color={THEME.COLORS.PRIMARY}
                size={30}
              />
            ),
            title: s.strings.fragment_wallets_get_seed_wallet,
            message: (
              <Text>
                {s.strings.fragment_wallets_get_seed_wallet_first_confirm_message_mobile}
                <Text style={{ fontWeight: 'bold' }}>{walletName}</Text>
              </Text>
            ),
            input,
            yesButton,
            noButton,
            validateInput
          })
          const resolveValue = await launchModal(getSeedModal)
          if (resolveValue) {
            const wallet = CORE_SELECTORS.getWallet(state, walletId)
            const seed = wallet.getDisplayPrivateSeed()
            const modal = createSimpleConfirmModal({
              title: s.strings.fragment_wallets_get_seed_wallet,
              message: seed,
              buttonText: s.strings.string_ok,
              icon: (
                <FAIcon
                  style={{ position: 'relative', left: 1 }}
                  type={Constants.FONT_AWESOME}
                  name={Constants.GET_SEED}
                  color={THEME.COLORS.PRIMARY}
                  size={30}
                />
              )
            })
            await launchModal(modal)
          }
        } catch (e) {}
      }
    }

    case 'rename': {
      return async (dispatch: Dispatch, getState: GetState) => {
        try {
          const state = getState()
          const wallet = CORE_SELECTORS.getWallet(state, walletId)
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
        } catch (e) {
          console.log(e)
          console.log(e.title)
          dispatch(displayErrorAlert(e.message))
        }
      }
    }
  }
}
