import unusedStrings from './en_US.unused';

const strings = {
  settings_button_logout: "Logout",
  settings_title: "Settings",
  drawer_exchange_rate_loading: "Exchange Rate Loading",
  string_cancel: "CANCEL",
  string_show_balance: "Show Balance",
  fragment_request_subtitle: "Request",
  fragment_send_subtitle: "Send",
  fragment_transaction_list_sent_prefix: "Sent ",
  fragment_transaction_list_receive_prefix: "Received ",
  fragment_wallet_unconfirmed: "Pending",
  string_help: "Help",
  fragment_transaction_income: "Income",
  fragment_transaction_expense: "Expense",
  fragment_transaction_exchange: "Exchange",
  fragment_transaction_transfer: "Transfer",
  request_qr_waiting_for_payment: "Waiting for Payment…",
  bitcoin_remaining: "%1$s Remaining…",
  bitcoin_received: "%1$s Received",
  fragment_request_copy_title: "Copy",
  string_share: "Share",
  send_to_title: "To:",
  send_confirmation_slide_to_confirm: "Slide to Confirm",
  string_cancel_cap: "Cancel",
  string_done_cap: "Done",
  send_scan_header_text: "Scan, to Send, import, or Edge Login",
  fragment_send_address: "Address",
  fragment_send_flash: "Flash",
  string_rename: "Rename",
  fragment_wallets_sort: "Sort",
  string_delete: "Delete",
  fragmet_wallets_managetokens_option: "Manage Tokens",
  fragmet_wallets_delete_wallet_first_confirm_message_mobile: "Are you sure you want to delete ",
  fragment_wallets_this_wallet: "this wallet?",
  calculator_done: "Done",
  fragment_wallets_addwallet_name_hint: "New Wallet Name",
  fragment_wallets_addwallet_fiat_hint: "Choose a fiat currency",
  fragment_create_wallet_create_wallet: "Create Wallet",
  fragment_create_wallet_select_valid: "Please select valid data",
  string_disable: "DISABLE",
  settings_denominations_title: "Denominations",
  settings_select_currency: "Select a currency",
  change_mining_fee_title: "Change Mining Fee",
  send_confirmation_max_button_title: "Send Max Amount",
  help_version: "Version",
  help_build: "Build",
  help_modal_title: "Crypto Wallet and Directory",
  fragment_wallets_rename_wallet: "Rename Wallet",
  fragment_wallets_balance_text: "Total Balance",
  fragment_wallets_header: "My Wallets",
  fragment_wallets_delete_wallet: "Delete Wallet",
  loading: "Loading…",
  fragment_send_address_dialog_title: "Send to Public Address",
  select_src_wallet: "Select Source Wallet",
  select_dest_wallet: "Select Dest Wallet",
  dropdown_exchange_max_amount: "Exchange Max Amount",
  fragmet_wallets_list_archive_title_capitalized: "Archive",
  settings_button_change_password: "Change password",
  settings_button_pin: "Change PIN",
  settings_button_setup_two_factor: "Setup 2 Factor",
  settings_title_pin_login: "PIN Re-login",
  settings_button_use_touchID: "Use TouchID",
  settings_title_auto_logoff: "Auto log off after",
  settings_account_title_cap: "Account",
  settings_options_title_cap: "Options",
  settings_title_currency: "Default Currency",
  settings_button_send_logs: "Send logs",
  settings_button_debug: "Debug",
  settings_modal_send_logs_title: "Send logs?"
}

/*
  Checks if string is placed in en_US.unused.js,
  use it and shows warn
 */
const handler = {
  get(target, propKey, receiver) {
    if (!target[propKey]) {
      if (unusedStrings[propKey] !== undefined) {
        console.warn(`Please move string "${propKey}" from "en_US.unused.js" to "en_US.js"`);
        return unusedStrings[propKey]
      }
      return undefined;
    }
    return target[propKey];
  }
}

export default new Proxy(strings, handler)
