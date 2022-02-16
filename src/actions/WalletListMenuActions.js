// @flow

import Clipboard from '@react-native-community/clipboard'
import * as React from 'react'
import { Linking } from 'react-native'
import { sprintf } from 'sprintf-js'

import { type ButtonInfo, ButtonsModal } from '../components/modals/ButtonsModal.js'
import { RawTextModal } from '../components/modals/RawTextModal.js'
import { TextInputModal } from '../components/modals/TextInputModal.js'
import { Airship, showError, showToast } from '../components/services/AirshipInstance.js'
import { ModalMessage } from '../components/themed/ModalParts.js'
import { MANAGE_TOKENS, TRANSACTIONS_EXPORT } from '../constants/SceneKeys.js'
import s from '../locales/strings.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'
import { validatePassword } from './AccountActions.js'
import { showDeleteWalletModal } from './DeleteWalletModalActions.js'
import { showResyncWalletModal } from './ResyncWalletModalActions.js'
import { showSplitWalletModal } from './SplitWalletModalActions.js'
import { refreshWallet } from './WalletActions.js'

export type WalletListMenuKey =
  | 'rename'
  | 'delete'
  | 'resync'
  | 'exportWalletTransactions'
  | 'getSeed'
  | 'manageTokens'
  | 'viewXPub'
  | 'getRawKeys'
  | 'rawDelete'
  | string // for split keys like splitBCH, splitETH, etc.

export function walletListMenuAction(walletId: string, option: WalletListMenuKey, currencyCode?: string) {
  const switchString = option.startsWith('split') ? 'split' : option

  switch (switchString) {
    case 'manageTokens': {
      return (dispatch: Dispatch, getState: GetState) => {
        Actions.push(MANAGE_TOKENS, {
          walletId
        })
      }
    }

    case 'rawDelete': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const { account } = state.core
        account.changeWalletStates({ [walletId]: { deleted: true } }).catch(showError)
      }
    }
    case 'delete': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const wallets = state.ui.wallets.byId
        const wallet = wallets[walletId]

        if (Object.values(wallets).length === 1) {
          Airship.show(bridge => (
            <ButtonsModal bridge={bridge} buttons={{}} closeArrow title={s.strings.cannot_delete_last_wallet_modal_title}>
              <ModalMessage>{s.strings.cannot_delete_last_wallet_modal_message_part_1}</ModalMessage>
              <ModalMessage>{s.strings.cannot_delete_last_wallet_modal_message_part_2}</ModalMessage>
            </ButtonsModal>
          ))
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
      return async (dispatch: Dispatch) => {
        dispatch(showSplitWalletModal(walletId, option.replace('split', '')))
      }
    }

    case 'viewXPub': {
      return (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const { currencyWallets } = state.core.account
        const { displayPublicSeed, currencyInfo } = currencyWallets[walletId]
        const { xpubExplorer } = currencyInfo

        const copy: ButtonInfo = {
          label: s.strings.fragment_request_copy_title,
          type: 'secondary'
        }
        const link: ButtonInfo = {
          label: s.strings.transaction_details_show_advanced_block_explorer,
          type: 'secondary'
        }
        Airship.show(bridge => (
          <ButtonsModal
            bridge={bridge}
            buttons={xpubExplorer != null ? { copy, link } : { copy }}
            closeArrow
            message={displayPublicSeed ?? ''}
            title={s.strings.fragment_wallets_view_xpub}
          />
        )).then((result: 'copy' | 'link' | void) => {
          switch (result) {
            case 'copy':
              Clipboard.setString(displayPublicSeed)
              showToast(s.strings.fragment_wallets_pubkey_copied_title)
              break
            case 'link':
              if (xpubExplorer != null) Linking.openURL(sprintf(currencyInfo.xpubExplorer, displayPublicSeed))
          }
        })
      }
    }

    case 'exportWalletTransactions': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const { currencyWallets } = state.core.account
        const wallet = currencyWallets[walletId]
        Actions.push(TRANSACTIONS_EXPORT, {
          sourceWallet: wallet,
          currencyCode: currencyCode ?? ''
        })
      }
    }

    case 'getSeed': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const { account } = state.core
        const { currencyWallets } = account
        const wallet = currencyWallets[walletId]

        const passwordValid = await dispatch(
          validatePassword({
            title: s.strings.fragment_wallets_get_seed_title,
            submitLabel: s.strings.fragment_wallets_get_seed_wallet,
            warning: s.strings.fragment_wallets_get_seed_warning_message
          })
        )

        if (passwordValid) {
          await Airship.show(bridge => (
            <ButtonsModal
              title={s.strings.fragment_wallets_get_seed_wallet}
              bridge={bridge}
              message={wallet.displayPrivateSeed ?? ''}
              buttons={{ ok: { label: s.strings.string_ok_cap } }}
            />
          ))
        }
      }
    }

    case 'getRawKeys': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const passwordValid = await dispatch(
          validatePassword({
            title: s.strings.fragment_wallets_get_raw_keys_title,
            warning: s.strings.fragment_wallets_get_raw_keys_warning_message,
            submitLabel: s.strings.string_get_raw_keys
          })
        )
        if (passwordValid) {
          const state = getState()
          const { account } = state.core

          const keys = account.allKeys.find(key => key.id === walletId)
          const seed = keys ? JSON.stringify(keys.keys, null, 2) : ''
          Airship.show(bridge => <RawTextModal bridge={bridge} body={seed} title={s.strings.string_raw_keys} disableCopy />)
        }
      }
    }

    case 'rename': {
      return async (dispatch: Dispatch, getState: GetState) => {
        const state = getState()
        const { currencyWallets } = state.core.account
        const wallet = currencyWallets[walletId]
        const walletName = wallet.name ?? ''

        await Airship.show(bridge => (
          <TextInputModal
            autoCorrect={false}
            bridge={bridge}
            initialValue={walletName}
            inputLabel={s.strings.fragment_wallets_rename_wallet}
            returnKeyType="go"
            title={s.strings.fragment_wallets_rename_wallet}
            onSubmit={async name => {
              await wallet.renameWallet(name)
              dispatch(refreshWallet(walletId))
              return true
            }}
          />
        ))
      }
    }

    default:
      return (dispatch: Dispatch) => undefined
  }
}
