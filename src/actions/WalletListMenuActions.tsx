import Clipboard from '@react-native-clipboard/clipboard'
import { EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { Linking } from 'react-native'
import { sprintf } from 'sprintf-js'

import { ButtonInfo, ButtonsModal } from '../components/modals/ButtonsModal'
import { RawTextModal } from '../components/modals/RawTextModal'
import { TextInputModal } from '../components/modals/TextInputModal'
import { Airship, showError, showToast } from '../components/services/AirshipInstance'
import { Alert } from '../components/themed/Alert'
import { Paragraph } from '../components/themed/EdgeText'
import { deleteLoanAccount } from '../controllers/loan-manager/redux/actions'
import { lstrings } from '../locales/strings'
import { ThunkAction } from '../types/reduxTypes'
import { WalletsTabSceneProps } from '../types/routerTypes'
import { getCurrencyCode } from '../util/CurrencyInfoHelpers'
import { getWalletName } from '../util/CurrencyWalletHelpers'
import { logActivity } from '../util/logger'
import { validatePassword } from './AccountActions'
import { showDeleteWalletModal } from './DeleteWalletModalActions'
import { showResyncWalletModal } from './ResyncWalletModalActions'
import { showScamWarningModal } from './ScamWarningActions'
import { toggleUserPausedWallet } from './SettingsActions'

export type WalletListMenuKey =
  | 'rename'
  | 'delete'
  | 'resync'
  | 'exportWalletTransactions'
  | 'getSeed'
  | 'manageTokens'
  | 'viewXPub'
  | 'goToParent'
  | 'getRawKeys'
  | 'rawDelete'
  | 'togglePause'
  | string // for split keys like splitbitcoincash, splitethereum, etc.

export function walletListMenuAction(
  navigation: WalletsTabSceneProps<'walletList' | 'transactionList'>['navigation'],
  walletId: string,
  option: WalletListMenuKey,
  tokenId: EdgeTokenId,
  splitPluginIds: string[]
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
        account.changeWalletStates({ [walletId]: { deleted: true } }).catch(error => showError(error))
      }
    }
    case 'delete': {
      return async (dispatch, getState) => {
        const state = getState()
        const { account } = state.core
        const { currencyWallets } = state.core.account
        const wallet = currencyWallets[walletId]

        if (Object.values(currencyWallets).length === 1) {
          await Airship.show<'ok' | undefined>(bridge => (
            <ButtonsModal bridge={bridge} buttons={{ ok: { label: lstrings.string_ok_cap } }} closeArrow title={lstrings.cannot_delete_last_wallet_modal_title}>
              <Paragraph>{lstrings.cannot_delete_last_wallet_modal_message_part_1}</Paragraph>
              <Paragraph>{lstrings.cannot_delete_last_wallet_modal_message_part_2}</Paragraph>
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
        let tokenCurrencyCode: string | undefined
        if (tokenId == null) {
          if (fioAddress) {
            additionalMsg = lstrings.fragmet_wallets_delete_fio_extra_message_mobile
          } else if (Object.keys(wallet.currencyConfig.allTokens).length > 0) {
            additionalMsg = lstrings.fragmet_wallets_delete_eth_extra_message
          }
        } else {
          tokenCurrencyCode = getCurrencyCode(wallet, tokenId)
        }
        // Prompt user for action from modal
        const resolveValue = await dispatch(showDeleteWalletModal(walletId, tokenCurrencyCode, additionalMsg))

        // Archive wallet or token if user confirmed action
        if (resolveValue === 'confirm') {
          if (tokenId == null) {
            account
              .changeWalletStates({ [walletId]: { deleted: true } })
              .then(r => {
                logActivity(`Archived Wallet ${account.username} -- ${getWalletName(wallet)} ${wallet.type} ${wallet.id}`)
              })
              .catch(error => showError(error))

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
              .catch(error => showError(error))
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
      return async () => {
        navigation.navigate('createWalletSelectCrypto', {
          disableLegacy: true,
          splitPluginIds,
          splitSourceWalletId: walletId
        })
      }
    }
    case 'viewPrivateViewKey':
    case 'viewXPub': {
      return async (dispatch, getState) => {
        const state = getState()
        const { account } = state.core
        const wallet = account.currencyWallets[walletId]
        const { xpubExplorer } = wallet.currencyInfo

        // Show the scam warning modal if needed
        await showScamWarningModal('firstPrivateKeyView')

        const displayPublicSeed = await account.getDisplayPublicKey(wallet.id)

        const copy: ButtonInfo = {
          label: lstrings.fragment_request_copy_title
        }
        const link: ButtonInfo = {
          label: lstrings.transaction_details_show_advanced_block_explorer
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

        // Show the scam warning modal if needed
        await showScamWarningModal('firstPrivateKeyView')

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
              Clipboard.setString(privateKey)
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

    case 'goToParent': {
      return async (dispatch, getState) => {
        const state = getState()
        const { account } = state.core
        const { currencyWallets } = account
        const wallet = currencyWallets[walletId]

        navigation.navigate('transactionList', {
          walletId,
          tokenId: null,
          walletName: getWalletName(wallet)
        })
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

    case 'togglePause': {
      return async (dispatch, getState) => {
        const state = getState()
        const { account } = state.core
        await dispatch(toggleUserPausedWallet(account, walletId))
      }
    }

    default:
      return async () => {}
  }
}
