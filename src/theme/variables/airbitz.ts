import { scale } from '../../util/scaling'

export const THEME = {
  rem(n: number) {
    return Math.round(n * scale(16))
  },

  FONTS: {
    DEFAULT: 'SourceSansPro-Black',
    BOLD: 'SourceSansPro-Bold'
  },

  OPACITY: {
    MODAL_DARKNESS: 0.7
  },

  COLORS: {
    PRIMARY: '#0D2145',
    SECONDARY: '#0E4B75',
    ACCENT_MINT: '#66EDA8',

    BLACK: '#25292C',
    GRAY_1: '#4A5157',
    GRAY_2: '#87939E',
    GRAY_3: '#D9E3ED',
    GRAY_4: '#F4F5F6',
    GRAY_5: '#353535',
    WHITE: '#FFFFFF',
    OPACITY_GRAY_1: 'rgba(74, 81, 87, 0.1)',
    SHADOW: '#000000' // True black for crisp drop shadows
  }
}
