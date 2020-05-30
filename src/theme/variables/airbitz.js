// @flow

import { Platform, StatusBar } from 'react-native'

import { scale } from '../../util/scaling.js'

/**
 * Calculates the height of the header (where the back button lives).
 */
export function getHeaderHeight() {
  if (Platform.OS === 'ios') {
    const majorVersionIOS = Number(Platform.Version)
    return majorVersionIOS > 9 && majorVersionIOS < 11 ? 62 : 44
  }
  return 56
}

// https://projects.invisionapp.com/d/main#/console/10954562/239168414/inspect
export const THEME = {
  rem(n: number) {
    return Math.round(n * scale(16))
  },

  BUTTONS: {
    HEIGHT: 44
  },

  HEADER: Platform.OS === 'ios' ? getHeaderHeight() : getHeaderHeight() + StatusBar.currentHeight,

  FOOTER_TABS_HEIGHT: 50,

  FONTS: {
    DEFAULT: 'SourceSansPro-Black',
    BOLD: 'SourceSansPro-Bold',
    SYMBOLS: Platform.OS === 'android' ? 'SF-UI-Text-Regular' : 'SourceSansPro-Black'
  },

  OPACITY: {
    ACTIVE: 0.3,
    MID: 0.5,
    MODAL_DARKNESS: 0.7
  },

  ALPHA: {
    MID: 50,
    LOW: 10
  },

  COLORS: {
    PRIMARY: '#0D2145',
    SECONDARY: '#0E4B75',
    PRIMARY_BUTTON_TOUCHED: 'rgba(42,87,153,0.55)',
    PRIMARY_BUTTON_2_TOUCHED: 'rgba(102,237,168,0.6)',
    BLUE_3: '#0E507D',

    GRADIENT: {
      DARK: '#0D2145',
      LIGHT: '#0E4B75'
    },

    ACCENT_BLUE: '#0073D9', // Airbitz blue
    ACCENT_ORANGE: '#F1AA19',
    ACCENT_RED: '#E85466',
    ACCENT_MINT: '#66EDA8',

    BLACK: '#25292C',
    GRAY_1: '#4A5157',
    GRAY_2: '#87939E',
    GRAY_3: '#D9E3ED',
    GRAY_4: '#F4F5F6',
    GRAY_5: '#353535',
    WHITE: '#FFFFFF',
    OFF_WHITE: '#F6F6F6',
    OPACITY_WHITE: 'rgba(255, 255, 255, 0.1)',
    OPAQUE_WHITE: 'rgba(255, 255, 255, 0.5)',
    OPAQUE_WHITE_2: 'rgba(255, 255, 255, 0.75)',
    OPAQUE_WHITE_3: 'rgba(255, 255, 255, 0.60)',
    OPACITY_GRAY_1: 'rgba(74, 81, 87, 0.1)',
    SHADOW: '#000000', // True black for crisp drop shadows

    TRANSPARENT: 'transparent',

    ROW_PRESSED: '#D9E3ED', // same as GRAY_3

    APP_STATUS_BAR: '#00000040',
    COUNTRY_SELECTION_MODAL_BLACK: '#000000', // Same as shadow but descriptive where it is used
    COUNTRY_SELECTION_MODAL_GRAY_1: '#D8D6D6',
    COUNTRY_SELECTION_MODAL_GRAY_2: '#58595C',
    CRYPTO_EXCHANGE_WALLET_LIST_ROW_OPAQUE_BLUE: 'rgba(14, 75, 117, 0.5)',
    FIO_ADDRESS_LIST_BORDER_BOTTOM: '#D8E2ED',
    FIO_ADDRESS_LIST_FONT: '#4B5158',
    HEADER_TEXT_SECONDARY: '#A4C7DF',
    QR_CODE_BACKGROUND: 'white',
    QR_CODE_FOREGROUND: 'black',
    SETTINGS_COMPONENT_GREY: '#CCCCCC',
    TRANSACTION_DETAILS_GREY_1: '#CCCCCC', // Same as SETTINGS_COMPONENT_GREY
    TRANSACTION_DETAILS_GREY_2: '#D8D6D6', // Same as COUNTRY_SELECTION_MODAL_GRAY_1
    TRANSACTION_DETAILS_GREY_3: '#58595C', // Same as COUNTRY_SELECTION_MODAL_GRAY_2
    TRANSACTION_DETAILS_GREY_4: '#EEE',
    TRANSACTION_DETAILS_SECONDARY: '#A4C7DF', // Same as HEADER_TEXT_SECONDARY
    TRANSACTION_LIST_RECEIVED_TX: '#77C513',
    TRANSACTION_LIST_SENT_TX: '#E85466',
    WALLET_LIST_DIFF_NEGATIVE: '#E85466', // Same as TRANSACTION_LIST_SENT_TX
    WALLET_LIST_DIFF_POSITIVE: '#77C513', // Same as TRANSACTION_LIST_RECEIVED_TX
    WALLET_LIST_GRAY: '#E9E9EF',
    WALLET_LIST_OPAQUE_BLUE: 'rgba(14, 75, 117, 0.5)' // Same as CRYPTO_EXCHANGE_WALLET_LIST_ROW_OPAQUE_BLUE
  }
}

export default THEME
