import Clipboard from '@react-native-clipboard/clipboard'
import * as React from 'react'
import { Linking } from 'react-native'
import { sprintf } from 'sprintf-js'

import { ButtonInfo, ButtonsModal } from '../components/modals/ButtonsModal'
import { RawTextModal } from '../components/modals/RawTextModal'
import { TextInputModal } from '../components/modals/TextInputModal'
import { Airship, showError, showToast } from '../components/services/AirshipInstance'
import { Alert } from '../components/themed/Alert'
import { ModalMessage } from '../components/themed/ModalParts'
import { deleteLoanAccount } from '../controllers/loan-manager/redux/actions'
import { lstrings } from '../locales/strings'
import { ThunkAction } from '../types/reduxTypes'
import { NavigationProp } from '../types/routerTypes'
import { getCurrencyCode } from '../util/CurrencyInfoHelpers'
import { getWalletName } from '../util/CurrencyWalletHelpers'
import { logActivity } from '../util/logger'
import { validatePassword } from './AccountActions'
import { showDeleteWalletModal } from './DeleteWalletModalActions'
import { showResyncWalletModal } from './ResyncWalletModalActions'
import { showSplitWalletModal } from './SplitWalletModalActions'

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
  | string // for split keys like splitbitcoincash, splitethereum, etc.

export function walletListMenuAction(
  navigation: NavigationProp<'walletList'> | NavigationProp<'transactionList'>,
  walletId: string,
  option: WalletListMenuKey,
  tokenId?: string
): ThunkAction<Promise<void>> {
  const switchString = option.startsWith('split') ? 'split' : option

  switch (switchString) {
    case 'manageTokens': {
      return async (dispatch, getState) => {
        navigation.navigate('manageTokens', {
          walletId
        })
      }
    }

    case 'rawDelete': {
      return async (dispatch, getState) => {
        const state = getState()
        const { account } = state.core
        account.changeWalletStates({ [walletId]: { deleted: true } }).catch(showError)
      }
    }
    case 'delete': {
      return async (dispatch, getState) => {
        const state = getState()
        const { account } = state.core
        const { currencyWallets } = state.core.account
        const wallet = currencyWallets[walletId]

        if (Object.values(currencyWallets).length === 1) {
          await Airship.show(bridge => (
            <ButtonsModal bridge={bridge} buttons={{}} closeArrow title={lstrings.cannot_delete_last_wallet_modal_title}>
              <ModalMessage>{lstrings.cannot_delete_last_wallet_modal_message_part_1}</ModalMessage>
              <ModalMessage>{lstrings.cannot_delete_last_wallet_modal_message_part_2}</ModalMessage>
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
            } catch (e: any) {
              fioAddress = ''
            }
          }
        }

        // Determine the modal's additional message
        let additionalMsg: string | undefined
        if (tokenId == null) {
          if (fioAddress) {
            additionalMsg = lstrings.fragmet_wallets_delete_fio_extra_message_mobile
          } else if (wallet.currencyInfo.metaTokens.length > 0) {
            additionalMsg = lstrings.fragmet_wallets_delete_eth_extra_message
          }
        }

        // Prompt user for action from modal
        const resolveValue = await dispatch(showDeleteWalletModal(walletId, additionalMsg))

        // Archive wallet or token if user confirmed action
        if (resolveValue === 'confirm') {
          if (tokenId == null) {
            account
              .changeWalletStates({ [walletId]: { deleted: true } })
              .then(r => {
                logActivity(`Archived Wallet ${account.username} -- ${getWalletName(wallet)} ${wallet.type} ${wallet.id}`)
              })
              .catch(showError)

            // Remove loan accounts associated with the wallet
            if (state.loanManager.loanAccounts[walletId] != null) {
              await dispatch(deleteLoanAccount(walletId))
            }
          } else {
            const newlyEnabledTokenIds = wallet.enabledTokenIds.filter(id => id !== tokenId)
            wallet
              .changeEnabledTokenIds(newlyEnabledTokenIds)
              .then(() => {
                logActivity(`Disable Token: ${getWalletName(wallet)} ${wallet.type} ${wallet.id} ${tokenId}`)
              })
              .catch(showError)
          }
        }
      }
    }

    case 'resync': {
      return async dispatch => {
        await dispatch(showResyncWalletModal(walletId))
      }
    }

    case 'split': {
      return async dispatch => {
        await dispatch(showSplitWalletModal(walletId, option.replace('split', '')))
      }
    }
    case 'viewPrivateViewKey':
    case 'viewXPub': {
      return async (dispatch, getState) => {
        const state = getState()
        const { account } = state.core
        const wallet = account.currencyWallets[walletId]
        const { xpubExplorer } = wallet.currencyInfo

        const displayPublicSeed = await account.getDisplayPublicKey(wallet.id)

        const copy: ButtonInfo = {
          label: lstrings.fragment_request_copy_title,
          type: 'secondary'
        }
        const link: ButtonInfo = {
          label: lstrings.transaction_details_show_advanced_block_explorer,
          type: 'secondary'
        }
        const buttons = xpubExplorer != null ? { copy, link } : { copy }

        const title = switchString === 'viewPrivateViewKey' ? lstrings.fragment_wallets_view_private_view_key : lstrings.fragment_wallets_view_xpub

        await Airship.show<'copy' | 'link' | undefined>(bridge => (
          <ButtonsModal bridge={bridge} buttons={buttons as { copy: ButtonInfo; link: ButtonInfo }} closeArrow message={displayPublicSeed} title={title}>
            {switchString === 'viewXPub' ? null : (
              <Alert
                type="warning"
                title={lstrings.string_warning}
                marginRem={0.5}
                message={sprintf(lstrings.fragment_wallets_view_private_view_key_warning_s, getWalletName(wallet))}
                numberOfLines={0}
              />
            )}
          </ButtonsModal>
        )).then(async result => {
          switch (result) {
            case 'copy':
              Clipboard.setString(displayPublicSeed)
              showToast(lstrings.fragment_wallets_pubkey_copied_title)
              break
            case 'link':
              if (xpubExplorer != null) {
                await Linking.openURL(sprintf(xpubExplorer, displayPublicSeed))
              }
              break
            case undefined:
              break
          }
        })
      }
    }

    case 'exportWalletTransactions': {
      return async (dispatch, getState) => {
        const state = getState()
        const { currencyWallets } = state.core.account
        const wallet = currencyWallets[walletId]
        navigation.navigate('transactionsExport', {
          sourceWallet: wallet,
          currencyCode: getCurrencyCode(wallet, tokenId)
        })
      }
    }

    case 'getSeed': {
      return async (dispatch, getState) => {
        const state = getState()
        const { account } = state.core
        const { currencyWallets } = account
        const wallet = currencyWallets[walletId]

        const passwordValid = await dispatch(
          validatePassword({
            title: lstrings.fragment_wallets_get_seed_title,
            submitLabel: lstrings.fragment_wallets_get_seed_wallet,
            warningMessage: lstrings.fragment_wallets_get_seed_warning_message
          })
        )

        if (passwordValid) {
          const { name, id, type } = wallet
          logActivity(`Show Master Private Key: ${account.username} -- ${name ?? ''} -- ${type} -- ${id}`)
          // Add a copy button only for development
          let devButtons = {}
          // @ts-expect-error
          if (global.__DEV__) devButtons = { copy: { label: lstrings.fragment_wallets_copy_seed } }

          const privateKey = await account.getDisplayPrivateKey(wallet.id)

          await Airship.show<'copy' | 'ok' | undefined>(bridge => (
            <ButtonsModal
              title={lstrings.fragment_wallets_get_seed_wallet}
              bridge={bridge}
              message={privateKey}
              buttons={{ ok: { label: lstrings.string_ok_cap }, ...devButtons }}
            />
          )).then(buttonPressed => {
            // @ts-expect-error
            if (global.__DEV__ && buttonPressed === 'copy') {
              // @ts-expect-error
              Clipboard.setString(wallet.displayPrivateSeed)
              showToast(lstrings.fragment_wallets_copied_seed)
            }
          })
        }
      }
    }

    case 'getRawKeys': {
      return async (dispatch, getState) => {
        const passwordValid = await dispatch(
          validatePassword({
            title: lstrings.fragment_wallets_get_raw_keys_title,
            warningMessage: lstrings.fragment_wallets_get_raw_keys_warning_message,
            submitLabel: lstrings.string_get_raw_keys
          })
        )
        if (passwordValid) {
          const state = getState()
          const { account } = state.core

          const rawKeys = await account.getRawPrivateKey(walletId)
          const keys = JSON.stringify(rawKeys, null, 2)
          await Airship.show(bridge => <RawTextModal bridge={bridge} body={keys} title={lstrings.string_raw_keys} disableCopy />)
        }
      }
    }

    case 'rename': {
      return async (dispatch, getState) => {
        const state = getState()
        const { currencyWallets } = state.core.account
        const wallet = currencyWallets[walletId]
        const walletName = getWalletName(wallet)

        await Airship.show<string | undefined>(bridge => (
          <TextInputModal
            autoCorrect={false}
            bridge={bridge}
            initialValue={walletName}
            inputLabel={lstrings.fragment_wallets_rename_wallet}
            returnKeyType="go"
            title={lstrings.fragment_wallets_rename_wallet}
            onSubmit={async name => {
              await wallet.renameWallet(name)
              return true
            }}
          />
        ))
      }
    }

    default:
      return async () => {}
  }
}
